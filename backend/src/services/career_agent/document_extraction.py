"""Local-first private document extraction for Career Agent imports.

Text documents are parsed on the server without an AI provider. Image analysis
uses NVIDIA only when local OCR is insufficient and the caller explicitly
permits image reasoning.
"""

from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
from io import BytesIO
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
from typing import Any, Dict, Iterable, List, Optional, Tuple
import uuid
import zipfile

from werkzeug.utils import secure_filename

from .nvidia_client import NvidiaClient, NvidiaResult
from .prompts.document_extraction import build_document_extraction_prompt
from .schemas import clean_list, clean_text, json_object


class UnsupportedCareerDocument(ValueError):
    """Raised when an uploaded file is unsafe or unsupported."""


class CareerDocumentExtractionError(RuntimeError):
    """Raised when a supported document cannot be read locally."""


ALLOWED_EXTENSIONS = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc": "application/msword",
    ".txt": "text/plain",
    ".rtf": "application/rtf",
    ".odt": "application/vnd.oasis.opendocument.text",
    ".md": "text/markdown",
    ".markdown": "text/markdown",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


@dataclass
class ExtractionResult:
    filename: str
    content_type: str
    raw_bytes: bytes
    content_hash: str
    extracted_text: str
    extracted_data: Dict[str, Any]
    method: str
    image_analysis_result: Optional[NvidiaResult] = None


class PrivateCareerFileStore:
    """Private server filesystem store; paths are never sent to a client."""

    def __init__(self, root: Optional[str] = None):
        configured_root = root or os.getenv("CAREER_AGENT_STORAGE_DIR")
        self.root = Path(configured_root or Path(__file__).resolve().parents[3] / "private_career_files").resolve()

    def save(self, *, user_id: int, filename: str, payload: bytes) -> str:
        safe_name = secure_filename(filename) or "career-document.bin"
        token = uuid.uuid4().hex
        relative = Path(str(user_id)) / f"{token}_{safe_name}"
        target = (self.root / relative).resolve()
        if self.root not in target.parents:
            raise CareerDocumentExtractionError("Invalid private storage path.")
        target.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        with target.open("xb") as handle:
            handle.write(payload)
        try:
            os.chmod(target, 0o600)
        except OSError:
            pass
        return str(relative)

    def delete(self, storage_key: str) -> None:
        target = (self.root / storage_key).resolve()
        if self.root not in target.parents or not target.exists() or not target.is_file():
            return
        # Best-effort overwrite before unlinking; SSD/cloud media may not guarantee physical erasure.
        try:
            length = target.stat().st_size
            with target.open("r+b") as handle:
                handle.write(b"\0" * length)
                handle.flush()
                os.fsync(handle.fileno())
        except OSError:
            pass
        target.unlink(missing_ok=True)


class ImageAnalysisService:
    """Fallback for unreadable career-document images, using the central client."""

    def __init__(self, client: NvidiaClient | None = None):
        self.client = client or NvidiaClient()

    def extract_structured_career_information(self, image_bytes: bytes, mime_type: str) -> NvidiaResult:
        instruction = (
            "Extract all readable career information from this document image. Preserve names, dates, institutions, "
            "job titles, employers, qualifications, and other relevant facts. Do not invent missing information. "
            "Use empty fields or arrays where unreadable."
        )
        return self.client.complete_json(
            build_document_extraction_prompt(instruction),
            image_bytes=image_bytes,
            image_mime_type=mime_type,
            max_tokens=8192,
            temperature=0.1,
        )


class CareerExtractionService:
    """Safely extracts local document text and creates reviewable structured data."""

    def __init__(self, image_analysis_service: ImageAnalysisService | None = None):
        self.image_analysis_service = image_analysis_service or ImageAnalysisService()

    @staticmethod
    def _extension(filename: str) -> str:
        return Path(filename or "").suffix.lower()

    def validate_upload(self, filename: str, payload: bytes, claimed_mime: Optional[str] = None) -> Tuple[str, str]:
        filename = secure_filename(filename or "")
        extension = self._extension(filename)
        if not filename or extension not in ALLOWED_EXTENSIONS:
            raise UnsupportedCareerDocument("Supported formats: PDF, DOCX, DOC, TXT, RTF, ODT, Markdown, PNG, JPG, JPEG, and WEBP.")
        if not payload:
            raise UnsupportedCareerDocument("The uploaded document is empty.")
        if len(payload) > MAX_UPLOAD_BYTES:
            raise UnsupportedCareerDocument("File size exceeds the 10 MB limit.")
        if extension == ".pdf" and not payload.startswith(b"%PDF"):
            raise UnsupportedCareerDocument("The uploaded PDF has an invalid file signature.")
        if extension in {".docx", ".odt"}:
            try:
                with zipfile.ZipFile(BytesIO(payload)) as archive:
                    names = set(archive.namelist())
                    required = "word/document.xml" if extension == ".docx" else "content.xml"
                    if required not in names:
                        raise UnsupportedCareerDocument("The uploaded office document is invalid.")
            except zipfile.BadZipFile as exc:
                raise UnsupportedCareerDocument("The uploaded office document is invalid.") from exc
        if extension == ".rtf" and not payload.lstrip().startswith(b"{\\rtf"):
            raise UnsupportedCareerDocument("The uploaded RTF has an invalid file signature.")
        if extension in IMAGE_EXTENSIONS:
            self._validate_image(payload)
        return filename, ALLOWED_EXTENSIONS[extension]

    @staticmethod
    def _validate_image(payload: bytes) -> None:
        try:
            from PIL import Image
        except ImportError as exc:
            raise CareerDocumentExtractionError("Image support is not installed on this server.") from exc
        try:
            with Image.open(BytesIO(payload)) as image:
                image.verify()
        except Exception as exc:
            raise UnsupportedCareerDocument("The uploaded image cannot be decoded safely.") from exc

    def extract_upload(
        self,
        *,
        filename: str,
        payload: bytes,
        claimed_mime: Optional[str] = None,
        allow_image_analysis: bool = True,
    ) -> ExtractionResult:
        filename, content_type = self.validate_upload(filename, payload, claimed_mime)
        extension = self._extension(filename)
        image_result = None
        if extension == ".pdf":
            text = self._extract_pdf(payload)
            method = "local_pdfplumber"
        elif extension == ".docx":
            text = self._extract_docx(payload)
            method = "local_python_docx"
        elif extension == ".doc":
            text = self._extract_doc(payload)
            method = "local_antiword"
        elif extension in {".txt", ".md", ".markdown"}:
            text = self._extract_plain_text(payload)
            method = "local_text"
        elif extension == ".rtf":
            text = self._extract_rtf(payload)
            method = "local_rtf"
        elif extension == ".odt":
            text = self._extract_odt(payload)
            method = "local_odf"
        else:
            text = self._extract_image_ocr(payload)
            method = "local_ocr"
            if allow_image_analysis and len(text.strip()) < 80:
                image_result = self.image_analysis_service.extract_structured_career_information(payload, content_type)
                structured = self._normalize_image_structure(image_result.data)
                return ExtractionResult(
                    filename=filename,
                    content_type=content_type,
                    raw_bytes=payload,
                    content_hash=sha256(payload).hexdigest(),
                    extracted_text=text,
                    extracted_data=structured,
                    method="local_ocr+nvidia_image_analysis",
                    image_analysis_result=image_result,
                )
        text = self._normalize_text(text)
        if not text:
            raise CareerDocumentExtractionError("No readable text was found. Try a clearer document image or a text-based file.")
        return ExtractionResult(
            filename=filename,
            content_type=content_type,
            raw_bytes=payload,
            content_hash=sha256(payload).hexdigest(),
            extracted_text=text,
            extracted_data=self._structure_text(text),
            method=method,
            image_analysis_result=image_result,
        )

    @staticmethod
    def _normalize_text(raw: str) -> str:
        text = (raw or "").replace("\x00", " ")
        text = text.encode("utf-8", errors="ignore").decode("utf-8", errors="ignore")
        text = re.sub(r"\r\n?", "\n", text)
        text = re.sub(r"[\t\f\v]+", " ", text)
        text = re.sub(r"[ ]{2,}", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    @staticmethod
    def _extract_pdf(payload: bytes) -> str:
        try:
            import pdfplumber
        except ImportError as exc:
            raise CareerDocumentExtractionError("PDF extraction support is not installed on this server.") from exc
        try:
            with pdfplumber.open(BytesIO(payload)) as pdf:
                return "\n\n".join((page.extract_text() or "") for page in pdf.pages)
        except Exception as exc:
            raise CareerDocumentExtractionError("The PDF could not be read locally.") from exc

    @staticmethod
    def _extract_docx(payload: bytes) -> str:
        try:
            from docx import Document
        except ImportError as exc:
            raise CareerDocumentExtractionError("DOCX extraction support is not installed on this server.") from exc
        try:
            document = Document(BytesIO(payload))
            parts = [paragraph.text for paragraph in document.paragraphs if paragraph.text.strip()]
            for table in document.tables:
                for row in table.rows:
                    cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if cells:
                        parts.append(" | ".join(cells))
            return "\n".join(parts)
        except Exception as exc:
            raise CareerDocumentExtractionError("The DOCX file could not be read locally.") from exc

    @staticmethod
    def _extract_doc(payload: bytes) -> str:
        antiword = shutil.which("antiword")
        if not antiword:
            raise CareerDocumentExtractionError("Legacy .DOC import requires the server's antiword package. Please upload DOCX or PDF instead.")
        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".doc", delete=False) as handle:
                handle.write(payload)
                temp_path = handle.name
            result = subprocess.run([antiword, temp_path], capture_output=True, text=True, timeout=30, check=False)
            if result.returncode != 0:
                raise CareerDocumentExtractionError("The legacy .DOC file could not be read locally.")
            return result.stdout
        except subprocess.TimeoutExpired as exc:
            raise CareerDocumentExtractionError("Legacy .DOC extraction timed out.") from exc
        finally:
            if temp_path:
                try:
                    os.unlink(temp_path)
                except OSError:
                    pass

    @staticmethod
    def _extract_plain_text(payload: bytes) -> str:
        for encoding in ("utf-8-sig", "utf-16", "latin-1"):
            try:
                return payload.decode(encoding)
            except UnicodeDecodeError:
                continue
        return payload.decode("utf-8", errors="ignore")

    @staticmethod
    def _extract_rtf(payload: bytes) -> str:
        raw = CareerExtractionService._extract_plain_text(payload)
        try:
            from striprtf.striprtf import rtf_to_text
            return rtf_to_text(raw)
        except ImportError:
            # Conservative fallback strips RTF control words without sending it to AI.
            text = re.sub(r"\\'[0-9a-fA-F]{2}", " ", raw)
            text = re.sub(r"\\[a-zA-Z]+-?\d* ?", " ", text)
            return text.replace("{", " ").replace("}", " ")

    @staticmethod
    def _extract_odt(payload: bytes) -> str:
        try:
            from odf import teletype
            from odf.opendocument import load
        except ImportError as exc:
            raise CareerDocumentExtractionError("ODT extraction support is not installed on this server.") from exc
        try:
            document = load(BytesIO(payload))
            return teletype.extractText(document.text)
        except Exception as exc:
            raise CareerDocumentExtractionError("The ODT file could not be read locally.") from exc

    @staticmethod
    def _extract_image_ocr(payload: bytes) -> str:
        try:
            import pytesseract
            from PIL import Image
        except ImportError as exc:
            raise CareerDocumentExtractionError("Local image OCR support is not installed on this server.") from exc
        try:
            with Image.open(BytesIO(payload)) as image:
                return pytesseract.image_to_string(image)
        except Exception as exc:
            raise CareerDocumentExtractionError("The image could not be processed by local OCR.") from exc

    @staticmethod
    def _empty_structure() -> Dict[str, Any]:
        return {
            "education": [], "experience": [], "skills": [], "certifications": [], "projects": [],
            "achievements": [], "languages": [], "contact": {}, "links": [], "other": [],
        }

    def _structure_text(self, text: str) -> Dict[str, Any]:
        """Deterministic heading and pattern extraction; never manufactures facts."""
        result = self._empty_structure()
        lines = [clean_text(line, maximum=1200) for line in text.splitlines()]
        lines = [line for line in lines if line]
        email_match = re.search(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", text)
        phone_match = re.search(r"(?<!\w)(?:\+?\d[\d\s().-]{6,}\d)", text)
        if email_match:
            result["contact"]["email"] = email_match.group(0)
        if phone_match:
            result["contact"]["phone"] = clean_text(phone_match.group(0), maximum=60)
        result["links"] = re.findall(r"https?://[^\s)>]+|(?:www\.)[^\s)>]+", text, flags=re.IGNORECASE)[:12]

        aliases = {
            "experience": {"experience", "work experience", "employment history", "professional experience", "work history"},
            "education": {"education", "academic background", "qualifications"},
            "skills": {"skills", "technical skills", "core competencies", "competencies", "key skills"},
            "certifications": {"certifications", "certificates", "licenses", "training"},
            "projects": {"projects", "selected projects", "portfolio"},
            "achievements": {"awards", "achievements", "honors", "accomplishments"},
            "languages": {"languages", "language skills"},
        }
        current = "other"
        buckets: Dict[str, List[str]] = {key: [] for key in result.keys() if key not in {"contact", "links"}}
        for line in lines:
            normalized = re.sub(r"[:\-–—]+$", "", line.strip()).casefold()
            found = next((key for key, labels in aliases.items() if normalized in labels), None)
            if found:
                current = found
                continue
            buckets[current].append(line)

        result["skills"] = self._split_list_entries(buckets["skills"])
        result["languages"] = [{"language": item, "proficiency": ""} for item in self._split_list_entries(buckets["languages"])]
        for category in ("experience", "education", "certifications", "projects", "achievements"):
            result[category] = self._section_entries(buckets[category], category)
        result["other"] = buckets["other"][:80]
        return result

    @staticmethod
    def _split_list_entries(lines: List[str]) -> List[str]:
        entries = []
        for line in lines:
            entries.extend(re.split(r"\s*[•·|,;]\s*", line.lstrip("-–• ")))
        return clean_list(entries, maximum_items=80, item_maximum=180)

    @staticmethod
    def _section_entries(lines: List[str], category: str) -> List[Dict[str, Any]]:
        entries = []
        current: List[str] = []
        for line in lines:
            is_new_entry = bool(re.search(r"\b(?:19|20)\d{2}\b", line)) and bool(current)
            if is_new_entry:
                entries.append(current)
                current = []
            current.append(line)
        if current:
            entries.append(current)
        structured = []
        for index, entry_lines in enumerate(entries[:30]):
            text = "\n".join(entry_lines)
            dates = re.findall(r"\b(?:19|20)\d{2}(?:[-/.]\d{1,2})?\b", text)
            base = {"raw_text": text, "source_index": index, "dates_detected": dates}
            if category == "experience":
                base.update({"job_title": entry_lines[0], "organization": "", "responsibilities": entry_lines[1:]})
            elif category == "education":
                base.update({"qualification": entry_lines[0], "institution": "", "details": entry_lines[1:]})
            elif category == "certifications":
                base.update({"name": entry_lines[0], "details": entry_lines[1:]})
            elif category == "projects":
                base.update({"name": entry_lines[0], "details": entry_lines[1:]})
            else:
                base.update({"title": entry_lines[0], "details": entry_lines[1:]})
            structured.append(base)
        return structured

    @staticmethod
    def _normalize_image_structure(value: Any) -> Dict[str, Any]:
        raw = json_object(value, name="image extraction")
        result = CareerExtractionService._empty_structure()
        for key in result:
            source = raw.get(key)
            if key == "contact":
                result[key] = source if isinstance(source, dict) else {}
            elif key == "links":
                result[key] = clean_list(source, maximum_items=12, item_maximum=300)
            elif key == "languages":
                result[key] = source[:30] if isinstance(source, list) else []
            elif isinstance(source, list):
                result[key] = source[:50]
        return result


def find_profile_conflicts(extracted: Dict[str, Any], candidate: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Return reviewable differences; never silently alter the platform profile."""
    conflicts = []
    contact = extracted.get("contact") if isinstance(extracted.get("contact"), dict) else {}
    identity = candidate.get("identity") if isinstance(candidate.get("identity"), dict) else {}
    for source_key, profile_key, label in (("email", "email", "Email"), ("phone", "phone", "Phone")):
        imported = clean_text(contact.get(source_key), maximum=160)
        existing = clean_text(identity.get(profile_key), maximum=160)
        if imported and existing and imported.casefold() != existing.casefold():
            conflicts.append({"field": source_key, "label": label, "existing": existing, "imported": imported, "action": "user_confirmation_required"})
    return conflicts

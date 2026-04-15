from flask import Blueprint, jsonify, request

from src.routes.auth import token_required
from src.services.vercel_blob_storage_service import VercelBlobStorageError, upload_user_document

upload_bp = Blueprint('upload', __name__)


@upload_bp.route('/documents', methods=['POST'])
@token_required
def upload_document(current_user):
    """Upload authenticated user documents to Vercel Blob."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'file is required'}), 400

        file_obj = request.files['file']
        if not file_obj or not file_obj.filename:
            return jsonify({'error': 'No file provided'}), 400

        document_type = (request.form.get('type') or 'document').strip().lower()
        allowed_types = {'resume', 'portfolio', 'cover-letter', 'document'}
        if document_type not in allowed_types:
            return jsonify({'error': 'Invalid document type'}), 400

        allowed_mime_types = {
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/png',
            'image/jpeg',
            'image/webp',
            'text/plain',
            'application/zip',
        }
        if file_obj.mimetype not in allowed_mime_types:
            return jsonify({'error': 'Unsupported file type'}), 400

        file_obj.seek(0, 2)
        size = file_obj.tell()
        file_obj.seek(0)
        max_size = 10 * 1024 * 1024
        if size > max_size:
            return jsonify({'error': 'File too large. Maximum size is 10MB'}), 400

        upload_result = upload_user_document(file_obj, current_user.id, document_type)

        return jsonify({
            'message': 'File uploaded successfully',
            'url': upload_result['url'],
            'pathname': upload_result.get('pathname'),
            'content_type': upload_result.get('content_type'),
            'size': upload_result.get('size', size),
        }), 201
    except VercelBlobStorageError as exc:
        return jsonify({'error': f'Blob upload failed: {exc}'}), 502
    except Exception as exc:
        return jsonify({'error': 'Failed to upload file', 'details': str(exc)}), 500

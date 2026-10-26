"""The only NVIDIA inference transport used by the Career Agent."""

from __future__ import annotations

from dataclasses import dataclass
import base64
import json
import os
import time
from typing import Any, Dict, Optional

import requests

from .schemas import SchemaValidationError, extract_json_from_model_text


def _env_int(name: str, default: int, *, minimum: int = 0) -> int:
    """Read a bounded integer setting without allowing a bad env to crash boot."""
    raw = os.getenv(name)
    try:
        value = int(raw) if raw not in (None, "") else default
    except (TypeError, ValueError):
        value = default
    return max(minimum, value)


class AIProviderUnavailable(RuntimeError):
    """Raised when the server-side NVIDIA configuration is unavailable."""

    code = "AI_PROVIDER_UNAVAILABLE"
    retryable = True


class AIProviderNotConfigured(AIProviderUnavailable):
    """Raised when the required NVIDIA_API_KEY is missing or blank."""

    code = "AI_PROVIDER_NOT_CONFIGURED"
    retryable = False


class AIProviderError(RuntimeError):
    """Raised for a provider failure without retaining personal prompt data."""

    code = "AI_PROVIDER_ERROR"


class AIRateLimited(AIProviderError):
    """The provider is rate limiting requests; the caller should back off."""

    code = "AI_RATE_LIMITED"


@dataclass
class NvidiaResult:
    data: Dict[str, Any]
    model: str
    latency_ms: int
    prompt_tokens: Optional[int]
    completion_tokens: Optional[int]
    total_tokens: Optional[int]
    retry_count: int


@dataclass
class NvidiaTextResult:
    content: str
    reasoning_content: str
    tool_calls: list[Dict[str, Any]]
    model: str
    latency_ms: int
    prompt_tokens: Optional[int]
    completion_tokens: Optional[int]
    total_tokens: Optional[int]
    finish_reason: Optional[str]
    retry_count: int


class NvidiaClient:
    """Server-only NVIDIA inference client with structured-output handling.

    Uses NVIDIA text inference for normal Career Agent calls and a separate
    multimodal model only when an image is supplied.
    Callers pass prompts built in `prompts/`; no feature may call
    `requests.post` against the NVIDIA endpoint directly.
    """

    endpoint = "https://integrate.api.nvidia.com/v1/chat/completions"
    # Text generation is the common path for Career Agent. Keep the
    # multimodal model for image extraction, but use NVIDIA's faster text
    # endpoint for the many CV/matching calls so one busy vision endpoint does
    # not take down the whole generation pipeline.
    default_model = "nvidia/nemotron-3.5-lightning-30b-a3b"
    default_vision_model = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"
    default_reasoning_budget = 2048
    # Bounded token caps keep the streaming pipeline responsive. NVIDIA's
    # endpoint is measurably slower when the output budget is set to its
    # maximum, and the structured JSON answers do not need 16k tokens.
    # Operators can raise these through the environment when they prefer
    # maximum headroom over latency.
    default_max_tokens = 8192
    default_temperature = 0.2
    retryable_statuses = {408, 429, 500, 502, 503, 504}

    def __init__(self, *, api_key: Optional[str] = None, timeout: int = 80):
        raw_api_key = api_key if api_key is not None else os.getenv("NVIDIA_API_KEY")
        self.api_key = raw_api_key.strip() if isinstance(raw_api_key, str) else raw_api_key
        self.endpoint = type(self).endpoint
        self.model = type(self).default_model
        self.vision_model = os.getenv("NVIDIA_VISION_MODEL") or self.default_vision_model
        self.reasoning_budget = _env_int("NVIDIA_REASONING_BUDGET", self.default_reasoning_budget, minimum=256)
        self.max_tokens = _env_int("NVIDIA_MAX_TOKENS", self.default_max_tokens, minimum=512)
        try:
            self.temperature = float(os.getenv("NVIDIA_TEMPERATURE", self.default_temperature))
        except (TypeError, ValueError):
            self.temperature = self.default_temperature
        self.temperature = max(0.0, min(2.0, self.temperature))
        # Career Agent prompts require machine-readable JSON. Thinking output
        # is therefore opt-in: leaving it enabled can consume almost the
        # entire completion budget before the model reaches the JSON answer.
        self.enable_thinking = os.getenv("NVIDIA_ENABLE_THINKING", "false").strip().lower() in {"1", "true", "yes", "on"}
        self.timeout = timeout
        # Total seconds this client may spend sleeping through provider rate
        # limits before giving up and surfacing AI_RATE_LIMITED to the caller.
        self.max_rate_limit_wait = _env_int("NVIDIA_RATE_LIMIT_MAX_WAIT_SECONDS", 120, minimum=1)
        self.max_transient_wait = _env_int("NVIDIA_TRANSIENT_MAX_WAIT_SECONDS", 30, minimum=1)
        self.rate_limit_base_delay = 4.0   # seconds; doubles per 429 attempt
        self.rate_limit_max_delay = 30.0

    @property
    def configured(self) -> bool:
        # Reject literal shell placeholders such as "$NVIDIA_API_KEY"; the
        # backend must receive a real key from its environment.
        key = self.api_key or ""
        return bool(
            key
            and not key.strip().startswith("$")
            and self.endpoint
            and self.model
        )

    def _headers(self) -> Dict[str, str]:
        if not self.configured:
            raise AIProviderNotConfigured(
                "NVIDIA_API_KEY is not configured. Set a real NVIDIA API key "
                "in the server environment; the literal \"$NVIDIA_API_KEY\" "
                "placeholder is not a valid key."
            )
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    @staticmethod
    def _message_text(body: Dict[str, Any]) -> str:
        choices = body.get("choices") or []
        if not choices:
            raise AIProviderError("NVIDIA returned no completion choices.")
        message = (choices[0] or {}).get("message") or {}
        content = message.get("content", "")
        if isinstance(content, list):
            text_parts = []
            for item in content:
                if isinstance(item, dict) and item.get("type") in {"text", "output_text"}:
                    text_parts.append(str(item.get("text", "")))
                elif isinstance(item, str):
                    text_parts.append(item)
            content = "\n".join(text_parts)
        if not isinstance(content, str) or not content.strip():
            # Reasoning models may emit the whole answer inside reasoning_content.
            reasoning = message.get("reasoning_content")
            if isinstance(reasoning, str) and reasoning.strip():
                return reasoning
            raise AIProviderError("NVIDIA returned an empty completion.")
        return content

    @staticmethod
    def _usage(body: Dict[str, Any]):
        usage = body.get("usage") or {}
        return (
            usage.get("prompt_tokens"),
            usage.get("completion_tokens"),
            usage.get("total_tokens"),
        )

    def complete_json(
        self,
        prompt: str | list[Dict[str, Any]],
        *,
        image_bytes: Optional[bytes] = None,
        image_mime_type: str = "image/png",
        temperature: float = 0.2,
        max_tokens: int = 8192,
        retries: int = 2,
    ) -> NvidiaResult:
        """Run a bounded JSON completion.

        Image extraction keeps its own non-streaming multimodal transport.
        Text callers should use ``complete_structured()``, which routes every
        text request through the streaming NVIDIA settings used by the rest of
        the product.
        """
        if isinstance(prompt, list):
            messages = [dict(message) for message in prompt]
        else:
            messages = [{"role": "user", "content": prompt}]
        if image_bytes is not None:
            encoded = base64.b64encode(image_bytes).decode("ascii")
            image_content = [
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{image_mime_type};base64,{encoded}"},
                }
            ]
            last_user_index = next(
                (index for index in range(len(messages) - 1, -1, -1) if messages[index].get("role") == "user"),
                len(messages) - 1,
            )
            existing_content = messages[last_user_index].get("content", "")
            if last_user_index < 0:
                messages.append({"role": "user", "content": image_content})
            else:
                messages[last_user_index]["content"] = [
                    *image_content,
                    {"type": "text", "text": existing_content if isinstance(existing_content, str) else json.dumps(existing_content, ensure_ascii=False)},
                ]

        request_model = self.vision_model if image_bytes is not None else self.model
        payload = {
            "messages": messages,
            "model": request_model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": 0.95,
            "top_k": 1,
            "stream": False,
            "chat_template_kwargs": {
                "enable_thinking": self.enable_thinking,
            },
        }
        if self.enable_thinking:
            # Keep at least half of the completion budget for the structured
            # answer. NVIDIA expects this setting inside chat_template_kwargs.
            payload["chat_template_kwargs"]["reasoning_budget"] = min(
                self.reasoning_budget,
                max(256, max_tokens // 2),
            )

        last_error: Optional[Exception] = None
        last_status: Optional[int] = None
        waited_total = 0.0
        for attempt in range(retries + 1):
            started = time.perf_counter()
            try:
                response = requests.post(self.endpoint, headers=self._headers(), json=payload, timeout=self.timeout)
                latency_ms = int((time.perf_counter() - started) * 1000)
                if response.status_code in self.retryable_statuses and attempt < retries:
                    last_status = response.status_code
                    retry_budget = self.max_rate_limit_wait if response.status_code == 429 else self.max_transient_wait
                    delay = self._retry_delay_seconds(response, attempt, retry_budget - waited_total)
                    if delay > 0:
                        time.sleep(delay)
                        waited_total += delay
                    continue
                if response.status_code == 429:
                    raise AIRateLimited("NVIDIA inference is rate limited. Please retry in a few minutes.")
                if response.status_code in {408, 500, 502, 503, 504}:
                    raise AIProviderUnavailable(
                        self._unavailable_message(response)
                    )
                if response.status_code >= 400:
                    raise AIProviderError(f"NVIDIA inference request failed with status {response.status_code}.")
                body = response.json()
                data = extract_json_from_model_text(self._message_text(body))
                prompt_tokens, completion_tokens, total_tokens = self._usage(body)
                return NvidiaResult(
                    data=data,
                    model=request_model,
                    latency_ms=latency_ms,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    total_tokens=total_tokens,
                    retry_count=attempt,
                )
            except (requests.RequestException, ValueError, SchemaValidationError, AIProviderError) as exc:
                last_error = exc
                if attempt < retries:
                    time.sleep(min(2 ** attempt, 4))
                    continue
                break
        if isinstance(last_error, AIRateLimited):
            raise last_error
        if last_status == 429:
            # Exhausted retries while the provider kept answering 429.
            raise AIRateLimited("NVIDIA inference is rate limited. Please retry in a few minutes.") from last_error
        if isinstance(last_error, AIProviderError):
            raise last_error
        raise AIProviderError("NVIDIA inference is temporarily unavailable after the retry limit. Please try again in a few minutes.") from last_error

    def complete_structured(
        self,
        prompt: str | list[Dict[str, Any]],
        *,
        image_bytes: Optional[bytes] = None,
        image_mime_type: str = "image/png",
        temperature: float | None = None,
        max_tokens: int | None = None,
        retries: int = 2,
        timeout: float | None = None,
    ) -> NvidiaResult:
        """Return parsed JSON from the requested NVIDIA text streaming stack.

        All text-powered Career Agent features share the same model, endpoint,
        and streaming transport. Token budgets and temperature default to the
        bounded env-driven settings (``NVIDIA_MAX_TOKENS``,
        ``NVIDIA_TEMPERATURE``, ``NVIDIA_REASONING_BUDGET``,
        ``NVIDIA_ENABLE_THINKING``) so one busy generation no longer stalls
        the whole pipeline; callers may still pass explicit overrides.
        ``timeout`` tightens the per-attempt transport deadline for stages that
        must stay fast; the multimodal branch below is used only for
        image-only extraction.
        """
        if image_bytes is not None:
            return self.complete_json(
                prompt,
                image_bytes=image_bytes,
                image_mime_type=image_mime_type,
                max_tokens=max_tokens,
                retries=retries,
            )

        if isinstance(prompt, str):
            messages = [{"role": "user", "content": prompt}]
        else:
            messages = [dict(message) for message in prompt]
        resolved_max_tokens = max(512, min(max_tokens if max_tokens is not None else self.max_tokens, 16384))
        resolved_temperature = self.temperature if temperature is None else max(0.0, min(2.0, float(temperature)))
        result = self.complete_text(
            messages,
            temperature=resolved_temperature,
            top_p=0.95,
            max_tokens=resolved_max_tokens,
            reasoning_budget=min(self.reasoning_budget, max(256, resolved_max_tokens // 2)),
            enable_thinking=self.enable_thinking,
            retries=retries,
            timeout=timeout,
        )
        candidates = []
        for part in (result.content, result.reasoning_content):
            normalized = (part or "").strip()
            if normalized and normalized not in candidates:
                candidates.append(normalized)
        if not candidates:
            raise AIProviderError("NVIDIA returned an empty completion.")
        last_validation_error: Optional[Exception] = None
        for candidate in candidates:
            try:
                data = extract_json_from_model_text(candidate)
                break
            except SchemaValidationError as exc:
                last_validation_error = exc
                continue
        else:
            if last_validation_error:
                raise last_validation_error
            raise AIProviderError("NVIDIA returned an empty completion.")
        return NvidiaResult(
            data=data,
            model=result.model,
            latency_ms=result.latency_ms,
            prompt_tokens=result.prompt_tokens,
            completion_tokens=result.completion_tokens,
            total_tokens=result.total_tokens,
            retry_count=result.retry_count,
        )

    def complete_text(
        self,
        messages: list[Dict[str, Any]],
        *,
        temperature: float | None = None,
        top_p: float = 0.95,
        max_tokens: int | None = None,
        reasoning_budget: int | None = None,
        enable_thinking: bool | None = None,
        tools: Optional[list[Dict[str, Any]]] = None,
        tool_choice: str | Dict[str, Any] | None = "auto",
        retries: int = 2,
        timeout: float | None = None,
    ) -> NvidiaTextResult:
        """Run a bounded streaming text completion on the requested NVIDIA model.

        ``None`` arguments fall back to the env-driven bounded defaults
        (``NVIDIA_MAX_TOKENS``, ``NVIDIA_TEMPERATURE``,
        ``NVIDIA_REASONING_BUDGET``, ``NVIDIA_ENABLE_THINKING``) so the whole
        product gets fast, predictable completions unless a caller explicitly
        opts into a larger budget or reasoning pass.
        """
        if not messages or not isinstance(messages, list):
            raise AIProviderError("At least one chat message is required.")

        resolved_max_tokens = max(512, min(max_tokens if max_tokens is not None else self.max_tokens, 16384))
        resolved_temperature = self.temperature if temperature is None else max(0.0, min(2.0, float(temperature)))
        resolved_thinking = self.enable_thinking if enable_thinking is None else bool(enable_thinking)
        # Callers can tighten (never disable) the transport deadline so a
        # cosmetic stage such as humanization cannot hold the pipeline for the
        # full client timeout on every attempt.
        resolved_timeout = self.timeout if timeout is None else max(1.0, float(timeout))
        resolved_budget = min(
            self.reasoning_budget if reasoning_budget is None else max(256, int(reasoning_budget)),
            max(256, resolved_max_tokens // 2),
        )
        payload: Dict[str, Any] = {
            "messages": [dict(message) for message in messages],
            "model": self.model,
            "max_tokens": resolved_max_tokens,
            "temperature": resolved_temperature,
            "top_p": top_p,
            "stream": True,
            "chat_template_kwargs": {"enable_thinking": resolved_thinking},
            "reasoning_budget": resolved_budget,
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = tool_choice

        last_error: Optional[Exception] = None
        last_status: Optional[int] = None
        waited_total = 0.0
        for attempt in range(retries + 1):
            started = time.perf_counter()
            try:
                with requests.post(
                    self.endpoint,
                    headers=self._headers(),
                    json=payload,
                    timeout=resolved_timeout,
                    stream=True,
                ) as response:
                    if response.status_code in self.retryable_statuses and attempt < retries:
                        last_status = response.status_code
                        delay = self._retry_delay_seconds(
                            response,
                            attempt,
                            (
                                self.max_rate_limit_wait
                                if response.status_code == 429
                                else self.max_transient_wait
                            )
                            - waited_total,
                        )
                        if delay > 0:
                            time.sleep(delay)
                            waited_total += delay
                        continue
                    if response.status_code == 429:
                        raise AIRateLimited(
                            "NVIDIA inference is rate limited. Please retry in a few minutes."
                        )
                    if response.status_code in {408, 500, 502, 503, 504}:
                        raise AIProviderUnavailable(self._unavailable_message(response))
                    if response.status_code >= 400:
                        raise AIProviderError(
                            f"NVIDIA inference request failed with status {response.status_code}."
                        )

                    text, reasoning, tool_calls, usage, finish_reason = (
                        self._consume_stream(response)
                    )
                    latency_ms = int((time.perf_counter() - started) * 1000)
                    if not text and not tool_calls:
                        if reasoning:
                            text = reasoning
                        else:
                            raise AIProviderError("NVIDIA returned an empty completion.")
                    prompt_tokens, completion_tokens, total_tokens = self._usage(
                        {"usage": usage}
                    )
                    return NvidiaTextResult(
                        content=text,
                        reasoning_content=reasoning,
                        tool_calls=tool_calls,
                        model=self.model,
                        latency_ms=latency_ms,
                        prompt_tokens=prompt_tokens,
                        completion_tokens=completion_tokens,
                        total_tokens=total_tokens,
                        finish_reason=finish_reason,
                        retry_count=attempt,
                    )
            except (requests.RequestException, ValueError, AIProviderError) as exc:
                last_error = exc
                if attempt < retries:
                    time.sleep(min(2 ** attempt, 4))
                    continue
                break

        if isinstance(last_error, AIRateLimited):
            raise last_error
        if last_status == 429:
            raise AIRateLimited(
                "NVIDIA inference is rate limited. Please retry in a few minutes."
            ) from last_error
        if isinstance(last_error, AIProviderError):
            raise last_error
        raise AIProviderError("NVIDIA inference is temporarily unavailable after the retry limit. Please try again in a few minutes.") from last_error

    @staticmethod
    def _consume_stream(response) -> tuple[
        str,
        str,
        list[Dict[str, Any]],
        Dict[str, Any],
        Optional[str],
    ]:
        """Assemble streamed content, reasoning, usage, and tool-call deltas."""
        content_parts: list[str] = []
        reasoning_parts: list[str] = []
        tool_calls: Dict[int, Dict[str, Any]] = {}
        usage: Dict[str, Any] = {}
        finish_reason: Optional[str] = None

        for raw_line in response.iter_lines(decode_unicode=True):
            if not raw_line:
                continue
            line = raw_line.decode("utf-8") if isinstance(raw_line, bytes) else raw_line
            if not line.startswith("data:"):
                continue
            data = line[5:].strip()
            if data == "[DONE]":
                break
            try:
                event = json.loads(data)
            except json.JSONDecodeError as exc:
                raise ValueError("NVIDIA returned malformed streaming data.") from exc

            if event.get("usage"):
                usage = event["usage"]
            choices = event.get("choices") or []
            if not choices:
                continue
            choice = choices[0] or {}
            delta = choice.get("delta") or {}
            content = delta.get("content")
            if isinstance(content, str) and content:
                content_parts.append(content)
            reasoning = delta.get("reasoning_content")
            if isinstance(reasoning, str) and reasoning:
                reasoning_parts.append(reasoning)
            if choice.get("finish_reason"):
                finish_reason = choice["finish_reason"]

            for tool_delta in delta.get("tool_calls") or []:
                index = int(tool_delta.get("index", 0))
                call = tool_calls.setdefault(
                    index,
                    {"id": "", "type": "function", "function": {"name": "", "arguments": ""}},
                )
                if tool_delta.get("id"):
                    call["id"] = tool_delta["id"]
                function_delta = tool_delta.get("function") or {}
                if function_delta.get("name"):
                    call["function"]["name"] = function_delta["name"]
                arguments = function_delta.get("arguments")
                if arguments:
                    call["function"]["arguments"] += arguments

        return (
            "".join(content_parts),
            "".join(reasoning_parts),
            [tool_calls[index] for index in sorted(tool_calls)],
            usage,
            finish_reason,
        )

    @staticmethod
    def _unavailable_message(response) -> str:
        """Return a safe provider error without including prompt or response data."""
        status = getattr(response, "status_code", "unknown")
        return f"NVIDIA inference is temporarily unavailable (status {status})."

    def _retry_delay_seconds(self, response, attempt: int, remaining_budget: float) -> float:
        """Honor provider retry hints while keeping retries bounded."""
        retry_after = response.headers.get("Retry-After")
        if retry_after:
            try:
                delay = float(retry_after)
                return max(0.0, min(delay, self.rate_limit_max_delay, max(remaining_budget, 0.0)))
            except (TypeError, ValueError):
                pass
        if response.status_code == 429:
            delay: Optional[float] = None
            if delay is None:
                delay = min(self.rate_limit_base_delay * (2 ** min(attempt, 3)), self.rate_limit_max_delay)
            return max(1.0, min(delay, self.rate_limit_max_delay, max(remaining_budget, 1.0)))
        # Transient server/network errors keep the original short backoff.
        return min(2 ** attempt, 4, max(remaining_budget, 0.0))

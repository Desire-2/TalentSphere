"""Tests for the server-side NVIDIA streaming text provider."""

from __future__ import annotations

import json
import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.services.career_agent.nvidia_client import NvidiaClient  # noqa: E402


class _StreamResponse:
    status_code = 200
    headers: dict[str, str] = {}

    def __init__(self, events: list[dict]) -> None:
        self._events = events

    def __enter__(self):
        return self

    def __exit__(self, _exc_type, _exc_value, _traceback):
        return False

    def iter_lines(self, decode_unicode: bool = False):
        for event in self._events:
            yield f"data: {json.dumps(event)}"
        yield "data: [DONE]"


class NvidiaTextProviderTests(unittest.TestCase):
    def test_literal_placeholder_key_is_rejected_as_missing_configuration(self):
        from src.services.career_agent.nvidia_client import AIProviderNotConfigured

        with mock.patch.dict(os.environ, {"NVIDIA_API_KEY": "$NVIDIA_API_KEY"}, clear=False):
            client = NvidiaClient()
        self.assertFalse(client.configured)
        with mock.patch("src.services.career_agent.nvidia_client.requests.post") as post:
            with self.assertRaises(AIProviderNotConfigured):
                client.complete_text([{"role": "user", "content": "hello"}])
        post.assert_not_called()

    def test_structured_text_uses_streaming_nvidia_settings(self):
        events = [
            {
                "choices": [{
                    "delta": {"reasoning_content": "Building the response. "},
                }],
            },
            {
                "choices": [{
                    "delta": {"content": '{"ok": true}'},
                    "finish_reason": "stop",
                }],
            },
            {
                "choices": [],
                "usage": {"prompt_tokens": 3, "completion_tokens": 5, "total_tokens": 8},
            },
        ]
        response = _StreamResponse(events)
        client = NvidiaClient(api_key="test-key")

        with mock.patch(
            "src.services.career_agent.nvidia_client.requests.post",
            return_value=response,
        ) as post:
            result = client.complete_structured(
                [{"role": "system", "content": "Return JSON."}, {"role": "user", "content": "hello"}]
            )

        payload = post.call_args.kwargs["json"]
        self.assertEqual(payload["model"], "nvidia/nemotron-3.5-lightning-30b-a3b")
        self.assertTrue(payload["stream"])
        self.assertEqual(payload["max_tokens"], NvidiaClient.default_max_tokens)
        self.assertEqual(payload["temperature"], NvidiaClient.default_temperature)
        self.assertEqual(payload["top_p"], 0.95)
        self.assertFalse(payload["chat_template_kwargs"]["enable_thinking"])
        self.assertEqual(payload["reasoning_budget"], NvidiaClient.default_reasoning_budget)
        self.assertEqual(result.data, {"ok": True})
        self.assertEqual(result.model, "nvidia/nemotron-3.5-lightning-30b-a3b")
        self.assertEqual(result.total_tokens, 8)

    def test_structured_text_honors_env_overrides_for_size_and_thinking(self):
        events = [
            {
                "choices": [{
                    "delta": {"content": '{"ok": true}'},
                    "finish_reason": "stop",
                }],
            },
            {
                "choices": [],
                "usage": {"prompt_tokens": 3, "completion_tokens": 5, "total_tokens": 8},
            },
        ]
        response = _StreamResponse(events)

        with mock.patch.dict(os.environ, {
            "NVIDIA_ENABLE_THINKING": "true",
            "NVIDIA_MAX_TOKENS": "16384",
            "NVIDIA_TEMPERATURE": "1.0",
            "NVIDIA_REASONING_BUDGET": "16384",
        }, clear=False):
            client = NvidiaClient(api_key="test-key")
            with mock.patch(
                "src.services.career_agent.nvidia_client.requests.post",
                return_value=response,
            ) as post:
                result = client.complete_structured("return json")

        payload = post.call_args.kwargs["json"]
        self.assertEqual(payload["max_tokens"], 16384)
        self.assertEqual(payload["temperature"], 1.0)
        self.assertTrue(payload["chat_template_kwargs"]["enable_thinking"])
        # Reasoning never eats more than half the answer budget, even when
        # the environment asks for a larger reasoning allowance.
        self.assertEqual(payload["reasoning_budget"], 8192)
        self.assertEqual(result.data, {"ok": True})

    def test_structured_text_accepts_explicit_per_call_overrides(self):
        events = [
            {
                "choices": [{
                    "delta": {"content": '{"ok": true}'},
                    "finish_reason": "stop",
                }],
            },
            {
                "choices": [],
                "usage": {"prompt_tokens": 3, "completion_tokens": 5, "total_tokens": 8},
            },
        ]
        response = _StreamResponse(events)
        client = NvidiaClient(api_key="test-key")

        with mock.patch(
            "src.services.career_agent.nvidia_client.requests.post",
            return_value=response,
        ) as post:
            client.complete_structured("return json", max_tokens=4096, temperature=0.7)

        payload = post.call_args.kwargs["json"]
        self.assertEqual(payload["max_tokens"], 4096)
        self.assertEqual(payload["temperature"], 0.7)

    def test_structured_text_reads_json_from_reasoning_only(self):
        events = [
            {
                "choices": [{
                    "delta": {"reasoning_content": '{"ok": true}'},
                    "finish_reason": "stop",
                }],
            },
            {
                "choices": [],
                "usage": {"prompt_tokens": 3, "completion_tokens": 5, "total_tokens": 8},
            },
        ]
        response = _StreamResponse(events)
        client = NvidiaClient(api_key="test-key")

        with mock.patch(
            "src.services.career_agent.nvidia_client.requests.post",
            return_value=response,
        ):
            result = client.complete_structured("return json")

        self.assertEqual(result.data, {"ok": True})

    def test_stream_uses_requested_model_and_aggregates_tool_calls(self):
        events = [
            {
                "choices": [{
                    "delta": {
                        "reasoning_content": "Inspecting the request. ",
                        "tool_calls": [{
                            "index": 0,
                            "id": "call_1",
                            "function": {"name": "lookup", "arguments": "{\"q\":"},
                        }],
                    },
                }],
            },
            {
                "choices": [{
                    "delta": {
                        "content": "Done.",
                        "tool_calls": [{
                            "index": 0,
                            "function": {"arguments": "\"nvidia\"}"},
                        }],
                    },
                    "finish_reason": "tool_calls",
                }],
            },
            {
                "choices": [],
                "usage": {"prompt_tokens": 7, "completion_tokens": 11, "total_tokens": 18},
            },
        ]
        response = _StreamResponse(events)

        with mock.patch.dict(os.environ, {
            "NVIDIA_MODEL": "ignored-text-model",
            "NVIDIA_INFERENCE_URL": "https://invalid.example/v1",
        }):
            client = NvidiaClient(api_key="test-key")

        with mock.patch(
            "src.services.career_agent.nvidia_client.requests.post",
            return_value=response,
        ) as post:
            result = client.complete_text(
                [{"role": "user", "content": "hello"}],
                tools=[{
                    "type": "function",
                    "function": {
                        "name": "lookup",
                        "description": "Look up text",
                        "parameters": {"type": "object", "properties": {}},
                    },
                }],
            )

        payload = post.call_args.kwargs["json"]
        self.assertEqual(post.call_args.args[0], NvidiaClient.endpoint)
        self.assertEqual(client.endpoint, NvidiaClient.endpoint)
        self.assertEqual(payload["model"], "nvidia/nemotron-3.5-lightning-30b-a3b")
        self.assertTrue(payload["stream"])
        self.assertEqual(payload["max_tokens"], NvidiaClient.default_max_tokens)
        self.assertEqual(payload["temperature"], NvidiaClient.default_temperature)
        self.assertEqual(payload["top_p"], 0.95)
        self.assertFalse(payload["chat_template_kwargs"]["enable_thinking"])
        self.assertEqual(payload["reasoning_budget"], NvidiaClient.default_reasoning_budget)
        self.assertEqual(result.content, "Done.")
        self.assertEqual(result.reasoning_content, "Inspecting the request. ")
        self.assertEqual(
            result.tool_calls,
            [{
                "id": "call_1",
                "type": "function",
                "function": {"name": "lookup", "arguments": "{\"q\":\"nvidia\"}"},
            }],
        )
        self.assertEqual(result.finish_reason, "tool_calls")
        self.assertEqual(result.total_tokens, 18)


if __name__ == "__main__":
    unittest.main()

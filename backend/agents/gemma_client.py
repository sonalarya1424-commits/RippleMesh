"""Gemma client module for RippleMesh.

Provides the primary interface to communicate with Gemma models via Ollama
or return realistic mock responses during offline development.
"""
import re
import json
import time
from typing import Any, Dict, Optional, Union
import backend.config as config

def _extract_json(text: str) -> Dict[str, Any]:
    """Strips thinking tags and markdown fences to extract the first valid JSON object."""
    # Strip <think>...</think> blocks if present
    cleaned = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    
    # Strip ```json ... ``` markdown fences
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if fence_match:
        cleaned = fence_match.group(1)

    # Find the first JSON object using balanced braces or regex
    brace_start = cleaned.find("{")
    if brace_start != -1:
        # Scan forward for matching closing brace
        depth = 0
        in_string = False
        escape = False
        end_idx = -1
        for i, ch in enumerate(cleaned[brace_start:], start=brace_start):
            if in_string:
                if escape:
                    escape = False
                elif ch == "\\":
                    escape = True
                elif ch == '"':
                    in_string = False
            else:
                if ch == '"':
                    in_string = True
                elif ch == '{':
                    depth += 1
                elif ch == '}':
                    depth -= 1
                    if depth == 0:
                        end_idx = i + 1
                        break
        if end_idx != -1:
            json_str = cleaned[brace_start:end_idx]
            return json.loads(json_str)

    # Fallback to direct json.loads
    return json.loads(cleaned.strip())

def ask_gemma(
    system_prompt: str,
    user_text: str,
    image_path: Optional[str] = None,
    json_mode: bool = False,
    thinking: bool = False,
    num_predict: Optional[int] = None
) -> Union[str, Dict[str, Any]]:
    """Query Gemma via Ollama or return realistic mock data if config.MOCK_MODE is enabled.

    Args:
        system_prompt: System prompt / role instruction.
        user_text: Main user message or query.
        image_path: Optional path to an image file for multimodal inspection.
        json_mode: When True, extracts and parses the JSON response from the output.
        thinking: Whether to enable thinking mode in Ollama.

    Returns:
        String response or parsed dictionary (if json_mode is True).
    """
    t0 = time.time()

    # Rule 1: If config.MOCK_MODE is true, return realistic fake response and never call a model
    if getattr(config, "MOCK_MODE", True):
        latency = time.time() - t0
        print(f"[ask_gemma] (MOCK_MODE=True) Latency: {latency:.4f}s")
        if json_mode:
            return {
                "hazard_detected": True,
                "hazard_type": "flood",
                "severity": "high",
                "description": "Simulated flood assessment with rising waters affecting road access.",
                "people_at_risk": 2,
                "confidence": 0.88,
                "notes": "Mock response generated while offline"
            }
        return (
            "This scene shows urban flood waters inundating a roadway. "
            "Several people are observed stranded near a shop front requiring evacuation assistance."
        )

    # Rule 2: Use the ollama Python library
    import ollama

    user_message: Dict[str, Any] = {"role": "user", "content": user_text}
    if image_path:
        user_message["images"] = [image_path]

    messages = [
        {"role": "system", "content": system_prompt},
        user_message
    ]

    def _call_ollama(use_think: bool) -> str:
        call_kwargs: Dict[str, Any] = {
            "model": config.MODEL_NAME,
            "messages": messages,
        }
        if num_predict is not None:
            call_kwargs["options"] = {"num_predict": num_predict}
        if use_think:
            call_kwargs["think"] = True

        try:
            res = ollama.chat(**call_kwargs)
            return res["message"]["content"]
        except TypeError as e:
            # If the think argument raises an error (e.g. unexpected keyword argument), retry without it
            if use_think and "think" in str(e):
                call_kwargs.pop("think", None)
                res = ollama.chat(**call_kwargs)
                return res["message"]["content"]
            raise
        except Exception as e:
            # If ollama server rejects 'think' parameter or option
            if use_think:
                call_kwargs.pop("think", None)
                res = ollama.chat(**call_kwargs)
                return res["message"]["content"]
            raise e

    raw_response = _call_ollama(use_think=thinking)
    latency = time.time() - t0
    print(f"[ask_gemma] (model={config.MODEL_NAME}) Latency: {latency:.4f}s")

    # Rule 4: If json_mode is true, strip thinking/fences, extract JSON object, retry once on failure
    if json_mode:
        try:
            return _extract_json(raw_response)
        except Exception as first_err:
            # Retry once with explicit instruction to return valid JSON
            messages.append({"role": "assistant", "content": raw_response})
            messages.append({"role": "user", "content": "Please output valid raw JSON only, matching the requested format without any extra commentary."})
            retry_raw = _call_ollama(use_think=False)
            try:
                return _extract_json(retry_raw)
            except Exception as second_err:
                raise ValueError(
                    f"Failed to parse JSON from Gemma response after retry.\n"
                    f"First Error: {first_err}\n"
                    f"Second Error: {second_err}\n"
                    f"Raw Output:\n{raw_response}\nRetry Output:\n{retry_raw}"
                ) from second_err

    return raw_response


class GemmaClient:
    """Wrapper client for backwards compatibility with earlier skeleton calls."""

    def __init__(self, model_name: str = config.MODEL_NAME, ollama_url: str = config.OLLAMA_URL, mock_mode: bool = config.MOCK_MODE):
        self.model_name = model_name
        self.ollama_url = ollama_url
        self.mock_mode = mock_mode

    def generate_json(self, prompt: str, schema: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return ask_gemma(
            system_prompt="You are a disaster response intelligence system. Output structured JSON only.",
            user_text=prompt,
            json_mode=True
        )

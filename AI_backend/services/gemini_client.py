import os
from typing import List, Dict, Any, Optional
import httpx

API_KEY = os.getenv("GOOGLE_API_KEY")
# Default to legacy PaLM chat-bison unless overridden
MODEL = os.getenv("GEN_AI_MODEL", "chat-bison-001")


def _is_gemini_model(model: str) -> bool:
    # Gemini 1.x models are usually prefixed with "gemini-"
    return model.lower().startswith("gemini-")


def _make_url(model: str) -> str:
    # Gemini 1.x uses v1 generateContent; PaLM/chat-bison uses v1beta2 generateMessage
    if _is_gemini_model(model):
        base = "https://generativelanguage.googleapis.com/v1/models"
        return f"{base}/{model}:generateContent?key={API_KEY}"
    else:
        base = "https://generativelanguage.googleapis.com/v1beta2/models"
        return f"{base}/{model}:generateMessage?key={API_KEY}"


def _map_messages_for_palm(messages: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    # PaLM/chat-bison format: messages=[{author, content:{text}}]
    mapped = []
    for m in messages:
        role = (m.get("role") or "user").lower()
        content = m.get("content", "")
        author = "user" if role not in ("assistant", "system") else role
        # PaLM did not have a special system role; keep it as 'system'
        mapped.append({"author": author, "content": {"text": content}})
    return mapped


def _map_messages_for_gemini(messages: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    # Gemini format: contents=[{role:'user'|'model', parts:[{text}]}]
    contents: List[Dict[str, Any]] = []
    for m in messages:
        role = (m.get("role") or "user").lower()
        text = m.get("content", "")
        # Gemini roles are 'user' and 'model'. Map 'assistant'->'model', 'system'->'user'.
        if role == "assistant":
            role = "model"
        elif role == "system":
            role = "user"
        contents.append({"role": role, "parts": [{"text": text}]})
    return contents


def generate_chat_reply(
    messages: List[Dict[str, str]],
    temperature: float = 0.2,
    max_output_tokens: int = 512,
    response_mime_type: Optional[str] = None,
    response_schema: Optional[Dict[str, Any]] = None,
    function_declarations: Optional[List[Dict[str, Any]]] = None,
) -> str:
    """
    Send the messages to Google's Generative Language API and return the assistant reply as text.

    Supports both PaLM/chat-bison (v1beta2 generateMessage) and Gemini 1.x (v1 generateContent).
    """
    if not API_KEY:
        raise RuntimeError("GOOGLE_API_KEY environment variable is not set")

    is_gemini = _is_gemini_model(MODEL)
    url = _make_url(MODEL)

    if is_gemini:
        payload: Dict[str, Any] = {
            "contents": _map_messages_for_gemini(messages),
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_output_tokens,
            },
        }
        # Avoid non-portable fields (tools/responseMimeType/responseSchema) due to API variability
    else:
        payload = {
            "messages": _map_messages_for_palm(messages),
            "temperature": temperature,
            "candidateCount": 1,
            "maxOutputTokens": max_output_tokens,
        }

    headers = {"Content-Type": "application/json"}

    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            print("LLM response:", data)

            # Prefer Gemini response parsing
            candidates = data.get("candidates") or []
            if candidates:
                first = candidates[0]
                # If model stopped due to token limit, surface a clear error
                finish = first.get("finishReason") or first.get("finish_reason")
                if finish == "MAX_TOKENS":
                    raise RuntimeError(
                        "LLM stopped early due to max tokens. Increase maxOutputTokens or simplify prompt."
                    )
                # Gemini: candidates[0].content.parts[].text
                if isinstance(first, dict):
                    content = first.get("content") or first.get("message") or first
                    if isinstance(content, dict):
                        parts = content.get("parts") or content.get("content") or []
                        # Normalize to list
                        if isinstance(parts, list) and parts:
                            # First, check for functionCall result
                            for p in parts:
                                if isinstance(p, dict) and "functionCall" in p:
                                    fn = p.get("functionCall", {})
                                    # Return args as JSON string
                                    args = fn.get("args")
                                    if isinstance(args, (dict, list)):
                                        import json as _json
                                        return _json.dumps(args)
                            # Otherwise, fall back to concatenated text
                            texts: List[str] = []
                            for p in parts:
                                if isinstance(p, dict):
                                    t = p.get("text") or p.get("output_text") or p.get("type")
                                    if t:
                                        texts.append(t)
                            if texts:
                                return "\n".join(texts)
                        # Fallback: direct text field
                        t = content.get("text")
                        if t:
                            return t
                    # PaLM sometimes returns text at top level of candidate
                    t = first.get("text")
                    if t:
                        return t

            # Fallbacks sometimes seen in PaLM
            if "output" in data and isinstance(data["output"], dict) and "text" in data["output"]:
                return data["output"]["text"]

            # If nothing matched, return the raw JSON for debugging
            return str(data)

    except httpx.HTTPStatusError as e:
        raise RuntimeError(f"LLM request failed: {e.response.status_code} {e.response.text}")
    except Exception:
        raise

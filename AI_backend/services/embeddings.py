import os
from typing import List, Dict, Any
import httpx


API_KEY = os.getenv("GOOGLE_API_KEY")
EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-004")


def embed_texts(texts: List[str]) -> List[List[float]]:
    if not API_KEY:
        raise RuntimeError("GOOGLE_API_KEY is not set for embeddings")
    url = f"https://generativelanguage.googleapis.com/v1/models/{EMBED_MODEL}:embedContent?key={API_KEY}"
    outputs: List[List[float]] = []
    with httpx.Client(timeout=30.0) as client:
        for t in texts:
            payload: Dict[str, Any] = {
                "model": EMBED_MODEL,
                "content": {"parts": [{"text": t}]},
            }
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            vec = (
                data.get("embedding", {}).get("values")
                or data.get("embedding", {}).get("value")
                or []
            )
            if not isinstance(vec, list):
                raise RuntimeError("Unexpected embedding response format")
            outputs.append(vec)
    return outputs



import os
from typing import List, Tuple
import math


def _read_text_files(root: str) -> List[Tuple[str, str]]:
    docs: List[Tuple[str, str]] = []
    if not os.path.isdir(root):
        return docs
    for dirpath, _, filenames in os.walk(root):
        for fn in filenames:
            if fn.lower().endswith((".md", ".txt")):
                p = os.path.join(dirpath, fn)
                try:
                    with open(p, "r", encoding="utf-8", errors="ignore") as f:
                        docs.append((p, f.read()))
                except Exception:
                    continue
    return docs


def _chunk_text(text: str, chunk_size: int = 800, overlap: int = 120) -> List[str]:
    words = text.split()
    chunks: List[str] = []
    i = 0
    while i < len(words):
        chunk_words = words[i:i + chunk_size]
        if not chunk_words:
            break
        chunks.append(" ".join(chunk_words))
        i += chunk_size - overlap
        if i <= 0:
            i = len(chunk_words)
    return chunks


def _simple_embed(text: str) -> dict:
    # Extremely simple bag-of-words TF vector (lowercased tokens, no idf) for demo purposes
    vec: dict = {}
    for tok in text.lower().split():
        if tok.isalpha() or any(c.isalnum() for c in tok):
            vec[tok] = vec.get(tok, 0) + 1.0
    return vec


def _cosine(a: dict, b: dict) -> float:
    dot = 0.0
    for k, v in a.items():
        if k in b:
            dot += v * b[k]
    na = math.sqrt(sum(v*v for v in a.values()))
    nb = math.sqrt(sum(v*v for v in b.values()))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


class SimpleRetriever:
    def __init__(self, knowledge_root: str = "knowledge") -> None:
        self.knowledge_root = knowledge_root
        self._index: List[Tuple[str, str, dict]] = []  # (path, chunk, vector)

    def rebuild(self) -> None:
        self._index.clear()
        for path, text in _read_text_files(self.knowledge_root):
            for chunk in _chunk_text(text):
                self._index.append((path, chunk, _simple_embed(chunk)))

    def search(self, query: str, k: int = 6) -> List[Tuple[str, str, float]]:
        if not self._index:
            self.rebuild()
        qv = _simple_embed(query)
        scored: List[Tuple[str, str, float]] = []
        for path, chunk, vec in self._index:
            s = _cosine(qv, vec)
            if s > 0:
                scored.append((path, chunk, s))
        scored.sort(key=lambda x: x[2], reverse=True)
        return scored[:k]



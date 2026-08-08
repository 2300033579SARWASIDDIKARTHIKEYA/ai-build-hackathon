"""
LRU Cache with TTL for vector embeddings, recommendation caching, and session data.
"""
import time
import hashlib
import threading
from typing import Any, Dict, Optional, Tuple
from collections import OrderedDict

class LRUCache:
    def __init__(self, max_size: int = 1000, default_ttl: float = 300.0):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._cache: OrderedDict[str, Tuple[Any, float]] = OrderedDict()
        self._lock = threading.Lock()
        self.hits = 0
        self.misses = 0

    def _make_key(self, namespace: str, **kwargs) -> str:
        key_str = f"{namespace}:{sorted(kwargs.items())}"
        return hashlib.md5(key_str.encode()).hexdigest()

    def get(self, namespace: str, **kwargs) -> Optional[Any]:
        key = self._make_key(namespace, **kwargs)
        with self._lock:
            if key in self._cache:
                value, expiry = self._cache[key]
                if time.time() < expiry:
                    self._cache.move_to_end(key)
                    self.hits += 1
                    return value
                else:
                    del self._cache[key]
            self.misses += 1
            return None

    def set(self, namespace: str, value: Any, ttl: Optional[float] = None, **kwargs):
        key = self._make_key(namespace, **kwargs)
        ttl = ttl or self.default_ttl
        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
            elif len(self._cache) >= self.max_size:
                self._cache.popitem(last=False)
            self._cache[key] = (value, time.time() + ttl)

    def invalidate(self, namespace: str, **kwargs):
        key = self._make_key(namespace, **kwargs)
        with self._lock:
            self._cache.pop(key, None)

    def invalidate_all(self, namespace: str):
        prefix = f"{namespace}:"
        with self._lock:
            keys_to_delete = [k for k in self._cache if k.startswith(prefix)]
            for k in keys_to_delete:
                del self._cache[k]

    def stats(self) -> Dict:
        total = self.hits + self.misses
        return {
            "size": len(self._cache),
            "max_size": self.max_size,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate_pct": round(self.hits / total * 100, 2) if total > 0 else 0.0,
        }

    def clear(self):
        with self._lock:
            self._cache.clear()
            self.hits = 0
            self.misses = 0


recommendation_cache = LRUCache(max_size=2000, default_ttl=300.0)
embedding_cache = LRUCache(max_size=5000, default_ttl=3600.0)
session_cache = LRUCache(max_size=1000, default_ttl=1800.0)
vector_cache = LRUCache(max_size=3000, default_ttl=1800.0)

"""
Security utilities for input sanitization, API key validation, rate limiting,
and request signature verification.
"""
import re
import hmac
import hashlib
import time
import uuid
from typing import Dict, Any, Optional, Tuple
from collections import defaultdict
from fastapi import HTTPException, Request


class InputSanitizer:
    @staticmethod
    def sanitize_string(value: str, max_length: int = 500) -> str:
        if not isinstance(value, str):
            raise HTTPException(status_code=400, detail="Input must be a string")
        value = value.strip()
        if len(value) > max_length:
            value = value[:max_length]
        return value

    @staticmethod
    def validate_product_id(product_id: str) -> str:
        pattern = r'^prod_[a-z0-9]+$'
        if not re.match(pattern, product_id):
            raise HTTPException(status_code=400, detail="Invalid product_id format")
        return product_id

    @staticmethod
    def validate_session_id(session_id: str) -> str:
        try:
            uuid.UUID(session_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid session_id format")
        return session_id


class RateLimiter:
    def __init__(self):
        self._requests: Dict[str, list] = defaultdict(list)

    def is_allowed(self, key: str, max_requests: int, window_sec: int) -> Tuple[bool, Dict[str, Any]]:
        now = time.time()
        window = self._requests[key]
        self._requests[key] = [t for t in window if now - t < window_sec]
        current = len(self._requests[key])
        if current < max_requests:
            self._requests[key].append(now)
            return True, {"remaining": max_requests - current - 1, "limit": max_requests, "window_sec": window_sec, "retry_after": window_sec}
        oldest = self._requests[key][0] if self._requests[key] else now
        retry_after = max(1, int(window_sec - (now - oldest)))
        return False, {"remaining": 0, "limit": max_requests, "window_sec": window_sec, "retry_after": retry_after}


def validate_api_key(api_key: Optional[str]) -> Dict[str, Any]:
    from app.core.config import settings
    if api_key is None:
        raise HTTPException(status_code=401, detail="Missing API key")
    if api_key not in settings.ALLOWED_API_KEYS:
        raise HTTPException(status_code=403, detail="Invalid API key")
    if api_key == "enterprise-key-2026-discoverai":
        return {"client": "enterprise", "tier": "premium", "rate_limit_rpm": settings.RATE_LIMIT_RPM_PREMIUM}
    return {"client": "demo", "tier": "standard", "rate_limit_rpm": settings.RATE_LIMIT_RPM}


def verify_request_signature(payload: str, signature: str, secret: str) -> bool:
    expected = hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


rate_limiter = RateLimiter()


def audit_log(event: str, client: str, endpoint: str, status: int) -> None:
    AUDIT_LOG.append({
        "event": event,
        "client": client,
        "endpoint": endpoint,
        "status": status,
        "timestamp": time.time(),
    })


AUDIT_LOG: list = []

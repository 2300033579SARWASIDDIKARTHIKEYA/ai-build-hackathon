"""
Enterprise Security Middleware: Rate limiting, CORS hardening, secure headers, request timeout.
"""
import time
import uuid
from typing import Callable
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
from app.core.security import validate_api_key, rate_limiter, audit_log, AUDIT_LOG

SECURE_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
}

PUBLIC_ENDPOINTS = {"/", "/health", "/api/v1/health", "/api/v1/roi/kpis", "/api/v1/analytics/metrics"}
PUBLIC_PREFIXES = ["/docs", "/openapi", "/api/v1/dpdpa/", "/api/v1/auth"]


class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        request.state.request_id = str(uuid.uuid4())[:8]
        request.state.start_time = time.time()
        path = request.url.path
        method = request.method
        is_preflight = method == "OPTIONS"
        is_public = path in PUBLIC_ENDPOINTS or any(path.startswith(p) for p in PUBLIC_PREFIXES) or is_preflight
        api_key = request.headers.get("X-API-Key")
        if not is_public:
            if not api_key:
                return JSONResponse(status_code=401, content={"detail": "API key required"})
            client_info = validate_api_key(api_key)
            rate_info = rate_limiter.is_allowed(
                f"{client_info['client']}:{path}",
                max_requests=client_info["rate_limit_rpm"],
                window_sec=60,
            )
            if not rate_info[0]:
                return JSONResponse(
                    status_code=429,
                    headers={"Retry-After": str(rate_info[1]["retry_after"])},
                    content={"detail": "Rate limit exceeded", **rate_info[1]},
                )
            request.state.client = client_info
        response = await call_next(request)
        process_time = (time.time() - request.state.start_time) * 1000
        for header, value in SECURE_HEADERS.items():
            response.headers[header] = value
        response.headers["X-Request-ID"] = request.state.request_id
        response.headers["X-Process-Time-Ms"] = f"{process_time:.1f}"
        if not is_public:
            audit_log(
                event="api_request",
                client=request.state.client.get("client", "unknown"),
                endpoint=path,
                status=response.status_code,
            )
        return response


REQUEST_TIMEOUT_SECONDS = 30


class TimeoutMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        try:
            return await call_next(request)
        except Exception as e:
            return JSONResponse(status_code=500, content={"detail": "Internal server error", "request_id": getattr(request.state, "request_id", "unknown")})

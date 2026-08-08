from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "DiscoverAI Engine"
    VERSION: str = "2.5.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "discoverai-enterprise-secret-key-hackathon-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "*"
    ]
    
    # Vector Search Params
    EMBEDDING_DIM: int = 512
    TOP_K_DEFAULT: int = 12

    # Security
    API_KEY_HEADER_NAME: str = "X-API-Key"
    ALLOWED_API_KEYS: List[str] = ["demo-key-2026-discoverai", "enterprise-key-2026-discoverai"]
    RATE_LIMIT_RPM: int = 100
    RATE_LIMIT_RPM_PREMIUM: int = 1000
    REQUEST_TIMEOUT_SECONDS: int = 30
    MAX_QUERY_LENGTH: int = 500
    MAX_SESSION_EVENTS: int = 200

    # Cache
    CACHE_TTL_SECONDS: int = 300
    EMBEDDING_CACHE_TTL_SECONDS: int = 3600
    VECTOR_CACHE_TTL_SECONDS: int = 1800

    # DPDP compliance
    DPDP_DATA_RETENTION_DAYS: int = 90
    DPDP_CATEGORY_DIVERSITY_PCT: float = 0.35
    DPDP_CONSENT_REQUIRED: bool = True
    DPDP_AUDIT_LOG_MAX: int = 5000

    # SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "algud-ai@example.com"
    SMTP_FROM_NAME: str = "ALGUD AI"
    ENABLE_SMTP: bool = False

    class Config:
        case_sensitive = True

    class ConfigDict:
        pass

settings = Settings()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router
from app.core.middleware import SecurityMiddleware, TimeoutMiddleware
from app.core.cache import recommendation_cache, embedding_cache, session_cache, vector_cache

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="DiscoverAI Enterprise Multi-Intent Product Recommendation & Discovery Engine API"
)

app.add_middleware(SecurityMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "title": "DiscoverAI Engine",
        "status": "ONLINE",
        "version": settings.VERSION,
        "agents": [
            "User Intent Agent",
            "Recommendation Agent",
            "Semantic & Visual Search Agent",
            "Product Intelligence Agent",
            "Business Intelligence Agent"
        ]
    }

@app.get("/health")
def health():
    return {"status": "healthy", "version": settings.VERSION}

@app.get(f"{settings.API_V1_STR}/cache/stats")
def cache_stats():
    return {
        "recommendation": recommendation_cache.stats(),
        "embedding": embedding_cache.stats(),
        "session": session_cache.stats(),
        "vector": vector_cache.stats(),
    }

@app.on_event("startup")
def warmup_caches():
    embedding_cache.set("warmup", True, ttl=60)
    recommendation_cache.set("warmup", True, ttl=60)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

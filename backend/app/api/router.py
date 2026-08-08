from fastapi import APIRouter
from app.api.endpoints import intent, recommendations, search, product_intelligence, analytics, realtime, roi, rag, dpdpa, auth

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(intent.router, prefix="/intent", tags=["User Intent Agent"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendation Agent"])
api_router.include_router(search.router, prefix="/search", tags=["Semantic Search Agent"])
api_router.include_router(product_intelligence.router, prefix="/product", tags=["Product Intelligence Agent"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Business Intelligence Agent"])
api_router.include_router(realtime.router, prefix="/realtime", tags=["Real-Time Discovery Engine"])
api_router.include_router(roi.router, prefix="/roi", tags=["Business Impact & ROI"])
api_router.include_router(rag.router, prefix="/rag", tags=["RAG Shopping Assistant"])
api_router.include_router(dpdpa.router, prefix="/dpdpa", tags=["DPDP Compliance & Data Rights"])

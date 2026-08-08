"""
DPDP compliance endpoints.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from fastapi.responses import JSONResponse
from app.core.dpdpa import dpdp_service


class ConsentRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=200)
    consent_given: bool = True
    consent_version: str = "1.0"


class DataAccessRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=200)


class DataDeleteRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=200)


class DataCorrectRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=200)
    updates: Dict[str, Any] = Field(default_factory=dict)


router = APIRouter()


@router.options("/consent")
def options_consent():
    return JSONResponse(content={}, status_code=200)


@router.post("/consent")
def record_consent(req: ConsentRequest):
    result = dpdp_service.record_consent(req.session_id, req.consent_given, req.consent_version)
    return {"status": "ok", "data": result}


@router.post("/consent/withdraw")
def withdraw_consent(req: DataAccessRequest):
    result = dpdp_service.withdraw_consent(req.session_id)
    return {"status": "ok", "data": result}


@router.get("/consent/{session_id}")
def get_consent_status(session_id: str):
    has = dpdp_service.has_consent(session_id)
    rec = dpdp_service.consents.get(session_id)
    return {"session_id": session_id, "has_consent": has, "consent": rec.to_dict() if rec else None}


@router.options("/data/access")
def options_data_access():
    return JSONResponse(content={}, status_code=200)


@router.post("/data/access")
def data_access(req: DataAccessRequest):
    result = dpdp_service.request_data_access(req.session_id)
    return {"status": "ok", "data": result}


@router.options("/data/delete")
def options_data_delete():
    return JSONResponse(content={}, status_code=200)


@router.post("/data/delete")
def data_delete(req: DataDeleteRequest):
    result = dpdp_service.request_data_deletion(req.session_id)
    return {"status": "ok", "data": result}


@router.options("/data/correct")
def options_data_correct():
    return JSONResponse(content={}, status_code=200)


@router.post("/data/correct")
def data_correct(req: DataCorrectRequest):
    if not req.updates:
        raise HTTPException(status_code=400, detail="updates must not be empty")
    result = dpdp_service.request_data_correction(req.session_id, req.updates)
    return {"status": "ok", "data": result}


@router.get("/audit")
def audit_log(session_id: Optional[str] = None, limit: int = 100):
    entries = dpdp_service.get_audit_log(session_id, limit)
    return {"count": len(entries), "entries": entries}


@router.get("/diversity-policy")
def diversity_policy():
    return {
        "max_single_category_pct": 0.35,
        "description": "No single category may exceed 35% of any recommended result set. Overshoot items are replaced with the next-best candidates from under-represented categories.",
        "applies_to": ["recommendations", "search", "rag", "complete-the-look", "fbt"],
    }

"""
DPDP compliance: consent, data-subject rights, audit logging, category diversity enforcement.
"""
import time
import uuid
import hashlib
import csv
import io
from typing import Dict, Any, List, Optional
from collections import defaultdict, deque
from app.core.config import settings


class ConsentRecord:
    def __init__(self, session_id: str, consent_given: bool = False, consent_version: str = "1.0"):
        self.session_id = session_id
        self.consent_given = consent_given
        self.consent_version = consent_version
        self.timestamp = time.time()
        self.purposes = ["recommendations", "personalization", "analytics"] if consent_given else []
        self.withdrawn_at: Optional[float] = None
        self.records: List[Dict[str, Any]] = []

    def withdraw(self) -> Dict[str, Any]:
        self.consent_given = False
        self.withdrawn_at = time.time()
        entry = {"event": "consent_withdrawn", "timestamp": self.withdrawn_at}
        self.records.append(entry)
        return entry

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "consent_given": self.consent_given,
            "consent_version": self.consent_version,
            "timestamp": self.timestamp,
            "withdrawn_at": self.withdrawn_at,
            "purposes": self.purposes,
        }


class DataSubjectRequest:
    def __init__(self, request_id: str, session_id: str, request_type: str):
        self.request_id = request_id
        self.session_id = session_id
        self.request_type = request_type
        self.created_at = time.time()
        self.processed_at: Optional[float] = None
        self.status = "received"
        self.payload: Dict[str, Any] = {}

    def mark_processed(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        self.processed_at = time.time()
        self.status = "processed"
        self.payload = payload
        return {"request_id": self.request_id, "status": self.status, "processed_at": self.processed_at}


class DPDPService:
    MAX_CATEGORY_DIVERSITY_PCT = 0.35
    DATA_RETENTION_DAYS = 90
    AUDIT_LOG_MAX = 5000

    def __init__(self):
        self.consents: Dict[str, ConsentRecord] = {}
        self.data_requests: Dict[str, DataSubjectRequest] = {}
        self.audit_log: List[Dict[str, Any]] = []
        self._session_data: Dict[str, Dict[str, Any]] = {}

    def record_consent(self, session_id: str, consent_given: bool = True, consent_version: str = "1.0") -> Dict[str, Any]:
        record = ConsentRecord(session_id, consent_given, consent_version)
        self.consents[session_id] = record
        self._audit("consent_recorded", session_id, {"consent_given": consent_given, "version": consent_version})
        return record.to_dict()

    def withdraw_consent(self, session_id: str) -> Dict[str, Any]:
        rec = self.consents.get(session_id)
        if not rec:
            rec = ConsentRecord(session_id)
            self.consents[session_id] = rec
        result = rec.withdraw()
        self._audit("consent_withdrawn", session_id, result)
        self._anonymize_session(session_id)
        return {"status": "withdrawn", "session_id": session_id, **result}

    def has_consent(self, session_id: str, purpose: str = "recommendations") -> bool:
        rec = self.consents.get(session_id)
        if not rec:
            return False
        return rec.consent_given and purpose in rec.purposes and rec.withdrawn_at is None

    def request_data_access(self, session_id: str) -> Dict[str, Any]:
        req = DataSubjectRequest(str(uuid.uuid4()), session_id, "access")
        self.data_requests[req.request_id] = req
        data = self._get_session_data(session_id)
        result = req.mark_processed({"type": "data_export", "data": data})
        self._audit("data_access", session_id, {"request_id": req.request_id})
        return {"status": result["status"], "request_id": result["request_id"], "processed_at": result["processed_at"], "data": data}

    def request_data_deletion(self, session_id: str) -> Dict[str, Any]:
        req = DataSubjectRequest(str(uuid.uuid4()), session_id, "deletion")
        self.data_requests[req.request_id] = req
        self._delete_session_data(session_id)
        result = req.mark_processed({"type": "deletion", "deleted": True})
        self._audit("data_deleted", session_id, {"request_id": req.request_id})
        return {"status": result["status"], "request_id": result["request_id"], "processed_at": result["processed_at"], "deleted": True}

    def request_data_correction(self, session_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        req = DataSubjectRequest(str(uuid.uuid4()), session_id, "correction")
        self.data_requests[req.request_id] = req
        stored = self._session_data.get(session_id, {})
        stored.update(updates)
        self._session_data[session_id] = stored
        result = req.mark_processed({"type": "correction", "updated_fields": list(updates.keys())})
        self._audit("data_corrected", session_id, {"request_id": req.request_id, "fields": list(updates.keys())})
        return {"status": result["status"], "request_id": result["request_id"], "processed_at": result["processed_at"], "updated_fields": list(updates.keys())}

    def enforce_category_diversity(self, products: List[Dict[str, Any]], top_k: int) -> List[Dict[str, Any]]:
        if not products:
            return products
        max_per_category = max(1, int(top_k * self.MAX_CATEGORY_DIVERSITY_PCT))
        category_counts: Dict[str, int] = defaultdict(int)
        diversified: List[Dict[str, Any]] = []
        for p in products:
            if len(diversified) >= top_k:
                break
            cat = p.get("category", "Unknown")
            if category_counts[cat] < max_per_category:
                diversified.append(p)
                category_counts[cat] += 1
        return diversified

    def get_audit_log(self, session_id: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        entries = self.audit_log
        if session_id:
            entries = [e for e in entries if e.get("session_id") == session_id]
        return entries[-limit:]

    def _audit(self, event: str, session_id: str, details: Dict[str, Any] = None) -> None:
        entry = {
            "timestamp": time.time(),
            "event": event,
            "session_id": session_id,
            "details": details or {},
        }
        self.audit_log.append(entry)
        if len(self.audit_log) > self.AUDIT_LOG_MAX:
            self.audit_log = self.audit_log[-self.AUDIT_LOG_MAX:]

    def _get_session_data(self, session_id: str) -> Dict[str, Any]:
        stored = self._session_data.get(session_id, {})
        consent = self.consents.get(session_id)
        result = {
            "session_id": session_id,
            "consent": consent.to_dict() if consent else None,
            "data": stored,
        }
        self._audit("data_exported", session_id, {"keys": list(stored.keys())})
        return result

    def _delete_session_data(self, session_id: str) -> None:
        self._session_data.pop(session_id, None)
        self.consents.pop(session_id, None)
        self._audit("session_data_deleted", session_id, {})

    def _anonymize_session(self, session_id: str) -> None:
        data = self._session_data.get(session_id, {})
        for key in list(data.keys()):
            if key in ("email", "name", "phone", "address", "device_id"):
                data[key] = "[REDACTED]"
        self._session_data[session_id] = data
        self._audit("session_anonymized", session_id, {})

    def store_session_data(self, session_id: str, payload: Dict[str, Any]) -> None:
        if not self.has_consent(session_id):
            return
        if session_id not in self._session_data:
            self._session_data[session_id] = {}
        self._session_data[session_id].update(payload)
        self._audit("session_data_stored", session_id, {"keys": list(payload.keys())})


dpdp_service = DPDPService()

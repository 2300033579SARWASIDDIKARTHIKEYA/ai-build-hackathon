import time
import uuid
from typing import Dict, Any, List, Optional
from collections import defaultdict, deque
from app.core.dpdpa import dpdp_service


class Session:
    def __init__(self, session_id: Optional[str] = None):
        self.session_id = session_id or str(uuid.uuid4())
        self.created_at = time.time()
        self.last_active_at = time.time()
        self.clickstream: deque = deque(maxlen=200)
        self.search_queries: deque = deque(maxlen=50)
        self.cart_items: List[str] = []
        self.viewed_products: deque = deque(maxlen=100)
        self.current_intent: Optional[Dict[str, Any]] = None
        self.user_embedding: Optional[Any] = None
        self.recommendation_cache: Dict[str, Any] = {}
        self.consent_given: bool = False

    def record_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        self.last_active_at = time.time()
        event["timestamp"] = self.last_active_at
        self.clickstream.append(event)

        if event.get("event_type") == "search":
            self.search_queries.append(event.get("query", ""))
        if event.get("product_id"):
            self.viewed_products.append(event["product_id"])
        if event.get("add_to_cart"):
            pid = event.get("product_id")
            if pid and pid not in self.cart_items:
                self.cart_items.append(pid)

        if dpdp_service.has_consent(self.session_id):
            dpdp_service.store_session_data(self.session_id, {
                "last_event": event,
                "clickstream_len": len(self.clickstream),
                "cart_count": len(self.cart_items),
            })

        return {
            "session_id": self.session_id,
            "event_logged": True,
            "clickstream_len": len(self.clickstream),
            "cart_count": len(self.cart_items)
        }

    def get_context(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "session_age_sec": round(time.time() - self.created_at, 2),
            "clickstream": list(self.clickstream) if dpdp_service.has_consent(self.session_id) else [],
            "search_queries": list(self.search_queries) if dpdp_service.has_consent(self.session_id) else [],
            "cart_count": len(self.cart_items),
            "viewed_products": list(self.viewed_products) if dpdp_service.has_consent(self.session_id) else [],
            "current_intent": self.current_intent,
            "consent_given": self.consent_given,
        }

    def is_expired(self, ttl_sec: int = 1800) -> bool:
        return (time.time() - self.last_active_at) > ttl_sec


class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, Session] = {}
        self.user_profiles: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
            "preferred_categories": defaultdict(int),
            "preferred_brands": defaultdict(int),
            "price_sensitivity": 0.5,
            "total_sessions": 0,
            "total_purchases": 0
        })

    def get_or_create(self, session_id: Optional[str] = None) -> Session:
        if session_id and session_id in self.sessions:
            sess = self.sessions[session_id]
            if not sess.is_expired():
                sess.last_active_at = time.time()
                return sess
            self._cleanup(session_id)

        new_session = Session(session_id)
        self.sessions[new_session.session_id] = new_session
        dpdp_service.record_consent(new_session.session_id, consent_given=False)
        return new_session

    def record(self, session_id: str, event: Dict[str, Any]) -> Dict[str, Any]:
        sess = self.get_or_create(session_id)
        result = sess.record_event(event)
        self._update_user_profile(sess, event)
        return result

    def get_session(self, session_id: str) -> Optional[Session]:
        return self.sessions.get(session_id)

    def get_context(self, session_id: str) -> Dict[str, Any]:
        sess = self.get_or_create(session_id)
        return sess.get_context()

    def update_intent(self, session_id: str, intent_payload: Dict[str, Any]) -> None:
        sess = self.get_or_create(session_id)
        sess.current_intent = intent_payload
        if dpdp_service.has_consent(session_id):
            dpdp_service.store_session_data(session_id, {"current_intent": intent_payload})

    def cache_recommendations(self, session_id: str, key: str, data: Any) -> None:
        sess = self.get_or_create(session_id)
        sess.recommendation_cache[key] = {
            "data": data,
            "ts": time.time()
        }

    def get_cached_recommendations(self, session_id: str, key: str) -> Optional[Any]:
        sess = self.get_or_create(session_id)
        entry = sess.recommendation_cache.get(key)
        if not entry:
            return None
        if time.time() - entry["ts"] > 300:
            del sess.recommendation_cache[key]
            return None
        return entry["data"]

    def _update_user_profile(self, session: Session, event: Dict[str, Any]) -> None:
        profile = self.user_profiles[session.session_id]
        profile["total_sessions"] += 1

        if event.get("category"):
            profile["preferred_categories"][event["category"]] += 1
        if event.get("brand"):
            profile["preferred_brands"][event["brand"]] += 1
        if event.get("add_to_cart"):
            profile["total_purchases"] += 1
        if event.get("price"):
            profile["price_sensitivity"] = max(0.0, min(1.0, 1.0 - (event["price"] / 1000.0)))

    def _cleanup(self, session_id: str) -> None:
        self.sessions.pop(session_id, None)

    def cleanup_expired(self) -> int:
        expired = [sid for sid, s in self.sessions.items() if s.is_expired()]
        for sid in expired:
            self._cleanup(sid)
        return len(expired)

    def stats(self) -> Dict[str, Any]:
        return {
            "active_sessions": len(self.sessions),
            "total_tracked_users": len(self.user_profiles),
            "total_clickstream_events": sum(len(s.clickstream) for s in self.sessions.values()),
            "consent_rate": sum(1 for s in self.sessions.values() if s.consent_given) / max(len(self.sessions), 1),
        }


session_manager = SessionManager()


from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.agents.user_intent_agent import user_intent_agent
from app.agents.realtime_engine import realtime_engine
from app.ml.datasets import PRODUCTS_DATABASE, FREQUENTLY_BOUGHT_TOGETHER
from app.core.session_manager import session_manager

router = APIRouter()


class RealtimeFeedRequest(BaseModel):
    session_id: Optional[str] = None
    top_k: int = 12


class RealtimeSearchRequest(BaseModel):
    query: str
    session_id: Optional[str] = None
    category_filter: Optional[str] = None
    top_k: int = 8


class ClickEventRequest(BaseModel):
    session_id: Optional[str] = None
    event_type: str = "view"
    product_id: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    tags: List[str] = []
    query: Optional[str] = None
    time_spent_sec: int = 5
    add_to_cart: bool = False


@router.post("/feed")
def get_realtime_feed(payload: RealtimeFeedRequest):
    session_id = payload.session_id or "default"
    return realtime_engine.get_home_feed(
        session_id=session_id,
        top_k=payload.top_k,
        products_db=PRODUCTS_DATABASE,
        frequently_bought_together=FREQUENTLY_BOUGHT_TOGETHER
    )


@router.post("/search")
def realtime_search(payload: RealtimeSearchRequest):
    session_id = payload.session_id or "default"
    return realtime_engine.semantic_search(
        session_id=session_id,
        query=payload.query,
        category_filter=payload.category_filter,
        top_k=payload.top_k
    )


@router.post("/complete-the-look/{product_id}")
def realtime_complete_the_look(product_id: str, session_id: Optional[str] = Query(None)):
    sid = session_id or "default"
    return realtime_engine.get_complete_the_look(session_id=sid, product_id=product_id)


@router.get("/frequently-bought-together/{product_id}")
def realtime_fbt(product_id: str, session_id: Optional[str] = Query(None)):
    sid = session_id or "default"
    return realtime_engine.get_frequently_bought_together(session_id=sid, product_id=product_id)


@router.post("/events/click")
def record_click_event(payload: ClickEventRequest):
    session_id = payload.session_id or "default"
    event = payload.dict(exclude_none=True)
    result = session_manager.record(session_id, event)

    if payload.add_to_cart and payload.product_id:
        intent_res = user_intent_agent.execute(
            clickstream=list(session_manager.get_session(session_id).clickstream),
            session_duration_sec=120,
            cart_count=len(session_manager.get_session(session_id).cart_items)
        )
        session_manager.update_intent(session_id, intent_res.recommendation)

    return result


@router.get("/session/context")
def get_session_context(session_id: Optional[str] = Query("default")):
    return session_manager.get_context(session_id)


@router.get("/session/intent")
def get_session_intent(session_id: Optional[str] = Query("default")):
    sess = session_manager.get_or_create(session_id)
    if not sess.current_intent:
        intent_res = user_intent_agent.execute(
            clickstream=list(sess.clickstream),
            session_duration_sec=120,
            cart_count=len(sess.cart_items)
        )
        sess.current_intent = intent_res.recommendation
    return {
        "session_id": session_id,
        "intent": sess.current_intent,
        "confidence": sess.current_intent.get("intent_score") if sess.current_intent else 0.72
    }


@router.get("/stats")
def get_realtime_stats():
    return session_manager.stats()


@router.websocket("/ws/clickstream/{session_id}")
async def clickstream_ws(websocket: WebSocket, session_id: str):
    await websocket.accept()
    session = session_manager.get_or_create(session_id)

    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("event_type", "view")
            product_id = data.get("product_id")
            category = data.get("category")
            brand = data.get("brand")
            tags = data.get("tags", [])
            query = data.get("query")
            time_spent = data.get("time_spent_sec", 5)
            add_to_cart = data.get("add_to_cart", False)

            event = {
                "event_type": event_type,
                "product_id": product_id,
                "category": category,
                "brand": brand,
                "tags": tags,
                "query": query,
                "time_spent_sec": time_spent,
                "add_to_cart": add_to_cart
            }

            session.record_event(event)

            if add_to_cart and product_id:
                intent_res = user_intent_agent.execute(
                    clickstream=list(session.clickstream),
                    session_duration_sec=120,
                    cart_count=len(session.cart_items)
                )
                session.current_intent = intent_res.recommendation
                await websocket.send_json({
                    "type": "intent_update",
                    "intent": intent_res.recommendation,
                    "confidence": intent_res.confidence_score
                })

            await websocket.send_json({
                "type": "ack",
                "event_logged": True,
                "cart_count": len(session.cart_items)
            })

    except WebSocketDisconnect:
        pass

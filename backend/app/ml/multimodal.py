import numpy as np
import hashlib
from typing import List, Dict, Any, Optional

EMBEDDING_DIM = 512

def text_to_embedding(text: str) -> np.ndarray:
    cleaned = text.lower().strip()
    seed_bytes = hashlib.sha256(cleaned.encode("utf-8")).digest()
    np.random.seed(int.from_bytes(seed_bytes[:4], byteorder="little"))
    vec = np.random.randn(EMBEDDING_DIM).astype(np.float32)

    if any(k in cleaned for k in ["leather", "blazer", "hoodie", "jeans", "apparel", "boots", "clothing", "jacket", "wool", "denim"]):
        vec[:100] += 2.5
    if any(k in cleaned for k in ["headphones", "keyboard", "mouse", "monitor", "audio", "tech", "electronics", "oled", "gaming"]):
        vec[100:200] += 2.5
    if any(k in cleaned for k in ["sunglasses", "watch", "backpack", "candle", "accessories", "home", "titanium", "bag"]):
        vec[200:300] += 2.5
    if any(k in cleaned for k in ["smart", "bluetooth", "wireless", "app", "temperature", "ceramic"]):
        vec[300:400] += 1.5
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec


def image_to_embedding(image_url: str) -> np.ndarray:
    return text_to_embedding(f"image_visual_features_{image_url}")


def build_multimodal_embedding(
    title: str,
    brand: str,
    category: str,
    subcategory: str,
    tags: List[str],
    attributes: Dict[str, str],
    image_url: str,
    price: float,
    rating: float
) -> np.ndarray:
    text_repr = f"{title} {brand} {category} {subcategory} {' '.join(tags)} {' '.join(attributes.values())}"
    text_emb = text_to_embedding(text_repr)
    img_emb = image_to_embedding(image_url)

    attr_vec = np.zeros(EMBEDDING_DIM, dtype=np.float32)
    attr_vec[400:420] = price / 1000.0
    attr_vec[420:440] = rating / 5.0
    attr_vec[440:450] = float(len(tags)) / 10.0

    combined = 0.60 * text_emb + 0.25 * img_emb + 0.15 * attr_vec
    combined = combined / np.linalg.norm(combined)
    return combined


def build_user_embedding(
    clickstream: List[Dict[str, Any]],
    search_queries: List[str],
    cart_product_ids: List[str],
    products_db: Dict[str, Dict[str, Any]]
) -> np.ndarray:
    if not clickstream and not search_queries and not cart_product_ids:
        return text_to_embedding("general browsing high quality products")

    tag_accum = []
    cat_accum = []
    brand_accum = []
    query_text = " ".join(search_queries)

    for event in clickstream[-50:]:
        tag_accum.extend(event.get("tags", []))
        if event.get("category"):
            cat_accum.append(event["category"])
        if event.get("brand"):
            brand_accum.append(event["brand"])
        if event.get("query"):
            query_text += " " + event["query"]

    for pid in cart_product_ids:
        prod = products_db.get(pid)
        if prod:
            tag_accum.extend(prod.get("tags", []))
            cat_accum.append(prod.get("category", ""))
            brand_accum.append(prod.get("brand", ""))

    tag_text = " ".join(tag_accum)
    cat_text = " ".join(cat_accum)
    brand_text = " ".join(brand_accum)

    tag_emb = text_to_embedding(tag_text) if tag_text else np.zeros(EMBEDDING_DIM, dtype=np.float32)
    cat_emb = text_to_embedding(cat_text) if cat_text else np.zeros(EMBEDDING_DIM, dtype=np.float32)
    brand_emb = text_to_embedding(brand_text) if brand_text else np.zeros(EMBEDDING_DIM, dtype=np.float32)
    query_emb = text_to_embedding(query_text) if query_text else np.zeros(EMBEDDING_DIM, dtype=np.float32)

    combined = 0.35 * tag_emb + 0.20 * cat_emb + 0.15 * brand_emb + 0.30 * query_emb
    norm = np.linalg.norm(combined)
    if norm > 0:
        combined = combined / norm
    return combined


def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    dot = np.dot(v1, v2)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(dot / (norm1 * norm2))


def intent_vector_boost(intent_type: str, intent_score: float) -> np.ndarray:
    base = text_to_embedding(f"user_intent_{intent_type}")
    return base * intent_score

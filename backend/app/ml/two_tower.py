import numpy as np
from typing import List, Dict, Any
from app.ml.embeddings import text_to_embedding, cosine_similarity

class TwoTowerRetrievalModel:
    """
    Two-Tower Recommendation Engine (User-Tower & Item-Tower).
    - User Tower maps real-time user clickstream history + user profile into User Dense Vector.
    - Item Tower projects item features into Item Dense Vector.
    The dot product / cosine similarity generates instant retrieval candidate sets.
    """
    def __init__(self):
        pass

    def compute_user_embedding(self, clickstream_history: List[str], cart_items: List[str]) -> np.ndarray:
        """Projects clickstream tags and cart history into a 512-d User Vector."""
        text_representation = " ".join(clickstream_history + cart_items)
        if not text_representation.strip():
            text_representation = "general browsing high quality apparel electronics"
        return text_to_embedding(text_representation)

    def rank_candidates(self, user_vec: np.ndarray, candidate_products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Ranks candidate products using User-Tower and Item-Tower score projections."""
        ranked = []
        for prod in candidate_products:
            item_text = f"{prod['title']} {prod['category']} {' '.join(prod['tags'])}"
            item_vec = text_to_embedding(item_text)
            
            # Two-Tower dot product score
            two_tower_score = cosine_similarity(user_vec, item_vec)
            
            # Combine with popularity prior
            combined_score = 0.75 * two_tower_score + 0.25 * prod.get("popularity_score", 0.5)
            
            p_copy = prod.copy()
            p_copy["two_tower_score"] = float(combined_score)
            ranked.append(p_copy)
            
        ranked.sort(key=lambda x: x["two_tower_score"], reverse=True)
        return ranked

two_tower_model = TwoTowerRetrievalModel()

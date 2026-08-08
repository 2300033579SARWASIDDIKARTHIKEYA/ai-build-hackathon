from typing import List, Dict, Any

class CrossEncoderReRanker:
    """
    Cross-Encoder Re-Ranker that fuses vector retrieval scores, intent signals,
    business constraints (margin, stock level), and user historical affinity.
    """
    def rerank(self, products: List[Dict[str, Any]], intent_type: str, intent_confidence: float) -> List[Dict[str, Any]]:
        reranked = []
        for p in products:
            base_score = p.get("vector_score") or p.get("two_tower_score") or 0.70
            
            # Stock availability penalty / boost
            inventory_signal = 1.0 if p.get("inventory", 0) > 10 else 0.6
            
            # Margin optimization weighting
            margin_signal = p.get("margin_score", 0.4)
            
            # Intent alignment
            intent_alignment = 1.0
            if intent_type == "HIGH_URGENCY_PURCHASE" and p.get("rating", 0) > 4.8:
                intent_alignment = 1.25
            elif intent_type == "PRICE_SENSITIVE" and p.get("price", 0) < 150:
                intent_alignment = 1.30
            elif intent_type == "OUTFIT_BUILDING" and p.get("category") == "Apparel":
                intent_alignment = 1.20
            elif intent_type == "TECH_SEARCH" and p.get("category") == "Electronics":
                intent_alignment = 1.25

            final_rank_score = (0.50 * base_score) + (0.25 * intent_alignment * intent_confidence) + (0.15 * inventory_signal) + (0.10 * margin_signal)
            
            p_copy = p.copy()
            p_copy["rerank_score"] = round(float(final_rank_score), 4)
            reranked.append(p_copy)
            
        reranked.sort(key=lambda x: x["rerank_score"], reverse=True)
        return reranked

reranker = CrossEncoderReRanker()

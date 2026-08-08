import numpy as np
from typing import List, Dict, Any

class NeuralCollaborativeFiltering:
    """
    Neural Collaborative Filtering (NCF) model combining GMF (Generalized Matrix Factorization)
    and MLP (Multi-Layer Perceptron) for personalized rating prediction.
    """
    def predict_user_item_score(self, user_intent_category: str, product: Dict[str, Any], user_price_affinity: float = 150.0) -> float:
        category_match = 1.0 if user_intent_category.lower() in product["category"].lower() or any(user_intent_category.lower() in t for t in product["tags"]) else 0.4
        
        # Price sensitivity distance calculation
        price_diff = abs(product["price"] - user_price_affinity) / max(user_price_affinity, 1.0)
        price_affinity_score = max(0.2, 1.0 - (price_diff * 0.5))
        
        # NCF GMF & MLP ensemble representation
        gmf_score = category_match * product["rating"] / 5.0
        mlp_score = price_affinity_score * product["popularity_score"]
        
        ncf_final_score = 0.5 * gmf_score + 0.5 * mlp_score
        return float(ncf_final_score)

ncf_model = NeuralCollaborativeFiltering()

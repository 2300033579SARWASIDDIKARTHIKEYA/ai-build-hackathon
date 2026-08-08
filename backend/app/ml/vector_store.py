import numpy as np
from typing import List, Dict, Any, Optional
from app.ml.embeddings import text_to_embedding, image_to_embedding, cosine_similarity
from app.ml.datasets import PRODUCTS_DATABASE

class VectorStoreIndex:
    """
    In-memory vector store supporting fast Cosine Similarity retrieval,
    multimodal vector indexing, visual search, and category filtering.
    """
    def __init__(self, products: List[Dict[str, Any]]):
        self.products = products
        self.item_vectors: Dict[str, np.ndarray] = {}
        self.build_index()

    def build_index(self):
        """Indexes all products by generating 512-d dense text + visual embeddings."""
        for prod in self.products:
            text_repr = f"{prod['title']} {prod['brand']} {prod['category']} {prod['subcategory']} {' '.join(prod['tags'])}"
            text_emb = text_to_embedding(text_repr)
            img_emb = image_to_embedding(prod["image"])
            # Combined multimodal representation (70% text semantics + 30% visual representation)
            combined = 0.7 * text_emb + 0.3 * img_emb
            combined = combined / np.linalg.norm(combined)
            self.item_vectors[prod["id"]] = combined

    def search_by_query(self, query: str, top_k: int = 6, category_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Searches vector index using a natural language query string."""
        query_emb = text_to_embedding(query)
        scored_products = []
        
        for prod in self.products:
            if category_filter and category_filter != "All" and prod["category"].lower() != category_filter.lower():
                continue
                
            item_emb = self.item_vectors[prod["id"]]
            sim = cosine_similarity(query_emb, item_emb)
            
            # Boost score based on keyword match in tags or title
            query_terms = query.lower().split()
            title_terms = prod["title"].lower().split()
            tag_terms = [t.lower() for t in prod["tags"]]
            
            keyword_bonus = 0.0
            for term in query_terms:
                if term in title_terms or term in tag_terms:
                    keyword_bonus += 0.15
                    
            final_score = min(1.0, sim + keyword_bonus)
            
            p_copy = prod.copy()
            p_copy["vector_score"] = float(final_score)
            scored_products.append(p_copy)
            
        scored_products.sort(key=lambda x: x["vector_score"], reverse=True)
        return scored_products[:top_k]

    def search_by_image(self, image_input: str, top_k: int = 6) -> List[Dict[str, Any]]:
        """Searches vector index using an image vector or URL."""
        img_emb = image_to_embedding(image_input)
        scored_products = []
        
        for prod in self.products:
            item_emb = self.item_vectors[prod["id"]]
            sim = cosine_similarity(img_emb, item_emb)
            p_copy = prod.copy()
            p_copy["vector_score"] = float(sim)
            scored_products.append(p_copy)
            
        scored_products.sort(key=lambda x: x["vector_score"], reverse=True)
        return scored_products[:top_k]

    def get_similar_items(self, item_id: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """Finds visually and semantically similar items for a target product ID."""
        if item_id not in self.item_vectors:
            return []
            
        target_emb = self.item_vectors[item_id]
        scored_products = []
        
        for prod in self.products:
            if prod["id"] == item_id:
                continue
            item_emb = self.item_vectors[prod["id"]]
            sim = cosine_similarity(target_emb, item_emb)
            p_copy = prod.copy()
            p_copy["vector_score"] = float(sim)
            scored_products.append(p_copy)
            
        scored_products.sort(key=lambda x: x["vector_score"], reverse=True)
        return scored_products[:top_k]

# Global singleton instance of vector index
vector_index = VectorStoreIndex(PRODUCTS_DATABASE)

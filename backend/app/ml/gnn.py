"""
Graph Neural Network for Product Co-Purchase Relationships.
Simulates GCN/GAT message passing on product co-occurrence graph.
"""
import math
import hashlib
import numpy as np
from typing import Dict, List, Optional, Tuple

class ProductGNN:
    def __init__(self, products_db: List[Dict], frequently_bought_together: Dict[str, List[str]]):
        self.products = {p["id"]: p for p in products_db}
        self.product_ids = list(self.products.keys())
        self.n_products = len(self.product_ids)
        self.id_to_idx = {pid: i for i, pid in enumerate(self.product_ids)}
        self.embedding_dim = 64
        self.fbt = frequently_bought_together
        self.node_embeddings = self._init_embeddings()
        self._build_adjacency()
        self._message_passing(2)

    def _init_embeddings(self) -> np.ndarray:
        embs = {}
        for pid in self.product_ids:
            seed = int(hashlib.md5(f"gnn_{pid}".encode()).hexdigest()[:8], 16)
            rng = np.random.RandomState(seed)
            emb = rng.randn(self.embedding_dim).astype(np.float32)
            p = self.products[pid]
            cat_idx = hash(p.get("category", "")) % 20
            emb[cat_idx % self.embedding_dim] += 1.5
            brand_idx = hash(p.get("brand", "")) % 20
            emb[(brand_idx + 10) % self.embedding_dim] += 1.5
            norm = np.linalg.norm(emb)
            embs[pid] = emb / norm if norm > 0 else emb
        return np.array([embs[pid] for pid in self.product_ids], dtype=np.float32)

    def _build_adjacency(self):
        n = self.n_products
        self.adj = np.zeros((n, n), dtype=np.float32)
        for pid, related_ids in self.fbt.items():
            if pid not in self.id_to_idx:
                continue
            i = self.id_to_idx[pid]
            for rid in related_ids:
                if rid in self.id_to_idx:
                    j = self.id_to_idx[rid]
                    self.adj[i, j] = 1.0
                    self.adj[j, i] = 1.0
        deg = self.adj.sum(axis=1, keepdims=True)
        deg = np.where(deg == 0, 1.0, deg)
        self.norm_adj = self.adj / deg

    def _relu(self, x):
        return np.maximum(0, x)

    def _message_passing(self, layers: int = 2):
        h = self.node_embeddings.copy()
        for _ in range(layers):
            h_new = self.norm_adj @ h
            h_new = self._relu(h_new)
            h_new = h_new / (np.linalg.norm(h_new, axis=1, keepdims=True) + 1e-8)
            h = 0.7 * h + 0.3 * h_new
        self.node_embeddings = h

    def get_embedding(self, product_id: str) -> Optional[np.ndarray]:
        idx = self.id_to_idx.get(product_id)
        return self.node_embeddings[idx] if idx is not None else None

    def similar_products(self, product_id: str, top_k: int = 5) -> List[Tuple[str, float]]:
        emb = self.get_embedding(product_id)
        if emb is None:
            return []
        sims = self.node_embeddings @ emb
        idx = self.id_to_idx[product_id]
        sims[idx] = -1.0
        top_indices = np.argsort(sims)[::-1][:top_k]
        return [(self.product_ids[i], float(sims[i])) for i in top_indices]

    def cross_product_score(self, product_a: str, product_b: str) -> float:
        emb_a = self.get_embedding(product_a)
        emb_b = self.get_embedding(product_b)
        if emb_a is None or emb_b is None:
            return 0.0
        fbt_boost = 1.2 if product_b in self.fbt.get(product_a, []) else 1.0
        return float(np.dot(emb_a, emb_b) * fbt_boost)

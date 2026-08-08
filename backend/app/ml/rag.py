"""
RAG: Retrieval-Augmented Generation for ALGUD AI Shopping Assistant.
"""
import os
import re
from typing import List, Dict, Any, Optional
from app.ml.embeddings import text_to_embedding, cosine_similarity
from app.ml.datasets import PRODUCTS_DATABASE
from app.core.config import settings
from app.core.dpdpa import dpdp_service


class RAGRetriever:
    def __init__(self):
        self.products = {p["id"]: p for p in PRODUCTS_DATABASE}
        self.product_ids = list(self.products.keys())
        self._build_index()

    def _build_index(self):
        self._id_to_vec = {}
        for pid in self.product_ids:
            text_repr = (
                f"{self.products[pid]['title']} {self.products[pid]['brand']} "
                f"{self.products[pid]['category']} {self.products[pid]['subcategory']} "
                f"{' '.join(self.products[pid]['tags'])}"
            )
            self._id_to_vec[pid] = text_to_embedding(text_repr)

    def retrieve(self, query: str, top_k: int = 4, category_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        query_vec = text_to_embedding(query)
        scored: List[Dict[str, Any]] = []
        for pid in self.product_ids:
            p = self.products[pid]
            if category_filter and category_filter.lower() not in ("all", "", "any"):
                if p["category"].lower() != category_filter.lower():
                    continue
            sim = float(cosine_similarity(query_vec, self._id_to_vec[pid]))
            query_terms = query.lower().split()
            title_terms = p["title"].lower().split()
            tag_terms = [t.lower() for t in p["tags"]]
            keyword_bonus = sum(0.12 for term in query_terms if term in title_terms or term in tag_terms)
            final_score = min(1.0, sim + keyword_bonus)
            scored.append({
                "id": pid,
                "title": p["title"],
                "brand": p["brand"],
                "category": p["category"],
                "price": p["price"],
                "rating": p["rating"],
                "reviews_count": p["reviews_count"],
                "tags": p["tags"][:4],
                "score": round(final_score, 4),
            })
        scored.sort(key=lambda x: x["score"], reverse=True)
        results = scored[:top_k * 2]
        results = dpdp_service.enforce_category_diversity(results, top_k)
        return results


class RAGGenerator:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY") or getattr(settings, "OPENAI_API_KEY", "")

    def _format_product(self, p: Dict[str, Any]) -> str:
        return (
            f"- {p['title']} ({p['brand']}) | {p['category']} | "
            f"₹{p['price']:,.2f} | {p['rating']}★ ({p['reviews_count']} reviews) | "
            f"tags: {', '.join(p['tags'][:3])}"
        )

    def _heuristic_response(self, query: str, context: str, products: List[Dict[str, Any]]) -> str:
        if not products:
            return (
                f"I couldn't find a strong match for \"{query}\" in our catalog right now. "
                "Try describing the product, category, or vibe you're after — I'll pull the best options."
            )
        lines = [f"I found {len(products)} great match{'es' if len(products) != 1 else ''} for \"{query}\":", ""]
        for i, p in enumerate(products, 1):
            lines.append(f"{i}. **{p['title']}** by {p['brand']}")
            lines.append(f"   Category: {p['category']} | Price: ₹{p['price']:,.2f} | Rating: {p['rating']}★")
            lines.append(f"   Why it fits: {', '.join(p['tags'][:3])} match your request.")
            lines.append("")
        if len(products) >= 2:
            total = sum(p["price"] for p in products[:2])
            lines.append(f"Bundle idea: the top 2 items together would be ₹{total:,.2f}.")
            lines.append("Want me to narrow by budget, category, or style?")
        return "\n".join(lines)

    def generate(self, query: str, retrieved_products: List[Dict[str, Any]], chat_history: Optional[List[Dict[str, str]]] = None) -> str:
        context = "\n".join(self._format_product(p) for p in retrieved_products)
        if self.openai_api_key:
            try:
                return self._openai_generate(query, context, chat_history)
            except Exception:
                pass
        return self._heuristic_response(query, context, retrieved_products)

    def _openai_generate(self, query: str, context: str, chat_history: Optional[List[Dict[str, str]]]) -> str:
        import openai
        openai.api_key = self.openai_api_key
        messages = [
            {
                "role": "system",
                "content": (
                    "You are ALGUD AI, a helpful shopping assistant. "
                    "Use the retrieved product context to answer accurately. "
                    "Keep answers concise, friendly, and actionable. "
                    "If you don't know, say so."
                ),
            }
        ]
        if chat_history:
            for turn in chat_history[-6:]:
                messages.append({"role": turn["role"], "content": turn["content"]})
        messages.append({
            "role": "user",
            "content": f"User query: {query}\n\nRetrieved product catalog context:\n{context}\n\nAnswer the user's question using the context.",
        })
        resp = openai.ChatCompletion.create(model="gpt-3.5-turbo", messages=messages, max_tokens=300, temperature=0.4)
        return resp.choices[0].message.content.strip()


class RAGPipeline:
    def __init__(self):
        self.retriever = RAGRetriever()
        self.generator = RAGGenerator()

    def chat(self, query: str, top_k: int = 4, category_filter: Optional[str] = None, chat_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        products = self.retriever.retrieve(query, top_k=top_k, category_filter=category_filter)
        answer = self.generator.generate(query, products, chat_history)
        return {
            "query": query,
            "answer": answer,
            "retrieved_products": products,
            "model": "openai-gpt-3.5-turbo" if self.generator.openai_api_key else "algud-heuristic-rag-v1",
        }


rag_pipeline = RAGPipeline()

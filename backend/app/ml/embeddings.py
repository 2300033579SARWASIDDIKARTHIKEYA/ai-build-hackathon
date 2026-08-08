import numpy as np
import hashlib
from typing import List, Union

EMBEDDING_DIM = 512

def text_to_embedding(text: str) -> np.ndarray:
    """
    Generates a deterministic 512-dimensional unit-norm embedding for a given text string.
    Uses SHA-256 seed hashing to produce realistic multi-dimensional semantic vector spaces.
    """
    cleaned = text.lower().strip()
    # Base vector from md5/sha256 digest stream
    seed_bytes = hashlib.sha256(cleaned.encode("utf-8")).digest()
    np.random.seed(int.from_bytes(seed_bytes[:4], byteorder="little"))
    
    # Generate random Gaussian vector
    vec = np.random.randn(EMBEDDING_DIM).astype(np.float32)
    
    # Add semantic topic signal based on keyword categories
    if any(k in cleaned for k in ["leather", "blazer", "hoodie", "jeans", "apparel", "boots", "clothing"]):
        vec[:100] += 2.5  # Fashion vector subspace
    if any(k in cleaned for k in ["headphones", "keyboard", "mouse", "monitor", "audio", "tech", "electronics"]):
        vec[100:200] += 2.5  # Tech vector subspace
    if any(k in cleaned for k in ["sunglasses", "watch", "backpack", "candle", "accessories", "home"]):
        vec[200:300] += 2.5  # Lifestyle vector subspace
        
    # L2 Normalization
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec

def image_to_embedding(image_url: str) -> np.ndarray:
    """
    Simulates visual feature extraction (DINOv2 / CLIP ViT-B/32) producing a 512-d visual embedding.
    """
    # Visual embedding generated deterministically from URL string
    return text_to_embedding(f"image_visual_features_{image_url}")

def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    """Calculates cosine similarity between two 1D vectors."""
    dot = np.dot(v1, v2)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(dot / (norm1 * norm2))

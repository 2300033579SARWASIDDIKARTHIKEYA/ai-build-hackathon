"""
Session Transformer: Simulates lightweight transformer encoder for sequential user behavior.
Captures temporal attention patterns across clickstream events.
"""
import math
import numpy as np
from typing import List, Dict, Optional
from collections import deque

class PositionalEncoding:
    def __init__(self, d_model: int, max_len: int = 50):
        pe = np.zeros((max_len, d_model), dtype=np.float32)
        position = np.arange(max_len)[:, np.newaxis]
        div_term = np.exp(np.arange(0, d_model, 2) * -(math.log(10000.0) / d_model))
        pe[:, 0::2] = np.sin(position * div_term)
        pe[:, 1::2] = np.cos(position * div_term)
        self.pe = pe

    def get(self, seq_len: int) -> np.ndarray:
        return self.pe[:seq_len]

def _softmax(x):
    x_max = np.max(x, axis=-1, keepdims=True)
    exp_x = np.exp(x - x_max)
    return exp_x / (exp_x.sum(axis=-1, keepdims=True) + 1e-8)

class SessionTransformer:
    def __init__(self, d_model: int = 64, n_heads: int = 4, n_layers: int = 2):
        self.d_model = d_model
        self.n_heads = n_heads
        self.head_dim = d_model // n_heads
        self.n_layers = n_layers
        self.max_seq_len = 50
        self.pos_encoder = PositionalEncoding(d_model, self.max_seq_len)
        self.event_types = ["view", "click", "cart", "wishlist", "search", "purchase"]
        self.n_event_types = len(self.event_types)
        self.event_embedding_matrix = self._init_event_embeddings()
        self.W_q = [np.random.randn(d_model, d_model).astype(np.float32) * 0.1 for _ in range(n_layers)]
        self.W_k = [np.random.randn(d_model, d_model).astype(np.float32) * 0.1 for _ in range(n_layers)]
        self.W_v = [np.random.randn(d_model, d_model).astype(np.float32) * 0.1 for _ in range(n_layers)]
        self.W_o = [np.random.randn(d_model, d_model).astype(np.float32) * 0.1 for _ in range(n_layers)]
        self.ffn_w1 = [np.random.randn(d_model, d_model * 2).astype(np.float32) * 0.1 for _ in range(n_layers)]
        self.ffn_w2 = [np.random.randn(d_model * 2, d_model).astype(np.float32) * 0.1 for _ in range(n_layers)]
        self.ffn_b1 = [np.zeros(d_model * 2, dtype=np.float32) for _ in range(n_layers)]
        self.ffn_b2 = [np.zeros(d_model, dtype=np.float32) for _ in range(n_layers)]
        self.layer_norm_gamma = [np.ones(d_model, dtype=np.float32) for _ in range(n_layers * 2)]
        self.layer_norm_beta = [np.zeros(d_model, dtype=np.float32) for _ in range(n_layers * 2)]

    def _init_event_embeddings(self) -> np.ndarray:
        rng = np.random.RandomState(42)
        return rng.randn(self.n_event_types, self.d_model).astype(np.float32) * 0.1

    def _layer_norm(self, x: np.ndarray, gamma: np.ndarray, beta: np.ndarray, eps: float = 1e-5) -> np.ndarray:
        mean = x.mean(axis=-1, keepdims=True)
        var = x.var(axis=-1, keepdims=True)
        return gamma * (x - mean) / np.sqrt(var + eps) + beta

    def _relu(self, x):
        return np.maximum(0, x)

    def _multi_head_attention(self, x: np.ndarray, layer_idx: int) -> np.ndarray:
        seq_len, d_model = x.shape
        Q = x @ self.W_q[layer_idx]
        K = x @ self.W_k[layer_idx]
        V = x @ self.W_v[layer_idx]
        Q = Q.reshape(seq_len, self.n_heads, self.head_dim).transpose(1, 0, 2)
        K = K.reshape(seq_len, self.n_heads, self.head_dim).transpose(1, 0, 2)
        V = V.reshape(seq_len, self.n_heads, self.head_dim).transpose(1, 0, 2)
        scores = (Q @ K.transpose(0, 2, 1)) / math.sqrt(self.head_dim)
        causal_mask = np.triu(np.ones((seq_len, seq_len), dtype=np.float32) * -1e9, k=1)
        scores = scores + causal_mask[np.newaxis, :, :]
        attn = _softmax(scores)
        context = attn @ V
        context = context.transpose(1, 0, 2).reshape(seq_len, d_model)
        out = context @ self.W_o[layer_idx]
        return self._layer_norm(x + out, self.layer_norm_gamma[layer_idx * 2], self.layer_norm_beta[layer_idx * 2])

    def _feed_forward(self, x: np.ndarray, layer_idx: int) -> np.ndarray:
        h = x @ self.ffn_w1[layer_idx] + self.ffn_b1[layer_idx]
        h = self._relu(h)
        h = h @ self.ffn_w2[layer_idx] + self.ffn_b2[layer_idx]
        return self._layer_norm(x + h, self.layer_norm_gamma[layer_idx * 2 + 1], self.layer_norm_beta[layer_idx * 2 + 1])

    def encode_session(self, clickstream: List[Dict]) -> np.ndarray:
        if not clickstream:
            return np.zeros(self.d_model, dtype=np.float32)
        seq = clickstream[-self.max_seq_len:]
        event_ids = []
        for ev in seq:
            etype = ev.get("event_type", "view")
            idx = self.event_types.index(etype) if etype in self.event_types else 0
            event_ids.append(idx)
        event_embs = self.event_embedding_matrix[event_ids]
        pe = self.pos_encoder.get(len(seq))
        x = event_embs + pe
        x = x / (np.linalg.norm(x, axis=-1, keepdims=True) + 1e-8)
        for i in range(self.n_layers):
            x = self._multi_head_attention(x, i)
            x = self._feed_forward(x, i)
        return x.mean(axis=0)

    def compute_session_similarity(self, clickstream_a: List[Dict], clickstream_b: List[Dict]) -> float:
        if not clickstream_a or not clickstream_b:
            return 0.0
        emb_a = self.encode_session(clickstream_a)
        emb_b = self.encode_session(clickstream_b)
        return float(np.dot(emb_a, emb_b))

    def next_event_probability(self, clickstream: List[Dict], candidate_event_types: List[str]) -> Dict[str, float]:
        session_emb = self.encode_session(clickstream)
        type_embs = np.array([self.event_embedding_matrix[self.event_types.index(et)] for et in candidate_event_types if et in self.event_types], dtype=np.float32)
        if len(type_embs) == 0:
            return {et: 1.0 / len(candidate_event_types) for et in candidate_event_types}
        scores = type_embs @ session_emb
        probs = _softmax(scores)
        result = {}
        for i, et in enumerate([et for et in candidate_event_types if et in self.event_types]):
            result[et] = float(probs[i])
        return result


session_transformer = SessionTransformer(d_model=64, n_heads=4, n_layers=2)

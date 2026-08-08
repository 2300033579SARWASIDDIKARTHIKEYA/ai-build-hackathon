import React, { useState, useEffect } from 'react';
import { Product, OutfitLook } from '../types/product';
import { AgentResponse, UserIntentPayload, ClickstreamEvent } from '../types/agent';
import { predictUserIntent, fetchPersonalizedFeed, fetchCompleteTheLook, searchSemanticText } from '../services/api';
import { IntentBanner } from '../components/storefront/IntentBanner';
import { ProductCard } from '../components/storefront/ProductCard';
import { CompleteTheLookModal } from '../components/storefront/CompleteTheLookModal';
import { Sparkles, Layers, ShoppingBag, Filter, ArrowRight } from 'lucide-react';

interface Props {
  cartCount: number;
  onAddToCart: (p: Product) => void;
  onAddBundleToCart: (items: Product[]) => void;
  searchQuery: string;
}

export const Storefront: React.FC<Props> = ({
  cartCount,
  onAddToCart,
  onAddBundleToCart,
  searchQuery
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const [intentData, setIntentData] = useState<AgentResponse<UserIntentPayload> | null>(null);
  const [clickstream, setClickstream] = useState<ClickstreamEvent[]>([]);

  const [selectedLook, setSelectedLook] = useState<OutfitLook | null>(null);
  const [lookReasoning, setLookReasoning] = useState<string>('');
  const [lookConfidence, setLookConfidence] = useState<number>(0.98);

  useEffect(() => {
    loadPersonalizedFeed();
  }, [clickstream, searchQuery, activeCategory]);

  const loadPersonalizedFeed = async () => {
    setLoading(true);
    try {
      if (searchQuery.trim()) {
        const searchRes = await searchSemanticText(searchQuery, activeCategory);
        setProducts(searchRes.recommendation.results);
      } else {
        const intentRes = await predictUserIntent(clickstream, 120, cartCount);
        setIntentData(intentRes);

        const feedRes = await fetchPersonalizedFeed(
          intentRes.recommendation.intent_type,
          intentRes.recommendation.intent_score,
          clickstream.map(c => c.category || '').filter(Boolean)
        );
        
        let feedProds = feedRes.recommendation.products;
        if (activeCategory !== 'All') {
          feedProds = feedProds.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());
        }
        setProducts(feedProds);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product: Product) => {
    const newEvent: ClickstreamEvent = {
      event_type: 'click',
      product_id: product.id,
      category: product.category,
      tags: product.tags,
      time_spent_sec: 18,
      timestamp: Date.now()
    };
    setClickstream(prev => [...prev, newEvent]);
  };

  const handleOpenCompleteLook = async (product: Product) => {
    handleProductClick(product);
    const lookRes = await fetchCompleteTheLook(product.id);
    setSelectedLook(lookRes.recommendation);
    setLookReasoning(lookRes.reasoning);
    setLookConfidence(lookRes.confidence_score);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 font-sans bg-white">
      
      {/* Intent Banner */}
      {intentData && (
        <IntentBanner
          intentPayload={intentData.recommendation}
          confidence={intentData.confidence_score}
          reasoning={intentData.reasoning}
          latencyMs={intentData.latency_ms}
        />
      )}

      {/* Category Pills & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase font-bold text-gray-500 tracking-wider mr-2">
            Categories:
          </span>
          {['All', 'Apparel', 'Electronics', 'Accessories', 'Home & Living'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-red-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-red-600 hover:text-red-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Showing <span className="font-bold text-gray-900">{products.length}</span> products
        </div>
      </div>

      {/* Feed Product Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-red-600">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin" />
          <p className="text-xs text-gray-500">Loading products...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onAddToCart={(p) => {
                onAddToCart(p);
                handleProductClick(p);
              }}
              onSelectCompleteLook={handleOpenCompleteLook}
              onProductClick={handleProductClick}
            />
          ))}
        </div>
      )}

      {/* Complete the Look Outfit Modal */}
      <CompleteTheLookModal
        look={selectedLook}
        onClose={() => setSelectedLook(null)}
        onAddBundleToCart={onAddBundleToCart}
        confidence={lookConfidence}
        reasoning={lookReasoning}
      />

    </main>
  );
};

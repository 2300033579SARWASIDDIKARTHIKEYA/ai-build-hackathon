import React, { useState, useEffect } from 'react';
import { Product } from '../types/product';
import { predictUserIntent, fetchPersonalizedFeed, searchSemanticText } from '../services/api';
import { ProductCard } from '../components/storefront/ProductCard';
import { Heart, Zap } from 'lucide-react';

export const RecommendedPage: React.FC<{
  cartCount: number;
  onAddToCart: (p: Product) => void;
  onAddBundleToCart: (items: Product[]) => void;
  searchQuery?: string;
}> = ({ cartCount, onAddToCart, onAddBundleToCart, searchQuery }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [intentLabel, setIntentLabel] = useState<string>('Personalized For You');

  useEffect(() => {
    loadRecommendations();
  }, [searchQuery]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      if (searchQuery && searchQuery.trim()) {
        const searchRes = await searchSemanticText(searchQuery.trim());
        setProducts(searchRes.recommendation.results);
        setIntentLabel('Search Results');
      } else {
        const intentRes = await predictUserIntent([], 120, cartCount);
        setIntentLabel(intentRes.recommendation.intent_type.replace(/_/g, ' '));

        const feedRes = await fetchPersonalizedFeed(
          intentRes.recommendation.intent_type,
          intentRes.recommendation.intent_score,
          []
        );
        setProducts(feedRes.recommendation.products);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 font-sans bg-white">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-5 h-5 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">Recommended For You</h1>
          </div>
          <p className="text-sm text-gray-500">
            AI-curated picks based on your taste profile — <span className="text-red-600 font-semibold">{intentLabel}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
          <Zap className="w-4 h-4 text-red-600" />
          <span>Powered by Two-Tower + Cross-Encoder Re-Ranking</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-red-600">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin" />
          <p className="text-xs text-gray-500">Generating your personalized recommendations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onAddToCart={(p) => {
                onAddToCart(p);
              }}
              onSelectCompleteLook={() => {}}
              onProductClick={() => {}}
            />
          ))}
        </div>
      )}
    </main>
  );
};

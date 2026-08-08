import React, { useState } from 'react';
import { Product } from '../../types/product';
import { searchVisualSearch } from '../../services/api';
import { X, Camera, Upload, ArrowRight } from 'lucide-react';
import { ProductCard } from './ProductCard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (p: Product) => void;
  onSelectCompleteLook: (p: Product) => void;
}

export const VisualSearchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAddToCart,
  onSelectCompleteLook
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const sampleImages = [
    { title: "Leather Jacket Look", url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400" },
    { title: "Pro Audio Headphones", url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400" },
    { title: "Denim & Boots Outfit", url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400" }
  ];

  const handleSelectImage = async (url: string) => {
    setSelectedImage(url);
    setLoading(true);
    try {
      const data = await searchVisualSearch(url);
      setResults(data.recommendation.results);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-gray-500">Visual Product Search</span>
              <h2 className="text-lg font-bold text-gray-900">Find Similar Products</h2>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Sample Selectors */}
          <div>
            <p className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-3">
              Select an image to find visually similar products:
            </p>
            <div className="grid grid-cols-3 gap-4">
              {sampleImages.map((sample, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectImage(sample.url)}
                  className={`group relative aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                    selectedImage === sample.url ? 'border-red-600' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={sample.url} alt={sample.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent p-2 flex items-end">
                    <span className="text-xs font-bold text-white">{sample.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Results Grid */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-500">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin" />
              <p className="text-xs">Searching for similar products...</p>
            </div>
          ) : results.length > 0 ? (
            <div>
              <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-3">
                Top Visually Similar Products ({results.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {results.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onAddToCart={onAddToCart}
                    onSelectCompleteLook={onSelectCompleteLook}
                    onProductClick={() => {}}
                  />
                ))}
              </div>
            </div>
          ) : null}

        </div>

      </div>
    </div>
  );
};

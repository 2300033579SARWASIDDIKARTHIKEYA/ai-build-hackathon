import React from 'react';
import { OutfitLook } from '../../types/product';
import { X, Layers, Check, ShoppingBag } from 'lucide-react';

interface Props {
  look: OutfitLook | null;
  onClose: () => void;
  onAddBundleToCart: (items: any[]) => void;
  confidence: number;
  reasoning: string;
}

export const CompleteTheLookModal: React.FC<Props> = ({
  look,
  onClose,
  onAddBundleToCart,
  confidence,
  reasoning
}) => {
  if (!look) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold text-gray-500">Complete the Look</span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-bold">
                  Save {look.discount_percentage}%
                </span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">{look.title}</h2>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Bundle Items Grid */}
          <div>
            <h3 className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-3">Included Pieces</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {look.items.map((item, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-3 flex flex-col justify-between group">
                  <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-gray-100">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-semibold">{item.brand}</span>
                    <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{item.title}</h4>
                     <p className="text-xs font-extrabold text-gray-900 mt-1">₹{item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Pricing & CTA */}
        <div className="p-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-gray-500">Total Bundle Price ({look.items.length} Items):</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900">₹{look.bundle_price.toFixed(2)}</span>
              <span className="text-sm text-gray-400 line-through">₹{look.original_total.toFixed(2)}</span>
              <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                Save ₹{(look.original_total - look.bundle_price).toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              onAddBundleToCart(look.items);
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add Complete Outfit to Cart</span>
          </button>
        </div>

      </div>
    </div>
  );
};

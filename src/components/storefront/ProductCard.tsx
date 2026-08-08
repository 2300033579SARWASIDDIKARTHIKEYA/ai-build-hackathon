import React from 'react';
import { Product } from '../../types/product';
import { Star, ShoppingCart } from 'lucide-react';

interface Props {
  product: Product;
  onAddToCart: (p: Product) => void;
  onSelectCompleteLook: (p: Product) => void;
  onProductClick: (p: Product) => void;
}

export const ProductCard: React.FC<Props> = ({
  product,
  onAddToCart,
  onSelectCompleteLook,
  onProductClick
}) => {
  return (
    <div 
      onClick={() => onProductClick(product)}
      className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-lg flex flex-col cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img 
          src={product.image} 
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 mb-1">
            <span className="uppercase tracking-wider font-semibold text-gray-600">{product.brand}</span>
            <div className="flex items-center gap-1 text-gray-700 font-bold">
              <Star className="w-3.5 h-3.5 fill-gray-900" />
              <span>{product.rating}</span>
              <span className="text-gray-400">({product.reviews_count})</span>
            </div>
          </div>

          <h3 className="font-bold text-sm text-gray-900 line-clamp-1">
            {product.title}
          </h3>

          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
            {Object.values(product.attributes).join(' · ')}
          </p>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-gray-900">₹{product.price.toFixed(2)}</span>
              {product.original_price > product.price && (
                <span className="text-xs text-gray-400 line-through">₹{product.original_price.toFixed(2)}</span>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all active:scale-95"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

      </div>
    </div>
  );
};

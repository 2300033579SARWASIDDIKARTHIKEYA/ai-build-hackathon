import React, { useState } from 'react';
import { Product } from '../types/product';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, CheckCircle } from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

interface Props {
  cartItems: CartItem[];
  onRemove: (productId: string) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onContinueShopping: () => void;
}

export const CartPage: React.FC<Props> = ({
  cartItems,
  onRemove,
  onUpdateQuantity,
  onContinueShopping
}) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setOrderPlaced(true);
    }, 1200);
  };

  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-12 font-sans bg-white">
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Your cart is empty</h2>
          <p className="text-sm text-gray-500 text-center max-w-md">
            Looks like you haven't added anything to your cart yet. Browse our recommendations to find something you'll love.
          </p>
          <button
            onClick={onContinueShopping}
            className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all"
          >
            <ArrowRight className="w-4 h-4" />
            Continue Shopping
          </button>
        </div>
      </main>
    );
  }

  if (orderPlaced) {
    return (
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-12 font-sans bg-white">
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Order Placed Successfully!</h2>
          <p className="text-sm text-gray-500 text-center max-w-md">
            Thank you for shopping with ALGUD AI. Your order has been confirmed and will be shipped soon.
          </p>
          <button
            onClick={onContinueShopping}
            className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all"
          >
            <ArrowRight className="w-4 h-4" />
            Continue Shopping
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 font-sans bg-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-xs text-gray-500 mt-1">
            {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        <button
          onClick={onContinueShopping}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-red-600 hover:text-red-600 rounded-lg text-xs font-semibold transition-all"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Continue Shopping
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map(({ product, quantity }) => (
            <div
              key={product.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 hover:border-gray-300 transition-colors"
            >
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">
                    {product.brand}
                  </p>
                  <h3 className="font-bold text-sm text-gray-900 line-clamp-1">
                    {product.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {Object.values(product.attributes).join(' · ')}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                      <button
                        onClick={() => onUpdateQuantity(product.id, -1)}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold text-gray-900 w-6 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(product.id, 1)}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => onRemove(product.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-bold text-gray-900">
                      ₹{(product.price * quantity).toFixed(2)}
                    </p>
                    {quantity > 1 && (
                      <p className="text-[11px] text-gray-400">
                        ₹{product.price.toFixed(2)} each
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-24">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal ({totalItems} items)</span>
                <span className="text-gray-900 font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span className="text-green-700 font-medium">Free</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Tax (8%)</span>
                <span className="text-gray-900 font-medium">
                  ₹{(subtotal * 0.08).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 mt-4 pt-4">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  ₹{(subtotal * 1.08).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full mt-5 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-all"
            >
              {isCheckingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  Proceed to Checkout
                </>
              )}
            </button>

            <p className="text-[11px] text-gray-400 text-center mt-3">
              Secure checkout powered by ALGUD AI
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

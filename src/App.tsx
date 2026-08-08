import React, { useState } from 'react';
import { Header } from './components/common/Header';
import { Storefront } from './pages/Storefront';
import { StudioDashboard } from './pages/StudioDashboard';
import { CartPage } from './pages/CartPage';
import { RecommendedPage } from './pages/RecommendedPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { VisualSearchModal } from './components/storefront/VisualSearchModal';
import { AIShoppingAssistant } from './components/storefront/AIShoppingAssistant';
import { DPDPConsentBanner } from './components/common/DPDPConsentBanner';
import { AuthModal } from './components/common/AuthModal';
import { Product } from './types/product';
import { getStoredUser, setStoredUser, getAuthToken, setAuthToken } from './services/api';

interface User {
  name: string;
  email: string;
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'storefront' | 'recommended' | 'categories' | 'cart' | 'studio'>('storefront');
  const [cart, setCart] = useState<Record<string, { product: Product; quantity: number }>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [privacyPanelOpen, setPrivacyPanelOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [sessionId] = useState(() => `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
  const [user, setUser] = useState<User | null>(() => {
    const stored = getStoredUser();
    return stored ? { name: stored.name, email: stored.email } : null;
  });
  
  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (product: Product) => {
    setCart(prev => ({
      ...prev,
      [product.id]: {
        product,
        quantity: (prev[product.id]?.quantity || 0) + 1
      }
    }));
  };

  const handleAddBundleToCart = (items: Product[]) => {
    setCart(prev => {
      const next = { ...prev };
      for (const item of items) {
        next[item.id] = {
          product: item,
          quantity: (next[item.id]?.quantity || 0) + 1
        };
      }
      return next;
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const current = prev[productId];
      if (!current) return prev;
      const newQuantity = current.quantity + delta;
      if (newQuantity <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return {
        ...prev,
        [productId]: { ...current, quantity: newQuantity }
      };
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && activeTab !== 'storefront') {
      setActiveTab('storefront');
    }
  };

  const handleConsentUpdate = (hasConsent: boolean) => {
    console.log(`Consent ${hasConsent ? 'granted' : 'withdrawn'} for session ${sessionId}`);
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setStoredUser({ name: loggedInUser.name, email: loggedInUser.email });
  };

  const handleLogout = () => {
    setAuthToken(null);
    setStoredUser(null);
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartCount}
        openAssistant={() => setAssistantOpen(true)}
        openAuthModal={() => setAuthModalOpen(true)}
        user={user}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearchSubmit={handleSearchSubmit}
      />

      <div className="flex-1">
        {activeTab === 'storefront' ? (
          <Storefront
            cartCount={cartCount}
            onAddToCart={handleAddToCart}
            onAddBundleToCart={handleAddBundleToCart}
            searchQuery={searchQuery}
          />
        ) : activeTab === 'recommended' ? (
          <RecommendedPage
            cartCount={cartCount}
            onAddToCart={handleAddToCart}
            onAddBundleToCart={handleAddBundleToCart}
            searchQuery={searchQuery}
          />
        ) : activeTab === 'categories' ? (
          <CategoriesPage
            cartCount={cartCount}
            onAddToCart={handleAddToCart}
            onAddBundleToCart={handleAddBundleToCart}
            searchQuery={searchQuery}
          />
        ) : activeTab === 'cart' ? (
          <CartPage
            cartItems={cartItems}
            onRemove={handleRemoveFromCart}
            onUpdateQuantity={handleUpdateQuantity}
            onContinueShopping={() => setActiveTab('storefront')}
          />
        ) : (
          <StudioDashboard />
        )}
      </div>

      <VisualSearchModal
        isOpen={false}
        onClose={() => {}}
        onAddToCart={handleAddToCart}
        onSelectCompleteLook={() => {}}
      />

      <AIShoppingAssistant
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        onAddToCart={handleAddToCart}
      />

      <DPDPConsentBanner
        sessionId={sessionId}
        onConsentUpdate={handleConsentUpdate}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
};

export default App;

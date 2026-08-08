import React from 'react';
import { ShoppingBag, LayoutDashboard, Store, Search, Heart, Grid3X3, ShoppingCart, User, LogOut, Bot } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface HeaderProps {
  activeTab: 'storefront' | 'recommended' | 'categories' | 'cart' | 'studio';
  setActiveTab: (tab: 'storefront' | 'recommended' | 'categories' | 'cart' | 'studio') => void;
  cartCount: number;
  openAssistant: () => void;
  openAuthModal?: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
  intentBadgeText?: string;
  user?: { name: string; email: string } | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  openAssistant,
  openAuthModal,
  searchQuery,
  setSearchQuery,
  handleSearchSubmit,
  intentBadgeText,
  user,
  onLogout
}) => {
  const navBtn = (tab: typeof activeTab, label: string, icon: React.ReactNode, activeClass: string = 'bg-red-600 text-white') => (
    <button
      onClick={() => setActiveTab(tab)}
      className={twMerge(
        'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
        activeTab === tab ? activeClass : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <div 
            onClick={() => setActiveTab('storefront')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
              <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-heading font-bold text-xl tracking-tight text-gray-900">ALGUD</span>
                <span className="font-heading font-bold text-xl tracking-tight text-red-600">AI</span>
              </div>
            </div>
          </div>

          {/* Navigation View Mode Switcher */}
          <div className="hidden md:flex items-center gap-1">
            {navBtn('recommended', 'Recommended', <Heart className="w-4 h-4" />)}
            {navBtn('categories', 'Categories', <Grid3X3 className="w-4 h-4" />)}
            {navBtn('studio', 'Enterprise Studio', <LayoutDashboard className="w-4 h-4" />, 'bg-gray-900 text-white')}
          </div>
        </div>

        {/* Search Bar */}
        {['storefront', 'recommended', 'categories'].includes(activeTab) && (
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg hidden sm:block relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              />
            </div>
          </form>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          
          {/* AI Assistant Chat Button */}
          <button
            onClick={openAssistant}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-all"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden lg:inline">AI Assistant</span>
          </button>

          {/* Auth Button */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-semibold text-gray-900">{user.name}</span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-gray-100 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            openAuthModal && (
              <button
                onClick={openAuthModal}
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 hover:border-red-600 hover:text-red-600 rounded-lg text-xs font-semibold transition-all"
              >
                <User className="w-4 h-4" />
                <span className="hidden lg:inline">Log In / Sign Up</span>
              </button>
            )
          )}

          {/* Cart Counter */}
          <div className="relative">
            <button
              onClick={() => setActiveTab('cart')}
              className="p-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-gray-100 transition-colors relative"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};

import React, { useState, useEffect } from 'react';
import { Product } from '../types/product';
import { fetchPersonalizedFeed, searchSemanticText } from '../services/api';
import { ProductCard } from '../components/storefront/ProductCard';
import { Grid3X3, Shirt, Footprints, Cpu, Watch, Home, ChevronRight } from 'lucide-react';

interface CategoryInfo {
  name: string;
  icon: React.ReactNode;
  subcategories: string[];
}

const CATEGORIES: CategoryInfo[] = [
  {
    name: 'Apparel',
    icon: <Shirt className="w-6 h-6" />,
    subcategories: ['Outerwear', 'Formalwear', 'Streetwear', 'Jeans']
  },
  {
    name: 'Footwear',
    icon: <Footprints className="w-6 h-6" />,
    subcategories: ['Boots', 'Sneakers', 'Running']
  },
  {
    name: 'Electronics',
    icon: <Cpu className="w-6 h-6" />,
    subcategories: ['Audio', 'Peripherals', 'Accessories']
  },
  {
    name: 'Accessories',
    icon: <Watch className="w-6 h-6" />,
    subcategories: ['Socks', 'Wearables', 'Eyewear']
  },
  {
    name: 'Home & Living',
    icon: <Home className="w-6 h-6" />,
    subcategories: ['Lighting', 'Bath', 'Decor']
  }
];

export const CategoriesPage: React.FC<{
  cartCount: number;
  onAddToCart: (p: Product) => void;
  onAddBundleToCart: (items: Product[]) => void;
  searchQuery?: string;
}> = ({ cartCount, onAddToCart, onAddBundleToCart, searchQuery }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  const selectedCategoryInfo = CATEGORIES.find(c => c.name === activeCategory);

  useEffect(() => {
    loadCategoryProducts();
  }, [activeCategory, activeSubcategory, searchQuery]);

  useEffect(() => {
    loadProductCounts();
  }, []);

  const loadProductCounts = async () => {
    try {
      const res = await fetchPersonalizedFeed('DISCOVERY', 0.85, []);
      const allProducts = res.recommendation.products;
      const counts: Record<string, number> = { All: allProducts.length };
      
      CATEGORIES.forEach(cat => {
        counts[cat.name] = allProducts.filter(p => p.category === cat.name).length;
        cat.subcategories.forEach(sub => {
          counts[sub] = allProducts.filter(p => p.subcategory === sub).length;
        });
      });
      
      setProductCounts(counts);
    } catch (e) {
      console.error(e);
    }
  };

  const loadCategoryProducts = async () => {
    setLoading(true);
    try {
      if (searchQuery && searchQuery.trim()) {
        const res = await searchSemanticText(searchQuery.trim(), activeCategory === 'All' ? undefined : activeCategory);
        let filtered = res.recommendation.results;
        if (activeSubcategory !== 'All') {
          filtered = filtered.filter(p => p.subcategory === activeSubcategory);
        }
        setProducts(filtered);
      } else if (activeCategory === 'All') {
        const res = await fetchPersonalizedFeed('DISCOVERY', 0.85, []);
        let filtered = res.recommendation.products;
        if (activeSubcategory !== 'All') {
          filtered = filtered.filter(p => p.subcategory === activeSubcategory);
        }
        setProducts(filtered);
      } else {
        const res = await searchSemanticText('', activeCategory);
        let filtered = res.recommendation.results;
        if (activeSubcategory !== 'All') {
          filtered = filtered.filter(p => p.subcategory === activeSubcategory);
        }
        setProducts(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    setActiveCategory(categoryName);
    setActiveSubcategory('All');
  };

  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 font-sans bg-white">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Grid3X3 className="w-5 h-5 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">Browse Categories</h1>
        </div>
        <p className="text-sm text-gray-500">
          Explore products organized by category
        </p>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <button
          onClick={() => handleCategoryClick('All')}
          className={`p-5 rounded-xl border transition-all hover:border-red-600 ${
            activeCategory === 'All'
              ? 'bg-red-600 border-red-600 text-white'
              : 'bg-white border-gray-200 text-gray-900 hover:text-red-600'
          }`}
        >
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${
            activeCategory === 'All' ? 'bg-white/20' : 'bg-gray-100'
          }`}>
            <Grid3X3 className={`w-6 h-6 ${activeCategory === 'All' ? 'text-white' : 'text-gray-600'}`} />
          </div>
          <h3 className="text-sm font-bold mb-1">All Products</h3>
          <p className={`text-xs ${activeCategory === 'All' ? 'text-white/90' : 'text-gray-500'}`}>
            {productCounts['All'] || 0} items
          </p>
        </button>

        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => handleCategoryClick(cat.name)}
            className={`p-5 rounded-xl border transition-all hover:border-red-600 ${
              activeCategory === cat.name
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white border-gray-200 text-gray-900 hover:text-red-600'
            }`}
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${
              activeCategory === cat.name ? 'bg-white/20' : 'bg-gray-100'
            }`}>
              {React.cloneElement(cat.icon as React.ReactElement, {
                className: `w-6 h-6 ${activeCategory === cat.name ? 'text-white' : 'text-gray-600'}`
              })}
            </div>
            <h3 className="text-sm font-bold mb-1">{cat.name}</h3>
            <p className={`text-xs ${activeCategory === cat.name ? 'text-white/90' : 'text-gray-500'}`}>
              {productCounts[cat.name] || 0} items
            </p>
          </button>
        ))}
      </div>

      {/* Subcategory Pills */}
      {selectedCategoryInfo && activeCategory !== 'All' && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs uppercase font-bold text-gray-500 tracking-wider mr-2">
            Subcategories:
          </span>
          <button
            onClick={() => setActiveSubcategory('All')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubcategory === 'All'
                ? 'bg-red-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-red-600 hover:text-red-600'
            }`}
          >
            All
          </button>
          {selectedCategoryInfo.subcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSubcategory(sub)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubcategory === sub
                  ? 'bg-red-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-red-600 hover:text-red-600'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-xs">
        <button
          onClick={() => setActiveCategory('All')}
          className="text-gray-500 hover:text-red-600 transition-colors"
        >
          Categories
        </button>
        {activeCategory !== 'All' && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-gray-900 font-semibold">{activeCategory}</span>
          </>
        )}
        {activeSubcategory !== 'All' && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-gray-700 font-semibold">{activeSubcategory}</span>
          </>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-red-600">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin" />
          <p className="text-xs text-gray-500">Loading category products...</p>
        </div>
      ) : (
        <>
          {/* Results Count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-900">{products.length}</span> products
              {activeCategory !== 'All' && (
                <> in <span className="font-bold text-red-600">{activeCategory}</span></>
              )}
              {activeSubcategory !== 'All' && (
                <> · <span className="font-bold text-gray-700">{activeSubcategory}</span></>
              )}
            </p>
          </div>

          {/* Products Grid */}
          {products.length > 0 ? (
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
          ) : (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Grid3X3 className="w-12 h-12 text-gray-300" />
              <p className="text-sm font-medium text-gray-900">No products found in this category</p>
              <button
                onClick={() => {
                  setActiveCategory('All');
                  setActiveSubcategory('All');
                }}
                className="text-red-600 hover:text-red-700 text-xs font-semibold"
              >
                Browse all products
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
};

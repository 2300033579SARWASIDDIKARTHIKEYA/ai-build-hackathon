export interface Product {
  id: string;
  title: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  original_price: number;
  rating: number;
  reviews_count: number;
  inventory: number;
  image: string;
  tags: string[];
  attributes: Record<string, string>;
  popularity_score: number;
  margin_score: number;
  vector_score?: number;
  two_tower_score?: number;
  rerank_score?: number;
}

export interface OutfitLook {
  look_id: string;
  title: string;
  style_persona: string;
  discount_percentage: number;
  original_total: number;
  bundle_price: number;
  items: Product[];
}

export interface BundleOffer {
  main_item: Product;
  frequently_bought_items: Product[];
  bundle_discount_pct: number;
  bundle_price: number;
  savings: number;
}

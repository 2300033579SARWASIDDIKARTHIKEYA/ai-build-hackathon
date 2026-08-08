export interface AgentResponse<T = any> {
  agent_name: string;
  confidence_score: number;
  reasoning: string;
  recommendation: T;
  business_explanation: string;
  latency_ms: number;
}

export interface UserIntentPayload {
  intent_type: string;
  urgency: string;
  dominant_category: string;
  intent_score: number;
  detected_keywords?: string[];
  target_price_range: [number, number];
}

export interface ClickstreamEvent {
  event_type: 'view' | 'click' | 'cart' | 'wishlist' | 'search';
  product_id?: string;
  category?: string;
  tags?: string[];
  query?: string;
  time_spent_sec?: number;
  timestamp?: number;
}

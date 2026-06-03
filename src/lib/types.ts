export type ChatRole = 'user' | 'assistant' | 'system';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  rating?: number;
  tags?: string[];
  scenes?: string[];
}

export type OrderStatus =
  | 'pending_payment'
  | 'processing'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderTrackingEvent {
  label: string;
  detail: string;
  time: string;
}

export interface Order {
  id: string;
  orderNo: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  recipient: string;
  address: string;
  merchant: string;
  carrier?: string;
  trackingNo?: string;
  eta?: string;
  keywords: string[];
  trackingEvents: OrderTrackingEvent[];
}

export interface OrderQueryFilters {
  statuses?: OrderStatus[];
  keyword?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export type AssistantIntent = 'order_query' | 'product_recommendation' | 'other';

export type AgentStepStatus = 'completed' | 'requires_input';

export interface AgentStep {
  id: string;
  title: string;
  detail: string;
  status: AgentStepStatus;
}

export interface ShoeProfile {
  size?: string;
  walkingAmount?: 'low' | 'medium' | 'high';
  scene?: string;
  requirements?: string[];
}

export interface AgentMetadata {
  pendingShoeClarification?: boolean;
  shoeProfile?: ShoeProfile;
  lastRecommendedProductIds?: string[];
  lastInterestCategory?: string;
  lastUserGoal?: string;
}

export interface ChatResponse {
  intent: AssistantIntent;
  reply: string;
  products: Product[];
  orders: Order[];
  steps: AgentStep[];
  metadata?: AgentMetadata;
}

export interface ChatMessageInput {
  role: ChatRole;
  content: string;
  products?: Product[];
  orders?: Order[];
  steps?: AgentStep[];
  metadata?: AgentMetadata;
}

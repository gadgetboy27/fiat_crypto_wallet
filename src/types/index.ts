export interface CryptoPrice {
  symbol: string;
  name: string;
  priceUSD: number;
  priceChange24h: number;
  lastUpdated: Date;
}

export interface OrderRequest {
  cryptoSymbol: string;
  amountUSD: number;
  customerEmail: string;
  walletAddress: string;
  paymentMethod?: 'card' | 'bank_transfer';
}

export interface Order {
  id: string;
  cryptoSymbol: string;
  cryptoAmount: number;
  fiatAmount: number;
  priceAtPurchase: number;
  platformFee: number;
  totalCharged: number;
  customerEmail: string;
  walletAddress: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  stripePaymentIntentId?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface PriceQuote {
  cryptoSymbol: string;
  amountUSD: number;
  cryptoAmount: number;
  currentPrice: number;
  platformFee: number;
  totalCharge: number;
  expiresAt: Date;
}

export interface WebhookEvent {
  type: string;
  data: any;
  timestamp: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SupportedCrypto {
  symbol: string;
  name: string;
  network: string;
  minPurchase: number;
  maxPurchase: number;
  enabled: boolean;
}

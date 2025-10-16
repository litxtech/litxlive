export interface Transaction {
  id: string;
  userId: string;
  type: 'purchase' | 'gift_sent' | 'gift_received' | 'call_charge' | 'refund' | 'bonus';
  amount: number;
  currency: string;
  coins?: number;
  aiCredits?: number;
  packageId?: string;
  productId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: 'google_play' | 'apple_pay' | 'stripe' | 'paypal';
  receiptData?: string;
  orderId?: string;
  transactionId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface PurchaseRequest {
  packageId: string;
  currency?: string;
  paymentMethod: 'google_play' | 'stripe' | 'paypal';
  receiptData?: string;
}

export interface PurchaseResponse {
  success: boolean;
  transaction?: Transaction;
  coins?: number;
  aiCredits?: number;
  message?: string;
  error?: string;
}

export interface ReceiptValidationRequest {
  receiptData: string;
  productId: string;
  platform: 'android' | 'ios';
}

export interface ReceiptValidationResponse {
  valid: boolean;
  productId?: string;
  transactionId?: string;
  purchaseDate?: string;
  error?: string;
}

export interface TransactionHistory {
  transactions: Transaction[];
  totalSpent: number;
  totalEarned: number;
  totalCoins: number;
  totalAiCredits: number;
}

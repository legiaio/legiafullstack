export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description: string;
  redirectUrl?: string;
  callbackUrl?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  paymentUrl?: string;
  qrCode?: string;
  virtualAccount?: string;
  expiryTime?: Date;
  message?: string;
  error?: string;
}

export interface PaymentStatus {
  paymentId: string;
  orderId: string;
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled';
  amount: number;
  paidAmount?: number;
  paymentMethod?: string;
  transactionTime?: Date;
  settlementTime?: Date;
  message?: string;
}

export interface PaymentMethod {
  code: string;
  name: string;
  type: 'bank_transfer' | 'e_wallet' | 'retail' | 'qris' | 'credit_card';
  fee: number;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
}

export interface WebhookPayload {
  gateway: 'midtrans' | 'xendit' | 'tripay';
  orderId: string;
  paymentId: string;
  status: string;
  amount: number;
  paidAmount?: number;
  paymentMethod?: string;
  transactionTime?: string;
  signature?: string;
  rawData: any;
}

export abstract class PaymentGateway {
  abstract createPayment(request: PaymentRequest): Promise<PaymentResponse>;
  abstract getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  abstract getPaymentMethods(): Promise<PaymentMethod[]>;
  abstract verifyWebhook(payload: any, signature?: string): Promise<WebhookPayload>;
  abstract cancelPayment(paymentId: string): Promise<boolean>;
}
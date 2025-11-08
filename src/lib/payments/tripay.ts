import axios from 'axios';
import crypto from 'crypto';
import { PaymentGateway, PaymentRequest, PaymentResponse, PaymentStatus, PaymentMethod, WebhookPayload } from './types';

export class TripayPayment extends PaymentGateway {
  private apiKey: string;
  private privateKey: string;
  private merchantCode: string;
  private baseUrl: string;

  constructor() {
    super();
    this.apiKey = process.env.TRIPAY_API_KEY!;
    this.privateKey = process.env.TRIPAY_PRIVATE_KEY!;
    this.merchantCode = process.env.TRIPAY_MERCHANT_CODE!;
    
    const isProduction = process.env.TRIPAY_IS_PRODUCTION === 'true';
    this.baseUrl = isProduction 
      ? 'https://tripay.co.id/api' 
      : 'https://tripay.co.id/api-sandbox';
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Get available payment methods first
      const methods = await this.getPaymentMethods();
      const defaultMethod = methods.find(m => m.isActive) || methods[0];

      if (!defaultMethod) {
        throw new Error('No payment methods available');
      }

      const data = {
        method: defaultMethod.code,
        merchant_ref: request.orderId,
        amount: request.amount,
        customer_name: request.customerName,
        customer_email: request.customerEmail,
        customer_phone: request.customerPhone || '',
        order_items: [
          {
            sku: request.orderId,
            name: request.description,
            price: request.amount,
            quantity: 1,
          },
        ],
        return_url: request.redirectUrl,
        expired_time: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        signature: this.generateSignature(request.orderId, request.amount),
      };

      const response = await axios.post(`${this.baseUrl}/transaction/create`, data, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create payment');
      }

      const transaction = response.data.data;

      return {
        success: true,
        paymentId: transaction.reference,
        paymentUrl: transaction.checkout_url,
        qrCode: transaction.qr_url,
        virtualAccount: transaction.pay_code,
        expiryTime: new Date(transaction.expired_time * 1000),
        message: 'Payment created successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        paymentId: '',
        error: error.response?.data?.message || error.message || 'Failed to create payment',
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const response = await axios.get(`${this.baseUrl}/transaction/detail`, {
        params: { reference: paymentId },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get payment status');
      }

      const transaction = response.data.data;
      const status = this.mapTripayStatus(transaction.status);

      return {
        paymentId: transaction.reference,
        orderId: transaction.merchant_ref,
        status,
        amount: transaction.amount,
        paidAmount: status === 'paid' ? transaction.amount_received : undefined,
        paymentMethod: transaction.payment_method,
        transactionTime: new Date(transaction.created_at),
        settlementTime: transaction.paid_at ? new Date(transaction.paid_at) : undefined,
        message: transaction.payment_name,
      };
    } catch (error: any) {
      throw new Error(`Failed to get payment status: ${error.response?.data?.message || error.message}`);
    }
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/merchant/payment-channel`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.data.success) {
        throw new Error('Failed to get payment methods');
      }

      return response.data.data.map((method: any) => ({
        code: method.code,
        name: method.name,
        type: this.mapTripayMethodType(method.group),
        fee: method.total_fee?.flat || 0,
        minAmount: method.minimum_fee || 1000,
        maxAmount: method.maximum_fee || 500000000,
        isActive: method.active,
      }));
    } catch (error) {
      // Return default payment methods if API fails
      return [
        {
          code: 'BRIVA',
          name: 'BRI Virtual Account',
          type: 'bank_transfer',
          fee: 4000,
          minAmount: 10000,
          maxAmount: 500000000,
          isActive: true,
        },
        {
          code: 'BCAVA',
          name: 'BCA Virtual Account',
          type: 'bank_transfer',
          fee: 4000,
          minAmount: 10000,
          maxAmount: 500000000,
          isActive: true,
        },
        {
          code: 'BNIVA',
          name: 'BNI Virtual Account',
          type: 'bank_transfer',
          fee: 4000,
          minAmount: 10000,
          maxAmount: 500000000,
          isActive: true,
        },
        {
          code: 'MANDIRIVA',
          name: 'Mandiri Virtual Account',
          type: 'bank_transfer',
          fee: 4000,
          minAmount: 10000,
          maxAmount: 500000000,
          isActive: true,
        },
        {
          code: 'OVO',
          name: 'OVO',
          type: 'e_wallet',
          fee: 0,
          minAmount: 1000,
          maxAmount: 10000000,
          isActive: true,
        },
        {
          code: 'DANA',
          name: 'DANA',
          type: 'e_wallet',
          fee: 0,
          minAmount: 1000,
          maxAmount: 10000000,
          isActive: true,
        },
        {
          code: 'SHOPEEPAY',
          name: 'ShopeePay',
          type: 'e_wallet',
          fee: 0,
          minAmount: 1000,
          maxAmount: 10000000,
          isActive: true,
        },
        {
          code: 'QRIS',
          name: 'QRIS',
          type: 'qris',
          fee: 0,
          minAmount: 1000,
          maxAmount: 20000000,
          isActive: true,
        },
      ];
    }
  }

  async verifyWebhook(payload: any, signature?: string): Promise<WebhookPayload> {
    try {
      // Verify webhook signature
      const callbackSignature = signature || payload.signature;
      const computedSignature = crypto
        .createHmac('sha256', this.privateKey)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (computedSignature !== callbackSignature) {
        throw new Error('Invalid webhook signature');
      }

      return {
        gateway: 'tripay',
        orderId: payload.merchant_ref,
        paymentId: payload.reference,
        status: this.mapTripayStatus(payload.status),
        amount: payload.amount,
        paidAmount: payload.amount_received,
        paymentMethod: payload.payment_method,
        transactionTime: payload.created_at,
        signature: callbackSignature,
        rawData: payload,
      };
    } catch (error: any) {
      throw new Error(`Webhook verification failed: ${error.message}`);
    }
  }

  async cancelPayment(paymentId: string): Promise<boolean> {
    try {
      // Tripay doesn't have direct cancel API, but we can check if it's still pending
      const status = await this.getPaymentStatus(paymentId);
      return status.status === 'pending';
    } catch (error) {
      return false;
    }
  }

  private generateSignature(orderId: string, amount: number): string {
    const payload = `${this.merchantCode}${orderId}${amount}`;
    return crypto
      .createHmac('sha256', this.privateKey)
      .update(payload)
      .digest('hex');
  }

  private mapTripayStatus(status: string): 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled' {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'paid';
      case 'unpaid':
        return 'pending';
      case 'failed':
        return 'failed';
      case 'expired':
        return 'expired';
      case 'refund':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  private mapTripayMethodType(group: string): 'bank_transfer' | 'e_wallet' | 'retail' | 'qris' | 'credit_card' {
    switch (group.toLowerCase()) {
      case 'virtual account':
        return 'bank_transfer';
      case 'e-wallet':
        return 'e_wallet';
      case 'convenience store':
        return 'retail';
      case 'qris':
        return 'qris';
      case 'credit card':
        return 'credit_card';
      default:
        return 'bank_transfer';
    }
  }
}
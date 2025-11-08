import { CoreApi, Snap } from 'midtrans-client';
import { PaymentGateway, PaymentRequest, PaymentResponse, PaymentStatus, PaymentMethod, WebhookPayload } from './types';
import crypto from 'crypto';

export class MidtransPayment extends PaymentGateway {
  private snap: Snap;
  private coreApi: CoreApi;
  private serverKey: string;

  constructor() {
    super();
    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const clientKey = process.env.MIDTRANS_CLIENT_KEY!;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

    this.serverKey = serverKey;
    
    this.snap = new Snap({
      isProduction,
      serverKey,
      clientKey,
    });

    this.coreApi = new CoreApi({
      isProduction,
      serverKey,
      clientKey,
    });
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const parameter = {
        transaction_details: {
          order_id: request.orderId,
          gross_amount: request.amount,
        },
        customer_details: {
          first_name: request.customerName,
          email: request.customerEmail,
          phone: request.customerPhone,
        },
        item_details: [
          {
            id: request.orderId,
            price: request.amount,
            quantity: 1,
            name: request.description,
          },
        ],
        callbacks: {
          finish: request.redirectUrl,
        },
      };

      const transaction = await this.snap.createTransaction(parameter);
      
      return {
        success: true,
        paymentId: request.orderId,
        paymentUrl: transaction.redirect_url,
        message: 'Payment created successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        paymentId: '',
        error: error.message || 'Failed to create payment',
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const statusResponse = await (this.coreApi as any).transaction.status(paymentId);
      
      const status = this.mapMidtransStatus(statusResponse.transaction_status);
      
      return {
        paymentId,
        orderId: statusResponse.order_id,
        status,
        amount: parseFloat(statusResponse.gross_amount),
        paidAmount: status === 'paid' ? parseFloat(statusResponse.gross_amount) : undefined,
        paymentMethod: statusResponse.payment_type,
        transactionTime: statusResponse.transaction_time ? new Date(statusResponse.transaction_time) : undefined,
        settlementTime: statusResponse.settlement_time ? new Date(statusResponse.settlement_time) : undefined,
        message: statusResponse.status_message,
      };
    } catch (error: any) {
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    // Midtrans payment methods (static list as they don't provide dynamic API)
    return [
      {
        code: 'credit_card',
        name: 'Credit Card',
        type: 'credit_card',
        fee: 0,
        minAmount: 10000,
        maxAmount: 500000000,
        isActive: true,
      },
      {
        code: 'bank_transfer',
        name: 'Bank Transfer',
        type: 'bank_transfer',
        fee: 4000,
        minAmount: 10000,
        maxAmount: 500000000,
        isActive: true,
      },
      {
        code: 'gopay',
        name: 'GoPay',
        type: 'e_wallet',
        fee: 0,
        minAmount: 1000,
        maxAmount: 20000000,
        isActive: true,
      },
      {
        code: 'shopeepay',
        name: 'ShopeePay',
        type: 'e_wallet',
        fee: 0,
        minAmount: 1000,
        maxAmount: 20000000,
        isActive: true,
      },
      {
        code: 'qris',
        name: 'QRIS',
        type: 'qris',
        fee: 0,
        minAmount: 1000,
        maxAmount: 20000000,
        isActive: true,
      },
    ];
  }

  async verifyWebhook(payload: any, signature?: string): Promise<WebhookPayload> {
    try {
      // Verify signature
      const orderId = payload.order_id;
      const statusCode = payload.status_code;
      const grossAmount = payload.gross_amount;
      const serverKey = this.serverKey;
      
      const hash = crypto
        .createHash('sha512')
        .update(orderId + statusCode + grossAmount + serverKey)
        .digest('hex');
      
      if (hash !== payload.signature_key) {
        throw new Error('Invalid signature');
      }

      return {
        gateway: 'midtrans',
        orderId: payload.order_id,
        paymentId: payload.transaction_id,
        status: this.mapMidtransStatus(payload.transaction_status),
        amount: parseFloat(payload.gross_amount),
        paidAmount: payload.transaction_status === 'settlement' ? parseFloat(payload.gross_amount) : undefined,
        paymentMethod: payload.payment_type,
        transactionTime: payload.transaction_time,
        signature: payload.signature_key,
        rawData: payload,
      };
    } catch (error: any) {
      throw new Error(`Webhook verification failed: ${error.message}`);
    }
  }

  async cancelPayment(paymentId: string): Promise<boolean> {
    try {
      await (this.coreApi as any).transaction.cancel(paymentId);
      return true;
    } catch (error) {
      return false;
    }
  }

  private mapMidtransStatus(status: string): 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled' {
    switch (status) {
      case 'capture':
      case 'settlement':
        return 'paid';
      case 'pending':
        return 'pending';
      case 'deny':
      case 'failure':
        return 'failed';
      case 'cancel':
        return 'cancelled';
      case 'expire':
        return 'expired';
      default:
        return 'pending';
    }
  }
}
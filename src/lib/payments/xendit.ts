import { Xendit } from 'xendit-node';
import { PaymentGateway, PaymentRequest, PaymentResponse, PaymentStatus, PaymentMethod, WebhookPayload } from './types';
import crypto from 'crypto';

export class XenditPayment extends PaymentGateway {
  private xendit: Xendit;
  private webhookToken: string;

  constructor() {
    super();
    const secretKey = process.env.XENDIT_SECRET_KEY!;
    this.webhookToken = process.env.XENDIT_WEBHOOK_TOKEN!;
    
    this.xendit = new Xendit({
      secretKey,
    });
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Create invoice for flexible payment methods
      const invoice = await this.xendit.Invoice.createInvoice({
        external_id: request.orderId,
        amount: request.amount,
        description: request.description,
        invoice_duration: 86400, // 24 hours
        customer: {
          given_names: request.customerName,
          email: request.customerEmail,
          mobile_number: request.customerPhone,
        },
        success_redirect_url: request.redirectUrl,
        failure_redirect_url: request.redirectUrl,
        currency: 'IDR',
        items: [
          {
            name: request.description,
            quantity: 1,
            price: request.amount,
          },
        ],
      } as any);

      return {
        success: true,
        paymentId: invoice.id || '',
        paymentUrl: invoice.invoiceUrl || '',
        expiryTime: new Date(invoice.expiryDate || Date.now() + 86400000),
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
      const invoice = await (this.xendit.Invoice as any).getInvoice({
        invoiceId: paymentId,
      });

      const status = this.mapXenditStatus(invoice.status);

      return {
        paymentId: invoice.id,
        orderId: invoice.externalId,
        status,
        amount: invoice.amount,
        paidAmount: status === 'paid' ? invoice.paidAmount : undefined,
        paymentMethod: invoice.paymentMethod,
        transactionTime: invoice.created ? new Date(invoice.created) : undefined,
        settlementTime: invoice.paidAt ? new Date(invoice.paidAt) : undefined,
        message: invoice.description,
      };
    } catch (error: any) {
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      // Get available payment methods from Xendit
      const paymentMethods = await this.xendit.PaymentMethod.getAllPaymentMethods({
        type: ['BANK', 'EWALLET', 'QR_CODE', 'VIRTUAL_ACCOUNT'],
      } as any);

      return (paymentMethods as any).data?.map((method: any) => ({
        code: method.id,
        name: method.name,
        type: this.mapXenditMethodType(method.type),
        fee: method.adminFee || 0,
        minAmount: method.minimumAmount || 1000,
        maxAmount: method.maximumAmount || 500000000,
        isActive: method.isActivated,
      })) || [];
    } catch (error) {
      // Return default payment methods if API fails
      return [
        {
          code: 'BCA',
          name: 'BCA Virtual Account',
          type: 'bank_transfer',
          fee: 4000,
          minAmount: 10000,
          maxAmount: 500000000,
          isActive: true,
        },
        {
          code: 'BNI',
          name: 'BNI Virtual Account',
          type: 'bank_transfer',
          fee: 4000,
          minAmount: 10000,
          maxAmount: 500000000,
          isActive: true,
        },
        {
          code: 'BRI',
          name: 'BRI Virtual Account',
          type: 'bank_transfer',
          fee: 4000,
          minAmount: 10000,
          maxAmount: 500000000,
          isActive: true,
        },
        {
          code: 'MANDIRI',
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
          code: 'LINKAJA',
          name: 'LinkAja',
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
      if (signature) {
        const computedSignature = crypto
          .createHmac('sha256', this.webhookToken)
          .update(JSON.stringify(payload))
          .digest('hex');

        if (computedSignature !== signature) {
          throw new Error('Invalid webhook signature');
        }
      }

      return {
        gateway: 'xendit',
        orderId: payload.external_id,
        paymentId: payload.id,
        status: this.mapXenditStatus(payload.status),
        amount: payload.amount,
        paidAmount: payload.paid_amount,
        paymentMethod: payload.payment_method,
        transactionTime: payload.created,
        signature,
        rawData: payload,
      };
    } catch (error: any) {
      throw new Error(`Webhook verification failed: ${error.message}`);
    }
  }

  async cancelPayment(paymentId: string): Promise<boolean> {
    try {
      await this.xendit.Invoice.expireInvoice({
        invoiceId: paymentId,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  private mapXenditStatus(status: string): 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled' {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'settled':
        return 'paid';
      case 'pending':
        return 'pending';
      case 'failed':
        return 'failed';
      case 'expired':
        return 'expired';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  private mapXenditMethodType(type: string): 'bank_transfer' | 'e_wallet' | 'retail' | 'qris' | 'credit_card' {
    switch (type.toLowerCase()) {
      case 'bank':
      case 'virtual_account':
        return 'bank_transfer';
      case 'ewallet':
        return 'e_wallet';
      case 'qr_code':
        return 'qris';
      case 'credit_card':
        return 'credit_card';
      default:
        return 'bank_transfer';
    }
  }
}
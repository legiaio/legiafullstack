import { MidtransPayment } from './midtrans';
import { XenditPayment } from './xendit';
import { TripayPayment } from './tripay';
import { PaymentGateway, PaymentRequest, PaymentResponse, PaymentStatus, PaymentMethod, WebhookPayload } from './types';

export type PaymentGatewayType = 'midtrans' | 'xendit' | 'tripay';

export class PaymentService {
  private gateways: Map<PaymentGatewayType, PaymentGateway>;

  constructor() {
    this.gateways = new Map();
    this.gateways.set('midtrans', new MidtransPayment());
    this.gateways.set('xendit', new XenditPayment());
    this.gateways.set('tripay', new TripayPayment());
  }

  private getGateway(gateway: PaymentGatewayType): PaymentGateway {
    const gatewayInstance = this.gateways.get(gateway);
    if (!gatewayInstance) {
      throw new Error(`Payment gateway ${gateway} not found`);
    }
    return gatewayInstance;
  }

  async createPayment(gateway: PaymentGatewayType, request: PaymentRequest): Promise<PaymentResponse> {
    const gatewayInstance = this.getGateway(gateway);
    return await gatewayInstance.createPayment(request);
  }

  async getPaymentStatus(gateway: PaymentGatewayType, paymentId: string): Promise<PaymentStatus> {
    const gatewayInstance = this.getGateway(gateway);
    return await gatewayInstance.getPaymentStatus(paymentId);
  }

  async getPaymentMethods(gateway: PaymentGatewayType): Promise<PaymentMethod[]> {
    const gatewayInstance = this.getGateway(gateway);
    return await gatewayInstance.getPaymentMethods();
  }

  async getAllPaymentMethods(): Promise<{ gateway: PaymentGatewayType; methods: PaymentMethod[] }[]> {
    const results = await Promise.allSettled([
      this.getPaymentMethods('midtrans').then(methods => ({ gateway: 'midtrans' as const, methods })),
      this.getPaymentMethods('xendit').then(methods => ({ gateway: 'xendit' as const, methods })),
      this.getPaymentMethods('tripay').then(methods => ({ gateway: 'tripay' as const, methods })),
    ]);

    return results
      .filter((result): result is PromiseFulfilledResult<any> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  async verifyWebhook(gateway: PaymentGatewayType, payload: any, signature?: string): Promise<WebhookPayload> {
    const gatewayInstance = this.getGateway(gateway);
    return await gatewayInstance.verifyWebhook(payload, signature);
  }

  async cancelPayment(gateway: PaymentGatewayType, paymentId: string): Promise<boolean> {
    const gatewayInstance = this.getGateway(gateway);
    return await gatewayInstance.cancelPayment(paymentId);
  }

  // Utility method to get the best gateway for a specific amount
  getBestGateway(amount: number): PaymentGatewayType {
    // Simple logic: use Midtrans for larger amounts, Xendit for medium, Tripay for smaller
    if (amount >= 1000000) { // >= 1M IDR
      return 'midtrans';
    } else if (amount >= 100000) { // >= 100K IDR
      return 'xendit';
    } else {
      return 'tripay';
    }
  }

  // Utility method to get gateway by payment method code
  getGatewayByMethod(methodCode: string): PaymentGatewayType {
    // Map common method codes to gateways
    const midtransMethods = ['credit_card', 'bank_transfer', 'gopay', 'shopeepay', 'qris'];
    const xenditMethods = ['BCA', 'BNI', 'BRI', 'MANDIRI', 'OVO', 'DANA', 'LINKAJA'];
    const tripayMethods = ['BRIVA', 'BCAVA', 'BNIVA', 'MANDIRIVA'];

    if (midtransMethods.includes(methodCode)) {
      return 'midtrans';
    } else if (xenditMethods.includes(methodCode)) {
      return 'xendit';
    } else if (tripayMethods.includes(methodCode)) {
      return 'tripay';
    }

    // Default to midtrans
    return 'midtrans';
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

// Export types
export * from './types';
export { MidtransPayment } from './midtrans';
export { XenditPayment } from './xendit';
export { TripayPayment } from './tripay';
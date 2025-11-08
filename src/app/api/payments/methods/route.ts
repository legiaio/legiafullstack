import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/payments';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gateway = searchParams.get('gateway') as 'midtrans' | 'xendit' | 'tripay' | null;

    if (gateway) {
      // Get methods for specific gateway
      const methods = await paymentService.getPaymentMethods(gateway);
      return NextResponse.json({
        success: true,
        gateway,
        methods,
      });
    } else {
      // Get methods from all gateways
      const allMethods = await paymentService.getAllPaymentMethods();
      return NextResponse.json({
        success: true,
        gateways: allMethods,
      });
    }
  } catch (error) {
    console.error('Payment methods error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}
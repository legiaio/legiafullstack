import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/payments';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const signature = request.headers.get('x-callback-token');
    
    // Verify webhook with Xendit
    const webhookData = await paymentService.verifyWebhook('xendit', payload, signature || undefined);
    
    // Find payment in database
    const payment = await prisma.payment.findUnique({
      where: { id: webhookData.paymentId },
      include: { order: true },
    });

    if (!payment) {
      console.error('Payment not found:', webhookData.paymentId);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: webhookData.paymentId },
      data: {
        status: webhookData.status.toUpperCase() as any,
        paidAmount: webhookData.paidAmount,
        paymentMethod: webhookData.paymentMethod,
        transactionTime: webhookData.transactionTime ? new Date(webhookData.transactionTime) : undefined,
      },
    });

    // Update order status if payment is successful
    if (webhookData.status === 'paid' && payment.order.status !== 'PAID') {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { 
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      // TODO: Trigger order fulfillment process
      console.log(`Order ${payment.orderId} has been paid via Xendit`);
    }

    // Log webhook for audit
    await prisma.webhookLog.create({
      data: {
        gateway: 'XENDIT',
        paymentId: webhookData.paymentId,
        orderId: webhookData.orderId,
        status: webhookData.status,
        payload: JSON.stringify(webhookData.rawData),
        signature: webhookData.signature,
        processed: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Xendit webhook error:', error);
    
    // Log failed webhook
    try {
      const payload = await request.json();
      await prisma.webhookLog.create({
        data: {
          gateway: 'XENDIT',
          paymentId: payload.id || 'unknown',
          orderId: payload.external_id || 'unknown',
          status: 'error',
          payload: JSON.stringify(payload),
          signature: request.headers.get('x-callback-token'),
          processed: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
    }

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
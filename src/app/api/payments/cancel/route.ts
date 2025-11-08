import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { paymentService } from '@/lib/payments';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId, reason } = await request.json();

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    // Find payment and verify ownership
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { 
        order: {
          include: { user: true }
        }
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check if user owns this payment
    if (payment.order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if payment can be cancelled
    if (!['PENDING', 'AWAITING_PAYMENT'].includes(payment.status)) {
      return NextResponse.json(
        { error: 'Payment cannot be cancelled in current status' },
        { status: 400 }
      );
    }

    // Cancel payment with gateway
    const cancelResult = await paymentService.cancelPayment(
      payment.gateway.toLowerCase() as any,
      paymentId
    );

    // Update payment status in database
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'CANCELLED',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        gateway: updatedPayment.gateway,
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        cancelledAt: updatedPayment.updatedAt,
      },
      gatewayResponse: cancelResult,
    });
  } catch (error) {
    console.error('Payment cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel payment' },
      { status: 500 }
    );
  }
}
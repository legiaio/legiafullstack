import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { paymentService } from '@/lib/payments';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    // Get payment from database
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        order: {
          userId: session.user.id,
        },
      },
      include: {
        order: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Get status from payment gateway
    try {
      const gatewayStatus = await paymentService.getPaymentStatus(
        payment.gateway as any,
        paymentId
      );

      // Update payment status in database if different
      if (gatewayStatus.status !== payment.status.toLowerCase()) {
        const updatedPayment = await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: gatewayStatus.status.toUpperCase() as any,
            paidAmount: gatewayStatus.paidAmount,
            paymentMethod: gatewayStatus.paymentMethod,
            transactionTime: gatewayStatus.transactionTime,
            settlementTime: gatewayStatus.settlementTime,
          },
        });

        // Update order status if payment is successful
        if (gatewayStatus.status === 'paid' && payment.order.status !== 'PAID') {
          await prisma.order.update({
            where: { id: payment.orderId },
            data: { status: 'PAID' },
          });
        }

        return NextResponse.json({
          success: true,
          payment: {
            id: updatedPayment.id,
            orderId: updatedPayment.orderId,
            gateway: updatedPayment.gateway,
            amount: updatedPayment.amount,
            paidAmount: updatedPayment.paidAmount,
            currency: updatedPayment.currency,
            status: updatedPayment.status,
            paymentMethod: updatedPayment.paymentMethod,
            paymentUrl: updatedPayment.paymentUrl,
            qrCode: updatedPayment.qrCode,
            virtualAccount: updatedPayment.virtualAccount,
            expiryTime: updatedPayment.expiryTime,
            transactionTime: updatedPayment.transactionTime,
            settlementTime: updatedPayment.settlementTime,
            createdAt: updatedPayment.createdAt,
            updatedAt: updatedPayment.updatedAt,
          },
        });
      }

      // Return current payment data
      return NextResponse.json({
        success: true,
        payment: {
          id: payment.id,
          orderId: payment.orderId,
          gateway: payment.gateway,
          amount: payment.amount,
          paidAmount: payment.paidAmount,
          currency: payment.currency,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          paymentUrl: payment.paymentUrl,
          qrCode: payment.qrCode,
          virtualAccount: payment.virtualAccount,
          expiryTime: payment.expiryTime,
          transactionTime: payment.transactionTime,
          settlementTime: payment.settlementTime,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        },
      });
    } catch (gatewayError) {
      console.error('Gateway status check error:', gatewayError);
      
      // Return database status if gateway check fails
      return NextResponse.json({
        success: true,
        payment: {
          id: payment.id,
          orderId: payment.orderId,
          gateway: payment.gateway,
          amount: payment.amount,
          paidAmount: payment.paidAmount,
          currency: payment.currency,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          paymentUrl: payment.paymentUrl,
          qrCode: payment.qrCode,
          virtualAccount: payment.virtualAccount,
          expiryTime: payment.expiryTime,
          transactionTime: payment.transactionTime,
          settlementTime: payment.settlementTime,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        },
        warning: 'Could not verify status with payment gateway',
      });
    }
  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
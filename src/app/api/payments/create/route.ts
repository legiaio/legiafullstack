import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { paymentService, PaymentGatewayType } from '@/lib/payments';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createPaymentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default('IDR'),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  description: z.string().min(1),
  gateway: z.enum(['midtrans', 'xendit', 'tripay']).optional(),
  paymentMethod: z.string().optional(),
  redirectUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createPaymentSchema.parse(body);

    // Check if order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: validatedData.orderId,
        userId: session.user.id,
      },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json({ error: 'Order is not pending' }, { status: 400 });
    }

    // Determine gateway to use
    let gateway: PaymentGatewayType;
    if (validatedData.gateway) {
      gateway = validatedData.gateway;
    } else if (validatedData.paymentMethod) {
      gateway = paymentService.getGatewayByMethod(validatedData.paymentMethod);
    } else {
      gateway = paymentService.getBestGateway(validatedData.amount);
    }

    // Create payment request
    const paymentRequest = {
      orderId: validatedData.orderId,
      amount: validatedData.amount,
      currency: validatedData.currency,
      customerName: validatedData.customerName,
      customerEmail: validatedData.customerEmail,
      customerPhone: validatedData.customerPhone,
      description: validatedData.description,
      redirectUrl: validatedData.redirectUrl || `${process.env.NEXTAUTH_URL}/orders/${validatedData.orderId}`,
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/payments/webhook/${gateway}`,
    };

    // Create payment with selected gateway
    const paymentResponse = await paymentService.createPayment(gateway, paymentRequest);

    if (!paymentResponse.success) {
      return NextResponse.json(
        { error: paymentResponse.error || 'Failed to create payment' },
        { status: 400 }
      );
    }

    // Save payment record to database
    const payment = await prisma.payment.create({
      data: {
        id: paymentResponse.paymentId,
        orderId: validatedData.orderId,
        gateway: gateway.toUpperCase() as any,
        amount: validatedData.amount,
        currency: validatedData.currency,
        status: 'PENDING',
        paymentUrl: paymentResponse.paymentUrl,
        qrCode: paymentResponse.qrCode,
        virtualAccount: paymentResponse.virtualAccount,
        expiryTime: paymentResponse.expiryTime,
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: validatedData.orderId },
      data: { status: 'AWAITING_PAYMENT' },
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        gateway: payment.gateway,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentUrl: payment.paymentUrl,
        qrCode: payment.qrCode,
        virtualAccount: payment.virtualAccount,
        expiryTime: payment.expiryTime,
      },
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
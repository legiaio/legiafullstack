import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { escrowService } from '@/lib/escrow/service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const escrowId = searchParams.get('escrowId');
    const orderId = searchParams.get('orderId');

    if (!escrowId && !orderId) {
      return NextResponse.json(
        { error: 'Either escrowId or orderId is required' },
        { status: 400 }
      );
    }

    let escrow;
    if (escrowId) {
      escrow = await escrowService.getEscrow(escrowId, session.user.id);
    } else if (orderId) {
      escrow = await escrowService.getEscrowByOrderId(orderId, session.user.id);
    }

    if (!escrow) {
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      escrow: {
        id: escrow.id,
        orderId: escrow.orderId,
        totalAmount: escrow.totalAmount,
        heldAmount: escrow.heldAmount,
        releasedAmount: escrow.releasedAmount,
        status: escrow.status,
        createdAt: escrow.createdAt,
        updatedAt: escrow.updatedAt,
        order: escrow.order ? {
          id: escrow.order.id,
          status: escrow.order.status,
          paymentStatus: escrow.order.paymentStatus,
          user: {
            id: escrow.order.user.id,
            name: escrow.order.user.name,
            email: escrow.order.user.email,
          },
          project: escrow.order.project ? {
            id: escrow.order.project.id,
            title: escrow.order.project.title,
            description: escrow.order.project.description,
            status: escrow.order.project.status,
            professional: escrow.order.project.professional ? {
              id: escrow.order.project.professional.id,
              businessName: escrow.order.project.professional.businessName,
              user: {
                id: escrow.order.project.professional.user.id,
                name: escrow.order.project.professional.user.name,
                email: escrow.order.project.professional.user.email,
              },
            } : null,
          } : null,
        } : null,
        terms: escrow.terms.map(term => ({
          id: term.id,
          termNumber: term.termNumber,
          name: term.name,
          description: term.description,
          percentage: term.percentage,
          amount: term.amount,
          status: term.status,
          dueDate: term.dueDate,
          completedAt: term.completedAt,
          approvedAt: term.approvedAt,
          releasedAt: term.releasedAt,
          documentation: term.documentation,
          approvalRequired: term.approvalRequired,
          createdAt: term.createdAt,
          updatedAt: term.updatedAt,
        })),
        transactions: escrow.transactions?.map(transaction => ({
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          termId: transaction.termId,
          paymentId: transaction.paymentId,
          createdBy: transaction.createdBy,
          metadata: transaction.metadata,
          createdAt: transaction.createdAt,
        })) || [],
        disputes: escrow.disputes?.map(dispute => ({
          id: dispute.id,
          termId: dispute.termId,
          raisedBy: dispute.raisedBy,
          reason: dispute.reason,
          description: dispute.description,
          evidence: dispute.evidence,
          status: dispute.status,
          resolution: dispute.resolution,
          resolvedBy: dispute.resolvedBy,
          resolvedAt: dispute.resolvedAt,
          createdAt: dispute.createdAt,
        })) || [],
      },
    });
  } catch (error) {
    console.error('Escrow details error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch escrow details' },
      { status: 500 }
    );
  }
}
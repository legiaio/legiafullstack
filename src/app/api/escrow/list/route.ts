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

    // Get user's escrows
    const escrows = await escrowService.getUserEscrows(session.user.id);

    // Get escrow statistics
    const stats = await escrowService.getEscrowStats(session.user.id);

    return NextResponse.json({
      success: true,
      escrows: escrows.map(escrow => ({
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
          user: {
            id: escrow.order.user.id,
            name: escrow.order.user.name,
            email: escrow.order.user.email,
          },
          project: escrow.order.project ? {
            id: escrow.order.project.id,
            title: escrow.order.project.title,
            professional: escrow.order.project.professional ? {
              id: escrow.order.project.professional.id,
              businessName: escrow.order.project.professional.businessName,
              user: {
                id: escrow.order.project.professional.user.id,
                name: escrow.order.project.professional.user.name,
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
          approvalRequired: term.approvalRequired,
        })),
        transactionCount: escrow._count?.transactions || 0,
      })),
      stats,
    });
  } catch (error) {
    console.error('Escrow list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch escrows' },
      { status: 500 }
    );
  }
}
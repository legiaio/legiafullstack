import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { escrowService } from '@/lib/escrow/service';
import { EscrowCreateRequest } from '@/lib/escrow/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: EscrowCreateRequest = await request.json();

    // Validate required fields
    if (!body.orderId || !body.totalAmount || !body.terms || body.terms.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, totalAmount, terms' },
        { status: 400 }
      );
    }

    // Validate terms
    const totalPercentage = body.terms.reduce((sum, term) => sum + term.percentage, 0);
    if (totalPercentage !== 100) {
      return NextResponse.json(
        { error: 'Term percentages must add up to 100%' },
        { status: 400 }
      );
    }

    // Validate each term
    for (const term of body.terms) {
      if (!term.name || !term.description || term.percentage <= 0) {
        return NextResponse.json(
          { error: 'Each term must have name, description, and positive percentage' },
          { status: 400 }
        );
      }
    }

    // Create escrow
    const escrow = await escrowService.createEscrow(body, session.user.id);

    return NextResponse.json({
      success: true,
      escrow: {
        id: escrow.id,
        orderId: escrow.orderId,
        totalAmount: escrow.totalAmount,
        heldAmount: escrow.heldAmount,
        releasedAmount: escrow.releasedAmount,
        status: escrow.status,
        terms: escrow.terms?.map(term => ({
          id: term.id,
          termNumber: term.termNumber,
          name: term.name,
          description: term.description,
          percentage: term.percentage,
          amount: term.amount,
          status: term.status,
          dueDate: term.dueDate,
          approvalRequired: term.approvalRequired,
        })),
        createdAt: escrow.createdAt,
      },
    });
  } catch (error) {
    console.error('Escrow creation error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create escrow' },
      { status: 500 }
    );
  }
}
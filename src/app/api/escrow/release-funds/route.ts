import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { escrowService } from '@/lib/escrow/service';
import { EscrowReleaseRequest } from '@/lib/escrow/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: EscrowReleaseRequest = await request.json();

    if (!body.escrowId || !body.termId || !body.reason) {
      return NextResponse.json(
        { error: 'Missing required fields: escrowId, termId, reason' },
        { status: 400 }
      );
    }

    // Release funds
    const transaction = await escrowService.releaseFunds(body, session.user.id);

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        termId: transaction.termId,
        createdAt: transaction.createdAt,
      },
      message: 'Funds released successfully to professional.',
    });
  } catch (error) {
    console.error('Fund release error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to release funds' },
      { status: 500 }
    );
  }
}
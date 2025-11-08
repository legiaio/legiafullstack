import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { escrowService } from '@/lib/escrow/service';
import { EscrowDisputeRequest } from '@/lib/escrow/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: EscrowDisputeRequest = await request.json();

    if (!body.escrowId || !body.reason || !body.description) {
      return NextResponse.json(
        { error: 'Missing required fields: escrowId, reason, description' },
        { status: 400 }
      );
    }

    if (!body.evidence || !Array.isArray(body.evidence)) {
      return NextResponse.json(
        { error: 'Evidence is required and must be an array' },
        { status: 400 }
      );
    }

    // Create dispute
    const dispute = await escrowService.createDispute(body, session.user.id);

    return NextResponse.json({
      success: true,
      dispute: {
        id: dispute.id,
        escrowId: dispute.escrowId,
        termId: dispute.termId,
        raisedBy: dispute.raisedBy,
        reason: dispute.reason,
        description: dispute.description,
        evidence: dispute.evidence,
        status: dispute.status,
        createdAt: dispute.createdAt,
      },
      message: 'Dispute created successfully. Our team will review it shortly.',
    });
  } catch (error) {
    console.error('Dispute creation error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create dispute' },
      { status: 500 }
    );
  }
}
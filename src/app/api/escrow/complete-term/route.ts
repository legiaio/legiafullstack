import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { escrowService } from '@/lib/escrow/service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { escrowId, termId, documentation } = await request.json();

    if (!escrowId || !termId) {
      return NextResponse.json(
        { error: 'Missing required fields: escrowId, termId' },
        { status: 400 }
      );
    }

    if (!documentation || !Array.isArray(documentation)) {
      return NextResponse.json(
        { error: 'Documentation is required and must be an array' },
        { status: 400 }
      );
    }

    // Complete the term
    const updatedTerm = await escrowService.completeTerm(
      escrowId,
      termId,
      documentation,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      term: {
        id: updatedTerm.id,
        termNumber: updatedTerm.termNumber,
        name: updatedTerm.name,
        description: updatedTerm.description,
        percentage: updatedTerm.percentage,
        amount: updatedTerm.amount,
        status: updatedTerm.status,
        dueDate: updatedTerm.dueDate,
        completedAt: updatedTerm.completedAt,
        documentation: updatedTerm.documentation,
        approvalRequired: updatedTerm.approvalRequired,
      },
      message: 'Term completed successfully. Awaiting client approval.',
    });
  } catch (error) {
    console.error('Term completion error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to complete term' },
      { status: 500 }
    );
  }
}
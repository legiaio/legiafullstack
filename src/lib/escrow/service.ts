import { prisma } from '@/lib/prisma';
import {
  EscrowAccount,
  EscrowTerm,
  EscrowTransaction,
  EscrowDispute,
  EscrowStatus,
  EscrowTermStatus,
  EscrowTransactionType,
  DisputeStatus,
  EscrowCreateRequest,
  EscrowReleaseRequest,
  EscrowDisputeRequest,
} from './types';

export class EscrowService {
  /**
   * Create a new escrow account for an order
   */
  async createEscrow(request: EscrowCreateRequest, userId: string): Promise<EscrowAccount> {
    try {
      // Validate order exists and user has permission
      const order = await prisma.order.findUnique({
        where: { id: request.orderId },
        include: { user: true, project: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.userId !== userId) {
        throw new Error('Unauthorized to create escrow for this order');
      }

      // Validate terms percentages add up to 100%
      const totalPercentage = request.terms.reduce((sum, term) => sum + term.percentage, 0);
      if (totalPercentage !== 100) {
        throw new Error('Term percentages must add up to 100%');
      }

      // Create escrow account with terms
      const escrow = await prisma.$transaction(async (tx) => {
        // Create escrow account
        const newEscrow = await tx.escrow.create({
          data: {
            orderId: request.orderId,
            totalAmount: request.totalAmount,
            heldAmount: request.totalAmount,
            releasedAmount: 0,
            status: EscrowStatus.PENDING,
          },
        });

        // Create escrow terms
        const terms = await Promise.all(
          request.terms.map((term, index) =>
            tx.escrowTerm.create({
              data: {
                escrowId: newEscrow.id,
                termNumber: index + 1,
                name: term.name,
                description: term.description,
                percentage: term.percentage,
                amount: Math.round((request.totalAmount * term.percentage) / 100),
                status: EscrowTermStatus.PENDING,
                dueDate: term.dueDate,
                approvalRequired: term.approvalRequired ?? true,
                documentation: [],
              },
            })
          )
        );

        // Create initial deposit transaction
        await tx.escrowTransaction.create({
          data: {
            escrowId: newEscrow.id,
            type: EscrowTransactionType.DEPOSIT,
            amount: request.totalAmount,
            description: 'Initial escrow deposit',
            createdBy: userId,
          },
        });

        return { ...newEscrow, terms };
      });

      return escrow as EscrowAccount;
    } catch (error) {
      console.error('Escrow creation error:', error);
      throw error;
    }
  }

  /**
   * Get escrow account by ID
   */
  async getEscrow(escrowId: string, userId: string): Promise<EscrowAccount | null> {
    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
      include: {
        order: {
          include: { user: true, project: { include: { professional: true } } },
        },
        terms: {
          orderBy: { termNumber: 'asc' },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!escrow) return null;

    // Check if user has permission to view this escrow
    const hasPermission =
      escrow.order.userId === userId ||
      escrow.order.project?.professional?.userId === userId;

    if (!hasPermission) {
      throw new Error('Unauthorized to view this escrow');
    }

    return escrow as any;
  }

  /**
   * Get escrow by order ID
   */
  async getEscrowByOrderId(orderId: string, userId: string): Promise<EscrowAccount | null> {
    const escrow = await prisma.escrow.findFirst({
      where: { orderId },
      include: {
        order: {
          include: { user: true, project: { include: { professional: true } } },
        },
        terms: {
          orderBy: { termNumber: 'asc' },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!escrow) return null;

    // Check permissions
    const hasPermission =
      escrow.order.userId === userId ||
      escrow.order.project?.professional?.userId === userId;

    if (!hasPermission) {
      throw new Error('Unauthorized to view this escrow');
    }

    return escrow as any;
  }

  /**
   * Mark a term as completed by professional
   */
  async completeTerm(
    escrowId: string,
    termId: string,
    documentation: string[],
    userId: string
  ): Promise<EscrowTerm> {
    try {
      // Verify user is the professional for this project
      const escrow = await prisma.escrow.findUnique({
        where: { id: escrowId },
        include: {
          order: { include: { project: { include: { professional: true } } } },
          terms: { where: { id: termId } },
        },
      });

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (!escrow.order.project?.professional || escrow.order.project.professional.userId !== userId) {
        throw new Error('Unauthorized to complete this term');
      }

      const term = escrow.terms[0];
      if (!term) {
        throw new Error('Term not found');
      }

      if (term.status !== EscrowTermStatus.PENDING && term.status !== EscrowTermStatus.IN_PROGRESS) {
        throw new Error('Term cannot be completed in current status');
      }

      // Update term status
      const updatedTerm = await prisma.escrowTerm.update({
        where: { id: termId },
        data: {
          status: EscrowTermStatus.COMPLETED,
          documentation,
          completedAt: new Date(),
        },
      });

      // Create transaction record
      await prisma.escrowTransaction.create({
        data: {
          escrowId,
          type: EscrowTransactionType.RELEASE,
          amount: term.amount,
          description: `Term ${term.termNumber} completed: ${term.name}`,
          termId,
          createdBy: userId,
        },
      });

      return updatedTerm as EscrowTerm;
    } catch (error) {
      console.error('Term completion error:', error);
      throw error;
    }
  }

  /**
   * Approve a completed term (by client)
   */
  async approveTerm(escrowId: string, termId: string, userId: string): Promise<EscrowTerm> {
    try {
      // Verify user is the client for this project
      const escrow = await prisma.escrow.findUnique({
        where: { id: escrowId },
        include: {
          order: { include: { user: true } },
          terms: { where: { id: termId } },
        },
      });

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.order.userId !== userId) {
        throw new Error('Unauthorized to approve this term');
      }

      const term = escrow.terms[0];
      if (!term) {
        throw new Error('Term not found');
      }

      if (term.status !== EscrowTermStatus.COMPLETED) {
        throw new Error('Term must be completed before approval');
      }

      // Update term status
      const updatedTerm = await prisma.escrowTerm.update({
        where: { id: termId },
        data: {
          status: EscrowTermStatus.APPROVED,
          approvedAt: new Date(),
        },
      });

      return updatedTerm as EscrowTerm;
    } catch (error) {
      console.error('Term approval error:', error);
      throw error;
    }
  }

  /**
   * Release funds for an approved term
   */
  async releaseFunds(request: EscrowReleaseRequest, userId: string): Promise<EscrowTransaction> {
    try {
      const { escrowId, termId, amount, reason, documentation } = request;

      // Get escrow and term details
      const escrow = await prisma.escrow.findUnique({
        where: { id: escrowId },
        include: {
          order: { include: { user: true, project: { include: { professional: true } } } },
          terms: { where: { id: termId } },
        },
      });

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      const term = escrow.terms[0];
      if (!term) {
        throw new Error('Term not found');
      }

      // Check if user has permission (client or admin)
      const isClient = escrow.order.userId === userId;
      const isAdmin = false; // TODO: Check admin role

      if (!isClient && !isAdmin) {
        throw new Error('Unauthorized to release funds');
      }

      // Validate term status
      if (term.status !== EscrowTermStatus.APPROVED) {
        throw new Error('Term must be approved before fund release');
      }

      // Calculate release amount
      const releaseAmount = amount || term.amount;
      if (releaseAmount > term.amount) {
        throw new Error('Release amount cannot exceed term amount');
      }

      if (releaseAmount > escrow.heldAmount) {
        throw new Error('Insufficient held funds');
      }

      // Perform fund release transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update term status
        await tx.escrowTerm.update({
          where: { id: termId },
          data: {
            status: EscrowTermStatus.RELEASED,
            releasedAt: new Date(),
            documentation: (documentation || term.documentation) as any,
          },
        });

        // Update escrow amounts
        await tx.escrow.update({
          where: { id: escrowId },
          data: {
            heldAmount: { decrement: releaseAmount },
            releasedAmount: { increment: releaseAmount },
          },
        });

        // Create release transaction
        const transaction = await tx.escrowTransaction.create({
          data: {
            escrowId,
            type: EscrowTransactionType.RELEASE,
            amount: releaseAmount,
            description: reason,
            termId,
            createdBy: userId,
            metadata: { documentation },
          },
        });

        // Update professional balance
        if (escrow.order.project?.professional) {
          await tx.professional.update({
            where: { id: escrow.order.project.professional.id },
            data: {
              balance: { increment: releaseAmount },
            },
          });
        }

        return transaction;
      });

      return result as EscrowTransaction;
    } catch (error) {
      console.error('Fund release error:', error);
      throw error;
    }
  }

  /**
   * Create a dispute for a term
   */
  async createDispute(request: EscrowDisputeRequest, userId: string): Promise<EscrowDispute> {
    try {
      const { escrowId, termId, reason, description, evidence } = request;

      // Verify user has permission to create dispute
      const escrow = await prisma.escrow.findUnique({
        where: { id: escrowId },
        include: {
          order: { include: { user: true, project: { include: { professional: true } } } },
        },
      });

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      const isClient = escrow.order.userId === userId;
      const isProfessional = escrow.order.project?.professional?.userId === userId;

      if (!isClient && !isProfessional) {
        throw new Error('Unauthorized to create dispute');
      }

      // Create dispute
      const dispute = await prisma.$transaction(async (tx) => {
        // Create dispute record
        const newDispute = await tx.escrowDispute.create({
          data: {
            escrowId,
            termId,
            raisedBy: userId,
            reason,
            description,
            evidence,
            status: DisputeStatus.OPEN,
          },
        });

        // Update escrow status
        await tx.escrow.update({
          where: { id: escrowId },
          data: { status: EscrowStatus.DISPUTED },
        });

        // Update term status if specific term is disputed
        if (termId) {
          await tx.escrowTerm.update({
            where: { id: termId },
            data: { status: EscrowTermStatus.DISPUTED },
          });
        }

        // Create dispute transaction
        await tx.escrowTransaction.create({
          data: {
            escrowId,
            type: EscrowTransactionType.DISPUTE_HOLD,
            amount: 0,
            description: `Dispute created: ${reason}`,
            termId,
            createdBy: userId,
            metadata: { disputeId: newDispute.id },
          },
        });

        return newDispute;
      });

      return dispute as EscrowDispute;
    } catch (error) {
      console.error('Dispute creation error:', error);
      throw error;
    }
  }

  /**
   * Get all escrows for a user
   */
  async getUserEscrows(userId: string): Promise<EscrowAccount[]> {
    const escrows = await prisma.escrow.findMany({
      where: {
        OR: [
          { order: { userId } },
          { order: { project: { professional: { userId } } } },
        ],
      },
      include: {
        order: {
          include: { user: true, project: { include: { professional: true } } },
        },
        terms: {
          orderBy: { termNumber: 'asc' },
        },
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return escrows as any;
  }

  /**
   * Get escrow statistics
   */
  async getEscrowStats(userId: string) {
    const stats = await prisma.escrow.aggregate({
      where: {
        OR: [
          { order: { userId } },
          { order: { project: { professional: { userId } } } },
        ],
      },
      _sum: {
        totalAmount: true,
        heldAmount: true,
        releasedAmount: true,
      },
      _count: {
        id: true,
      },
    });

    const statusCounts = await prisma.escrow.groupBy({
      by: ['status'],
      where: {
        OR: [
          { order: { userId } },
          { order: { project: { professional: { userId } } } },
        ],
      },
      _count: {
        id: true,
      },
    });

    return {
      totalEscrows: stats._count.id,
      totalAmount: stats._sum.totalAmount || 0,
      heldAmount: stats._sum.heldAmount || 0,
      releasedAmount: stats._sum.releasedAmount || 0,
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

export const escrowService = new EscrowService();
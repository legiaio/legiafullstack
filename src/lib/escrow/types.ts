export interface EscrowAccount {
  id: string;
  orderId: string;
  totalAmount: number;
  heldAmount: number;
  releasedAmount: number;
  status: EscrowStatus;
  terms: EscrowTerm[];
  transactions?: EscrowTransaction[];
  disputes?: EscrowDispute[];
  _count?: {
    transactions?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  order?: {
    id: string;
    status: string;
    paymentStatus: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    project?: {
      id: string;
      title: string;
      description: string;
      status: string;
      professional?: {
        id: string;
        businessName: string;
        user: {
          id: string;
          name: string;
          email: string;
        };
      };
    };
  };
}

export interface EscrowTerm {
  id: string;
  escrowId: string;
  termNumber: number;
  name: string;
  description: string;
  percentage: number;
  amount: number;
  status: EscrowTermStatus;
  dueDate?: Date;
  completedAt?: Date;
  approvedAt?: Date;
  releasedAt?: Date;
  documentation: string[];
  approvalRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EscrowTransaction {
  id: string;
  escrowId: string;
  type: EscrowTransactionType;
  amount: number;
  description: string;
  termId?: string;
  paymentId?: string;
  createdBy: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface EscrowRelease {
  termId: string;
  amount: number;
  reason: string;
  documentation?: string[];
  approvedBy?: string;
}

export interface EscrowDispute {
  id: string;
  escrowId: string;
  termId?: string;
  raisedBy: string;
  reason: string;
  description: string;
  evidence: string[];
  status: DisputeStatus;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

export enum EscrowStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum EscrowTermStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  APPROVED = 'APPROVED',
  RELEASED = 'RELEASED',
  DISPUTED = 'DISPUTED'
}

export enum EscrowTransactionType {
  DEPOSIT = 'DEPOSIT',
  RELEASE = 'RELEASE',
  REFUND = 'REFUND',
  FEE = 'FEE',
  DISPUTE_HOLD = 'DISPUTE_HOLD',
  DISPUTE_RELEASE = 'DISPUTE_RELEASE'
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
  CLOSED = 'CLOSED'
}

export interface EscrowCreateRequest {
  orderId: string;
  totalAmount: number;
  terms: {
    name: string;
    description: string;
    percentage: number;
    dueDate?: Date;
    approvalRequired?: boolean;
  }[];
}

export interface EscrowReleaseRequest {
  escrowId: string;
  termId: string;
  amount?: number;
  reason: string;
  documentation?: string[];
}

export interface EscrowDisputeRequest {
  escrowId: string;
  termId?: string;
  reason: string;
  description: string;
  evidence: string[];
}
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign,
  FileText,
  Users,
  TrendingUp
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface EscrowStats {
  totalEscrows: number;
  activeEscrows: number;
  completedEscrows: number;
  totalHeld: number;
  totalReleased: number;
  pendingApprovals: number;
  disputes: number;
}

interface EscrowTerm {
  id: string;
  termNumber: number;
  name: string;
  description: string;
  percentage: number;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'APPROVED' | 'RELEASED';
  dueDate?: string;
  completedAt?: string;
  approvedAt?: string;
  releasedAt?: string;
  approvalRequired: boolean;
}

interface EscrowAccount {
  id: string;
  orderId: string;
  totalAmount: number;
  heldAmount: number;
  releasedAmount: number;
  status: 'ACTIVE' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    status: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    project?: {
      id: string;
      title: string;
      professional?: {
        id: string;
        businessName: string;
        user: {
          id: string;
          name: string;
        };
      };
    };
  };
  terms: EscrowTerm[];
  transactionCount: number;
}

export default function EscrowDashboard() {
  const [escrows, setEscrows] = useState<EscrowAccount[]>([]);
  const [stats, setStats] = useState<EscrowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEscrows();
  }, []);

  const fetchEscrows = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/escrow/list');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch escrows');
      }

      setEscrows(data.escrows);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'DISPUTED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTermStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'RELEASED':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = (escrow: EscrowAccount) => {
    const releasedPercentage = (escrow.releasedAmount / escrow.totalAmount) * 100;
    return Math.round(releasedPercentage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchEscrows} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Escrows</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEscrows}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeEscrows} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funds Held</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalHeld)}</div>
              <p className="text-xs text-muted-foreground">
                In escrow accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funds Released</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalReleased)}</div>
              <p className="text-xs text-muted-foreground">
                To professionals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Escrow List */}
      <Card>
        <CardHeader>
          <CardTitle>Escrow Accounts</CardTitle>
          <CardDescription>
            Manage your escrow accounts and track fund releases
          </CardDescription>
        </CardHeader>
        <CardContent>
          {escrows.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No escrow accounts found</p>
              <p className="text-sm text-gray-400">
                Escrow accounts will appear here when orders are placed
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {escrows.map((escrow) => (
                <Card key={escrow.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {escrow.order.project?.title || `Order #${escrow.orderId.slice(-8)}`}
                        </CardTitle>
                        <CardDescription>
                          {escrow.order.project?.professional?.businessName || 'Professional Service'}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(escrow.status)}>
                        {escrow.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="text-lg font-semibold">{formatCurrency(escrow.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Released</p>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(escrow.releasedAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Held</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {formatCurrency(escrow.heldAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">Progress</span>
                        <span className="text-sm font-medium">{calculateProgress(escrow)}%</span>
                      </div>
                      <Progress value={calculateProgress(escrow)} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Terms ({escrow.terms.length})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {escrow.terms.map((term) => (
                          <div key={term.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <p className="text-sm font-medium">{term.name}</p>
                              <p className="text-xs text-gray-500">
                                {term.percentage}% • {formatCurrency(term.amount)}
                              </p>
                            </div>
                            <Badge className={getTermStatusColor(term.status)} variant="secondary">
                              {term.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {escrow.order.user.name}
                        </span>
                        <span className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          {escrow.transactionCount} transactions
                        </span>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
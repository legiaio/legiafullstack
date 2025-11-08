'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Upload,
  FileText,
  Calendar,
  DollarSign
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

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
  documentation?: any[];
  approvalRequired: boolean;
}

interface EscrowTermCardProps {
  term: EscrowTerm;
  escrowId: string;
  userRole: 'client' | 'professional' | 'admin';
  onTermUpdate: (termId: string) => void;
}

export default function EscrowTermCard({ 
  term, 
  escrowId, 
  userRole, 
  onTermUpdate 
}: EscrowTermCardProps) {
  const [loading, setLoading] = useState(false);
  const [documentation, setDocumentation] = useState<string[]>(['']);
  const [completionNotes, setCompletionNotes] = useState('');
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'RELEASED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'COMPLETED':
        return <FileText className="h-4 w-4" />;
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'RELEASED':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const addDocumentationField = () => {
    setDocumentation([...documentation, '']);
  };

  const updateDocumentationField = (index: number, value: string) => {
    const updated = [...documentation];
    updated[index] = value;
    setDocumentation(updated);
  };

  const removeDocumentationField = (index: number) => {
    const updated = documentation.filter((_, i) => i !== index);
    setDocumentation(updated);
  };

  const handleCompleteTerm = async () => {
    try {
      setLoading(true);
      
      const validDocumentation = documentation.filter(doc => doc.trim() !== '');
      if (validDocumentation.length === 0) {
        throw new Error('At least one documentation item is required');
      }

      const response = await fetch('/api/escrow/complete-term', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          escrowId,
          termId: term.id,
          documentation: validDocumentation.map(doc => ({
            type: 'text',
            content: doc,
            notes: completionNotes,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete term');
      }

      setShowCompleteDialog(false);
      setDocumentation(['']);
      setCompletionNotes('');
      onTermUpdate(term.id);
    } catch (error) {
      console.error('Error completing term:', error);
      alert(error instanceof Error ? error.message : 'Failed to complete term');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTerm = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/escrow/approve-term', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          escrowId,
          termId: term.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve term');
      }

      setShowApproveDialog(false);
      onTermUpdate(term.id);
    } catch (error) {
      console.error('Error approving term:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve term');
    } finally {
      setLoading(false);
    }
  };

  const canComplete = userRole === 'professional' && term.status === 'PENDING';
  const canApprove = userRole === 'client' && term.status === 'COMPLETED' && term.approvalRequired;
  const canRelease = userRole === 'admin' && term.status === 'APPROVED';

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Term {term.termNumber}: {term.name}
              {getStatusIcon(term.status)}
            </CardTitle>
            <CardDescription>{term.description}</CardDescription>
          </div>
          <Badge className={getStatusColor(term.status)}>
            {term.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Amount</p>
            <p className="text-lg font-semibold flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {formatCurrency(term.amount)}
            </p>
            <p className="text-xs text-gray-400">{term.percentage}% of total</p>
          </div>
          
          {term.dueDate && (
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="text-sm flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(term.dueDate)}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-500">Status Timeline</p>
            <div className="text-xs space-y-1">
              {term.completedAt && (
                <p className="text-blue-600">Completed: {formatDate(term.completedAt)}</p>
              )}
              {term.approvedAt && (
                <p className="text-green-600">Approved: {formatDate(term.approvedAt)}</p>
              )}
              {term.releasedAt && (
                <p className="text-emerald-600">Released: {formatDate(term.releasedAt)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Documentation */}
        {term.documentation && term.documentation.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-sm mb-2">Documentation</h4>
            <div className="space-y-2">
              {term.documentation.map((doc: any, index: number) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                  <p>{doc.content}</p>
                  {doc.notes && (
                    <p className="text-gray-500 text-xs mt-1">Notes: {doc.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {canComplete && (
            <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Term
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Complete Term: {term.name}</DialogTitle>
                  <DialogDescription>
                    Provide documentation to mark this term as completed. The client will need to approve before funds are released.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="completion-notes">Completion Notes</Label>
                    <Textarea
                      id="completion-notes"
                      placeholder="Describe what was completed for this term..."
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label>Documentation</Label>
                    <div className="space-y-2">
                      {documentation.map((doc, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="Documentation item (e.g., file URL, description, etc.)"
                            value={doc}
                            onChange={(e) => updateDocumentationField(index, e.target.value)}
                          />
                          {documentation.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeDocumentationField(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addDocumentationField}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Add Documentation
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCompleteDialog(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCompleteTerm} disabled={loading}>
                      {loading ? 'Completing...' : 'Complete Term'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {canApprove && (
            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Term
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Approve Term: {term.name}</DialogTitle>
                  <DialogDescription>
                    Review the completed work and approve this term. Once approved, funds will be released to the professional.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded">
                    <h4 className="font-medium mb-2">Term Details</h4>
                    <p className="text-sm text-gray-600 mb-2">{term.description}</p>
                    <p className="text-sm">
                      <strong>Amount:</strong> {formatCurrency(term.amount)} ({term.percentage}%)
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowApproveDialog(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleApproveTerm} disabled={loading}>
                      {loading ? 'Approving...' : 'Approve & Release Funds'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {term.status === 'RELEASED' && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Funds Released
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
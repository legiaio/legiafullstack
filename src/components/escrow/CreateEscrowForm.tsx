'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Shield, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface EscrowTermInput {
  name: string;
  description: string;
  percentage: number;
  dueDate?: string;
  approvalRequired: boolean;
}

interface CreateEscrowFormProps {
  orderId: string;
  totalAmount: number;
  onSuccess: (escrowId: string) => void;
  onCancel: () => void;
}

export default function CreateEscrowForm({ 
  orderId, 
  totalAmount, 
  onSuccess, 
  onCancel 
}: CreateEscrowFormProps) {
  const [terms, setTerms] = useState<EscrowTermInput[]>([
    {
      name: 'Initial Payment',
      description: 'Project initiation and setup',
      percentage: 30,
      approvalRequired: true,
    },
    {
      name: 'Milestone 1',
      description: 'First deliverable completion',
      percentage: 40,
      approvalRequired: true,
    },
    {
      name: 'Final Payment',
      description: 'Project completion and delivery',
      percentage: 30,
      approvalRequired: true,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTerm = () => {
    setTerms([
      ...terms,
      {
        name: '',
        description: '',
        percentage: 0,
        approvalRequired: true,
      },
    ]);
  };

  const removeTerm = (index: number) => {
    if (terms.length > 1) {
      setTerms(terms.filter((_, i) => i !== index));
    }
  };

  const updateTerm = (index: number, field: keyof EscrowTermInput, value: any) => {
    const updated = [...terms];
    updated[index] = { ...updated[index], [field]: value };
    setTerms(updated);
  };

  const getTotalPercentage = () => {
    return terms.reduce((sum, term) => sum + (term.percentage || 0), 0);
  };

  const validateForm = () => {
    const totalPercentage = getTotalPercentage();
    
    if (totalPercentage !== 100) {
      setError('Term percentages must add up to exactly 100%');
      return false;
    }

    for (let i = 0; i < terms.length; i++) {
      const term = terms[i];
      if (!term.name.trim()) {
        setError(`Term ${i + 1} name is required`);
        return false;
      }
      if (!term.description.trim()) {
        setError(`Term ${i + 1} description is required`);
        return false;
      }
      if (term.percentage <= 0) {
        setError(`Term ${i + 1} percentage must be greater than 0`);
        return false;
      }
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/escrow/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          totalAmount,
          terms: terms.map((term, index) => ({
            ...term,
            termNumber: index + 1,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create escrow');
      }

      onSuccess(data.escrow.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const totalPercentage = getTotalPercentage();
  const isValidPercentage = totalPercentage === 100;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Create Escrow Account
        </CardTitle>
        <CardDescription>
          Set up payment terms and milestones for secure fund management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Summary */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium mb-2">Order Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Order ID:</span>
                <span className="ml-2 font-mono">{orderId}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Amount:</span>
                <span className="ml-2 font-semibold">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Payment Terms</h3>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={isValidPercentage ? "default" : "destructive"}
                  className={isValidPercentage ? "bg-green-100 text-green-800" : ""}
                >
                  Total: {totalPercentage}%
                </Badge>
                <Button type="button" variant="outline" size="sm" onClick={addTerm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Term
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {terms.map((term, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Term {index + 1}</CardTitle>
                      {terms.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTerm(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`term-${index}-name`}>Term Name</Label>
                        <Input
                          id={`term-${index}-name`}
                          placeholder="e.g., Initial Payment"
                          value={term.name}
                          onChange={(e) => updateTerm(index, 'name', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor={`term-${index}-percentage`}>Percentage (%)</Label>
                        <Input
                          id={`term-${index}-percentage`}
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="30"
                          value={term.percentage || ''}
                          onChange={(e) => updateTerm(index, 'percentage', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`term-${index}-description`}>Description</Label>
                      <Textarea
                        id={`term-${index}-description`}
                        placeholder="Describe what needs to be completed for this term..."
                        value={term.description}
                        onChange={(e) => updateTerm(index, 'description', e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`term-${index}-dueDate`}>Due Date (Optional)</Label>
                        <Input
                          id={`term-${index}-dueDate`}
                          type="date"
                          value={term.dueDate || ''}
                          onChange={(e) => updateTerm(index, 'dueDate', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <input
                          type="checkbox"
                          id={`term-${index}-approval`}
                          checked={term.approvalRequired}
                          onChange={(e) => updateTerm(index, 'approvalRequired', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor={`term-${index}-approval`} className="text-sm">
                          Requires client approval
                        </Label>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded text-sm">
                      <strong>Amount:</strong> {formatCurrency((totalAmount * term.percentage) / 100)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Escrow Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Terms:</span>
                <span className="ml-2 font-semibold">{terms.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Percentage:</span>
                <span className={`ml-2 font-semibold ${isValidPercentage ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPercentage}%
                </span>
              </div>
              <div>
                <span className="text-gray-500">Escrow Amount:</span>
                <span className="ml-2 font-semibold">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isValidPercentage}>
              {loading ? 'Creating...' : 'Create Escrow Account'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
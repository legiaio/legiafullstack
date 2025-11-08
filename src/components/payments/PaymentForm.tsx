'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ExternalLink, QrCode, Copy, CheckCircle } from 'lucide-react';
import PaymentGatewaySelector from './PaymentGatewaySelector';

interface PaymentFormProps {
  orderId: string;
  amount: number;
  currency?: string;
  description?: string;
  onPaymentCreated?: (payment: any) => void;
}

interface PaymentMethod {
  code: string;
  name: string;
  type: string;
  fee: number;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
}

export default function PaymentForm({
  orderId,
  amount,
  currency = 'IDR',
  description,
  onPaymentCreated,
}: PaymentFormProps) {
  const { data: session } = useSession();
  const [selectedGateway, setSelectedGateway] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleSelectMethod = (gateway: string, method: PaymentMethod) => {
    setSelectedGateway(gateway);
    setSelectedMethod(method);
    setError(null);
  };

  const handleCreatePayment = async () => {
    if (!selectedGateway || !selectedMethod) {
      setError('Please select a payment method');
      return;
    }

    if (!customerInfo.name || !customerInfo.email) {
      setError('Please fill in customer information');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          gateway: selectedGateway,
          paymentMethod: selectedMethod.code,
          amount,
          currency,
          description: description || `Payment for order ${orderId}`,
          customerInfo,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPayment(data.payment);
        onPaymentCreated?.(data.payment);
      } else {
        setError(data.error || 'Failed to create payment');
      }
    } catch (err) {
      setError('Failed to create payment');
      console.error('Payment creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (payment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Payment Created Successfully
          </CardTitle>
          <CardDescription>
            Complete your payment using the details below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Payment ID</Label>
              <div className="font-mono">{payment.id}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Amount</Label>
              <div className="font-semibold">{formatCurrency(payment.amount)}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Gateway</Label>
              <div className="capitalize">{payment.gateway}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="capitalize">{payment.status}</div>
            </div>
          </div>

          {payment.paymentUrl && (
            <div>
              <Label className="text-muted-foreground">Payment URL</Label>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(payment.paymentUrl, '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Payment Page
                </Button>
              </div>
            </div>
          )}

          {payment.virtualAccount && (
            <div>
              <Label className="text-muted-foreground">Virtual Account</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={payment.virtualAccount}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyToClipboard(payment.virtualAccount, 'va')}
                >
                  {copied === 'va' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {payment.qrCode && (
            <div>
              <Label className="text-muted-foreground">QR Code</Label>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(payment.qrCode, '_blank')}
                  className="flex-1"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  View QR Code
                </Button>
              </div>
            </div>
          )}

          {payment.expiryTime && (
            <Alert>
              <AlertDescription>
                Payment expires on: {new Date(payment.expiryTime).toLocaleString('id-ID')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>
            Complete your payment for order {orderId}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              placeholder="Enter your phone number"
            />
          </div>
        </CardContent>
      </Card>

      <PaymentGatewaySelector
        amount={amount}
        currency={currency}
        onSelectMethod={handleSelectMethod}
        selectedGateway={selectedGateway}
        selectedMethod={selectedMethod?.code}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div className="text-lg font-semibold">
          Total: {formatCurrency(amount + (selectedMethod?.fee || 0))}
        </div>
        <Button
          onClick={handleCreatePayment}
          disabled={loading || !selectedGateway || !selectedMethod}
          size="lg"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Create Payment
        </Button>
      </div>
    </div>
  );
}
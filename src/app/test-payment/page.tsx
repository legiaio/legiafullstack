'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PaymentForm from '@/components/payments/PaymentForm';

export default function TestPaymentPage() {
  const { data: session, status } = useSession();
  const [testOrder, setTestOrder] = useState({
    id: `test-order-${Date.now()}`,
    amount: 100000, // IDR 100,000
    description: 'Test payment for development',
  });
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            Please sign in to test the payment integration.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handlePaymentCreated = (payment: any) => {
    console.log('Payment created:', payment);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Payment Integration Test</h1>
        <p className="text-muted-foreground">
          Test the Indonesian payment gateways integration (Midtrans, Xendit, Tripay)
        </p>
      </div>

      {!showPaymentForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Create Test Order</CardTitle>
            <CardDescription>
              Configure a test order to test the payment integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                value={testOrder.id}
                onChange={(e) => setTestOrder({ ...testOrder, id: e.target.value })}
                placeholder="Enter order ID"
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount (IDR)</Label>
              <Input
                id="amount"
                type="number"
                value={testOrder.amount}
                onChange={(e) => setTestOrder({ ...testOrder, amount: parseInt(e.target.value) || 0 })}
                placeholder="Enter amount in IDR"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={testOrder.description}
                onChange={(e) => setTestOrder({ ...testOrder, description: e.target.value })}
                placeholder="Enter payment description"
              />
            </div>
            <Button
              onClick={() => setShowPaymentForm(true)}
              className="w-full"
              size="lg"
            >
              Proceed to Payment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Payment Checkout</h2>
              <p className="text-muted-foreground">Order: {testOrder.id}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowPaymentForm(false)}
            >
              Back to Order
            </Button>
          </div>

          <PaymentForm
            orderId={testOrder.id}
            amount={testOrder.amount}
            description={testOrder.description}
            onPaymentCreated={handlePaymentCreated}
          />
        </div>
      )}

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl mb-2">🏦</div>
                <div className="font-semibold">Midtrans</div>
                <div className="text-sm text-green-600">Integrated</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl mb-2">💳</div>
                <div className="font-semibold">Xendit</div>
                <div className="text-sm text-green-600">Integrated</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl mb-2">📱</div>
                <div className="font-semibold">Tripay</div>
                <div className="text-sm text-green-600">Integrated</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
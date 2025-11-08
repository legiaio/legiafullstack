'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Smartphone, Building2 } from 'lucide-react';

interface PaymentMethod {
  code: string;
  name: string;
  type: string;
  fee: number;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
}

interface PaymentGateway {
  gateway: string;
  methods: PaymentMethod[];
}

interface PaymentGatewaySelectorProps {
  amount: number;
  currency?: string;
  onSelectMethod: (gateway: string, method: PaymentMethod) => void;
  selectedGateway?: string;
  selectedMethod?: string;
}

const gatewayIcons = {
  midtrans: '🏦',
  xendit: '💳',
  tripay: '📱',
};

const gatewayNames = {
  midtrans: 'Midtrans',
  xendit: 'Xendit',
  tripay: 'Tripay',
};

const methodIcons = {
  'credit_card': <CreditCard className="w-4 h-4" />,
  'bank_transfer': <Building2 className="w-4 h-4" />,
  'e_wallet': <Smartphone className="w-4 h-4" />,
  'virtual_account': <Building2 className="w-4 h-4" />,
  'convenience_store': <Building2 className="w-4 h-4" />,
};

export default function PaymentGatewaySelector({
  amount,
  currency = 'IDR',
  onSelectMethod,
  selectedGateway,
  selectedMethod,
}: PaymentGatewaySelectorProps) {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments/methods');
      const data = await response.json();

      if (data.success) {
        setGateways(data.gateways || []);
      } else {
        setError('Failed to load payment methods');
      }
    } catch (err) {
      setError('Failed to load payment methods');
      console.error('Payment methods error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const isMethodAvailable = (method: PaymentMethod) => {
    return method.isActive && amount >= method.minAmount && amount <= method.maxAmount;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading payment methods...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button onClick={fetchPaymentMethods} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">
        Select Payment Method - {formatCurrency(amount)}
      </div>
      
      {gateways.map((gateway) => (
        <Card key={gateway.gateway}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{gatewayIcons[gateway.gateway as keyof typeof gatewayIcons]}</span>
              {gatewayNames[gateway.gateway as keyof typeof gatewayNames]}
            </CardTitle>
            <CardDescription>
              {gateway.methods.length} payment methods available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {gateway.methods.map((method) => {
                const isAvailable = isMethodAvailable(method);
                const isSelected = selectedGateway === gateway.gateway && selectedMethod === method.code;
                
                return (
                  <Button
                    key={method.code}
                    variant={isSelected ? "default" : "outline"}
                    className={`h-auto p-4 justify-start ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!isAvailable}
                    onClick={() => isAvailable && onSelectMethod(gateway.gateway, method)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-shrink-0">
                        {methodIcons[method.type as keyof typeof methodIcons] || <CreditCard className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{method.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Fee: {formatCurrency(method.fee)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(method.minAmount)} - {formatCurrency(method.maxAmount)}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {isAvailable ? (
                          <Badge variant="secondary">Available</Badge>
                        ) : (
                          <Badge variant="destructive">Unavailable</Badge>
                        )}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
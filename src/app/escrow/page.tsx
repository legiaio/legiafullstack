import { Metadata } from 'next';
import EscrowDashboard from '@/components/escrow/EscrowDashboard';

export const metadata: Metadata = {
  title: 'Escrow Management - Legia',
  description: 'Manage your escrow accounts and secure fund releases',
};

export default function EscrowPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Escrow Management</h1>
        <p className="text-gray-600">
          Secure fund management with milestone-based releases
        </p>
      </div>
      
      <EscrowDashboard />
    </div>
  );
}
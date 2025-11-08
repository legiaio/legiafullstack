"use client"

import { useCart } from "@/lib/cart"
import { CartItem } from "./cart-item"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ShoppingBag, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CartPage() {
  const { items, getTotalPrice, getTotalWithTaxes, clearCart } = useCart()
  const router = useRouter()

  const subtotal = getTotalPrice()
  const vat = subtotal * 0.12
  const transactionFee = subtotal * 0.05
  const total = getTotalWithTaxes()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <ShoppingBag className="mx-auto h-16 w-16 text-gray-400" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Your cart is empty</h2>
            <p className="mt-2 text-gray-600">
              Start exploring our AI-powered professional services marketplace
            </p>
            <Button asChild className="mt-6">
              <Link href="/ai-assistant">
                Find Professionals
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/ai-assistant">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600">{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={clearCart}
            className="text-red-600 hover:text-red-700"
          >
            Clear Cart
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>VAT (12%)</span>
                  <span>{formatPrice(vat)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Transaction Fee (5%)</span>
                  <span>{formatPrice(transactionFee)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>

                <div className="space-y-3 pt-4">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => router.push('/checkout')}
                  >
                    Proceed to Checkout
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    asChild
                  >
                    <Link href="/ai-assistant">
                      Continue Shopping
                    </Link>
                  </Button>
                </div>

                <div className="text-xs text-gray-500 pt-4">
                  <p>• Secure payment processing</p>
                  <p>• Escrow protection included</p>
                  <p>• Professional verification guaranteed</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
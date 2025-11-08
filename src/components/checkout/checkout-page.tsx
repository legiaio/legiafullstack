"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useCart } from "@/lib/cart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CreditCard, Shield, Clock } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

interface PaymentTerm {
  id: string
  name: string
  percentage: number
  amount: number
  description: string
}

export default function CheckoutPage() {
  const { data: session } = useSession()
  const { items, getTotalPrice, getTotalWithTaxes, clearCart } = useCart()
  const router = useRouter()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([
    { id: "1", name: "Initial Payment", percentage: 30, amount: 0, description: "Project initiation and planning" },
    { id: "2", name: "Progress Payment 1", percentage: 40, amount: 0, description: "50% project completion" },
    { id: "3", name: "Final Payment", percentage: 30, amount: 0, description: "Project completion and handover" }
  ])
  
  const [shippingInfo, setShippingInfo] = useState({
    fullName: session?.user?.name || "",
    email: session?.user?.email || "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    notes: ""
  })

  const subtotal = getTotalPrice()
  const vat = subtotal * 0.12
  const transactionFee = subtotal * 0.05
  const total = getTotalWithTaxes()

  // Calculate payment term amounts
  const calculateTermAmounts = () => {
    const updatedTerms = paymentTerms.map(term => ({
      ...term,
      amount: (total * term.percentage) / 100
    }))
    setPaymentTerms(updatedTerms)
  }

  // Update payment term percentage
  const updateTermPercentage = (termId: string, percentage: number) => {
    const updatedTerms = paymentTerms.map(term =>
      term.id === termId ? { ...term, percentage } : term
    )
    
    // Ensure total percentage is 100%
    const totalPercentage = updatedTerms.reduce((sum, term) => sum + term.percentage, 0)
    if (totalPercentage <= 100) {
      setPaymentTerms(updatedTerms)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setShippingInfo(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!shippingInfo.fullName || !shippingInfo.email || !shippingInfo.phone || !shippingInfo.address) {
      toast.error("Please fill in all required fields")
      return
    }

    const totalPercentage = paymentTerms.reduce((sum, term) => sum + term.percentage, 0)
    if (totalPercentage !== 100) {
      toast.error("Payment terms must total 100%")
      return
    }

    setIsProcessing(true)

    try {
      // Calculate final term amounts
      const finalTerms = paymentTerms.map(term => ({
        ...term,
        amount: (total * term.percentage) / 100
      }))

      const orderData = {
        items: items,
        shippingInfo,
        paymentTerms: finalTerms,
        pricing: {
          subtotal,
          vat,
          transactionFee,
          total
        }
      }

      // TODO: Create order API call
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        throw new Error("Failed to create order")
      }

      const order = await response.json()
      
      // Clear cart and redirect to payment
      clearCart()
      toast.success("Order created successfully!")
      router.push(`/orders/${order.id}/payment`)
      
    } catch (error) {
      console.error("Checkout error:", error)
      toast.error("Failed to process order. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900">Your cart is empty</h2>
            <p className="mt-2 text-gray-600">Add some services to your cart before checkout</p>
            <Button asChild className="mt-6">
              <Link href="/ai-assistant">Find Professionals</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/cart">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600">Complete your order</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={shippingInfo.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={shippingInfo.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={shippingInfo.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Street Address *</Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={shippingInfo.address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={shippingInfo.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="province">Province *</Label>
                      <Input
                        id="province"
                        name="province"
                        value={shippingInfo.province}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={shippingInfo.postalCode}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={shippingInfo.notes}
                      onChange={handleInputChange}
                      placeholder="Any special instructions or requirements..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Terms */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Terms</CardTitle>
                  <p className="text-sm text-gray-600">
                    Customize your payment schedule. Total must equal 100%.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentTerms.map((term, index) => (
                    <div key={term.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{term.name}</h4>
                        <p className="text-sm text-gray-600">{term.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={term.percentage}
                          onChange={(e) => updateTermPercentage(term.id, parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                        <span className="text-sm">%</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">
                          {formatPrice((total * term.percentage) / 100)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="text-right text-sm text-gray-600">
                    Total: {paymentTerms.reduce((sum, term) => sum + term.percentage, 0)}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items */}
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {item.portfolioImage ? (
                            <Image
                              src={item.portfolioImage}
                              alt={item.portfolioTitle}
                              width={50}
                              height={50}
                              className="rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-xs text-gray-400">No Image</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">{item.portfolioTitle}</h4>
                          <p className="text-xs text-gray-600">by {item.professionalName}</p>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {item.serviceType}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium">
                          {formatPrice(item.portfolioPrice)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Pricing */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT (12%)</span>
                      <span>{formatPrice(vat)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transaction Fee (5%)</span>
                      <span>{formatPrice(transactionFee)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>

                  {/* Security Features */}
                  <div className="space-y-2 pt-4 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3" />
                      <span>Escrow protection included</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3 w-3" />
                      <span>Secure payment processing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>Term-based payment release</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full mt-6" 
                    size="lg"
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Processing..." : "Complete Order"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
"use client"

import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CartItem as CartItemType, useCart } from "@/lib/cart"
import Image from "next/image"

interface CartItemProps {
  item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
  const removeItem = useCart((state) => state.removeItem)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Portfolio Image */}
          <div className="flex-shrink-0">
            {item.portfolioImage ? (
              <Image
                src={item.portfolioImage}
                alt={item.portfolioTitle}
                width={80}
                height={80}
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-xs">No Image</span>
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-sm">{item.portfolioTitle}</h3>
                <p className="text-sm text-gray-600">by {item.professionalName}</p>
                <Badge variant="secondary" className="mt-1">
                  {item.serviceType}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg">
                  {formatPrice(item.portfolioPrice)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Project Brief Summary */}
            {item.projectBrief && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Project Details:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Area:</span> {item.projectBrief.landArea}
                  </div>
                  <div>
                    <span className="font-medium">Budget:</span> {item.projectBrief.budget}
                  </div>
                  <div>
                    <span className="font-medium">Style:</span> {item.projectBrief.style}
                  </div>
                  <div>
                    <span className="font-medium">Timeline:</span> {item.projectBrief.timeline}
                  </div>
                </div>
                {item.projectBrief.location && (
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-medium">Location:</span> {item.projectBrief.location}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
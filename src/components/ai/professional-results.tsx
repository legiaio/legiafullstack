"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Star, MapPin, ShoppingCart, Eye, Plus } from "lucide-react"
import { useCart } from "@/lib/cart"
import { toast } from "sonner"
import Image from "next/image"

interface Professional {
  id: string
  name: string
  rating: number
  reviewCount: number
  location: string
  distance: number
  serviceType: string
  portfolios: Portfolio[]
}

interface Portfolio {
  id: string
  title: string
  price: number
  images: string[]
  description: string
  completionTime: string
  features: string[]
}

interface ProjectBrief {
  serviceType: string
  landArea: string
  budget: string
  location: string
  style: string
  timeline: string
  description: string
  generatedImage?: string
}

interface ProfessionalResultsProps {
  professionals: Professional[]
  projectBrief: ProjectBrief
  generatedImage?: string
}

export function ProfessionalResults({ 
  professionals, 
  projectBrief, 
  generatedImage 
}: ProfessionalResultsProps) {
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const addItem = useCart((state) => state.addItem)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const handleAddToCart = (professional: Professional, portfolio: Portfolio) => {
    const cartItem = {
      id: `${professional.id}-${portfolio.id}`,
      professionalId: professional.id,
      professionalName: professional.name,
      portfolioId: portfolio.id,
      portfolioTitle: portfolio.title,
      portfolioPrice: portfolio.price,
      portfolioImage: portfolio.images[0],
      serviceType: professional.serviceType,
      projectBrief: {
        ...projectBrief,
        generatedImage,
      }
    }

    addItem(cartItem)
    toast.success(`${portfolio.title} added to cart!`)
  }

  return (
    <div className="space-y-6">
      {/* Generated Project Image */}
      {generatedImage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              AI Generated Project Visualization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <Image
                src={generatedImage}
                alt="AI Generated Project Visualization"
                fill
                className="object-cover"
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Service:</span> {projectBrief.serviceType}
              </div>
              <div>
                <span className="font-medium">Area:</span> {projectBrief.landArea}
              </div>
              <div>
                <span className="font-medium">Style:</span> {projectBrief.style}
              </div>
              <div>
                <span className="font-medium">Budget:</span> {projectBrief.budget}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Professional Recommendations */}
      <div>
        <h3 className="text-xl font-bold mb-4">Recommended Professionals</h3>
        <div className="grid gap-6">
          {professionals.map((professional) => (
            <Card key={professional.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{professional.name}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{professional.rating}</span>
                        <span>({professional.reviewCount} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{professional.location} • {professional.distance}km away</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">{professional.serviceType}</Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid gap-4">
                  <h4 className="font-semibold">Available Portfolios:</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {professional.portfolios.map((portfolio) => (
                      <Card key={portfolio.id} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="aspect-video relative rounded-lg overflow-hidden mb-3">
                            <Image
                              src={portfolio.images[0] || "/placeholder-portfolio.jpg"}
                              alt={portfolio.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-semibold text-sm">{portfolio.title}</h5>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {portfolio.description}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-lg text-green-600">
                                {formatPrice(portfolio.price)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {portfolio.completionTime}
                              </span>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1"
                                    onClick={() => {
                                      setSelectedPortfolio(portfolio)
                                      setSelectedProfessional(professional)
                                    }}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>{selectedPortfolio?.title}</DialogTitle>
                                  </DialogHeader>
                                  {selectedPortfolio && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        {selectedPortfolio.images.map((image, index) => (
                                          <div key={index} className="aspect-video relative rounded-lg overflow-hidden">
                                            <Image
                                              src={image}
                                              alt={`${selectedPortfolio.title} ${index + 1}`}
                                              fill
                                              className="object-cover"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-semibold mb-2">Description</h4>
                                        <p className="text-sm text-gray-600">{selectedPortfolio.description}</p>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-semibold mb-2">Features Included</h4>
                                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                          {selectedPortfolio.features.map((feature, index) => (
                                            <li key={index}>{feature}</li>
                                          ))}
                                        </ul>
                                      </div>
                                      
                                      <div className="flex items-center justify-between pt-4 border-t">
                                        <div>
                                          <span className="text-2xl font-bold text-green-600">
                                            {formatPrice(selectedPortfolio.price)}
                                          </span>
                                          <p className="text-sm text-gray-500">
                                            Completion: {selectedPortfolio.completionTime}
                                          </p>
                                        </div>
                                        <Button 
                                          onClick={() => selectedProfessional && handleAddToCart(selectedProfessional, selectedPortfolio)}
                                          className="bg-blue-600 hover:bg-blue-700"
                                        >
                                          <Plus className="h-4 w-4 mr-2" />
                                          Add to Cart
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              
                              <Button 
                                size="sm" 
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleAddToCart(professional, portfolio)}
                              >
                                <ShoppingCart className="h-3 w-3 mr-1" />
                                Add to Cart
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
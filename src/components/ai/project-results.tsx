"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Star, 
  User, 
  Building, 
  Award,
  ShoppingCart,
  Eye
} from "lucide-react"
import Image from "next/image"

interface ProjectResultsProps {
  data: {
    projectId: string
    projectBrief: any
    projectSummary: string
    generatedImage: {
      url: string
      prompt: string
    }
    matchingProfessionals: any[]
  }
  onAddToCart?: (professional: any) => void
  onViewDetails?: (professional: any) => void
}

export default function ProjectResults({ 
  data, 
  onAddToCart, 
  onViewDetails 
}: ProjectResultsProps) {
  const [selectedProfessionals, setSelectedProfessionals] = useState<Set<string>>(new Set())

  const handleAddToCart = (professional: any) => {
    setSelectedProfessionals(prev => new Set([...prev, professional.id]))
    onAddToCart?.(professional)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getServiceTypeLabel = (type: string) => {
    const labels = {
      CONTRACTOR: "Contractor",
      ARCHITECT: "Architect", 
      INTERIOR_DESIGNER: "Interior Designer",
      DESIGN_BUILD: "Design & Build"
    }
    return labels[type as keyof typeof labels] || type
  }

  const getRoomStyleLabel = (style: string) => {
    const labels = {
      MODERN: "Modern",
      CLASSIC: "Classic",
      MINIMALIST: "Minimalist",
      INDUSTRIAL: "Industrial",
      SCANDINAVIAN: "Scandinavian",
      BOHEMIAN: "Bohemian",
      TRADITIONAL: "Traditional",
      CONTEMPORARY: "Contemporary"
    }
    return labels[style as keyof typeof labels] || style
  }

  return (
    <div className="space-y-6">
      {/* Project Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Your Project Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Service Type</p>
              <Badge variant="secondary">
                {getServiceTypeLabel(data.projectBrief.serviceType)}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Style</p>
              <Badge variant="outline">
                {getRoomStyleLabel(data.projectBrief.roomStyle)}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Budget</p>
              <p className="font-semibold text-green-600">
                {formatCurrency(data.projectBrief.estimatedBudget)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Timeline</p>
              <p className="font-semibold">{data.projectBrief.timeline} days</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{data.projectBrief.location}</span>
            </div>
            {data.projectBrief.landArea && (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{data.projectBrief.landArea} sqm</span>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-2">Project Description</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {data.projectSummary}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Generated Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Visualization</CardTitle>
          <CardDescription>
            Based on your project requirements and style preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={data.generatedImage.url}
              alt="AI Generated Project Visualization"
              fill
              className="object-cover"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                const target = e.target as HTMLImageElement
                target.src = `https://via.placeholder.com/800x450/6b7280/ffffff?text=Project+Visualization`
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Generated using: {data.generatedImage.prompt}
          </p>
        </CardContent>
      </Card>

      {/* Matching Professionals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Recommended Professionals
            <Badge variant="secondary" className="ml-auto">
              {data.matchingProfessionals.length} matches found
            </Badge>
          </CardTitle>
          <CardDescription>
            AI-matched professionals based on your requirements, location, and budget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.matchingProfessionals.map((match, index) => (
              <Card key={match.professional.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={match.professional.user.image} />
                        <AvatarFallback>
                          {match.professional.businessName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-2">
                        <div>
                          <h4 className="font-semibold text-lg">
                            {match.professional.businessName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            by {match.professional.user.name}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">
                              {match.professional.rating.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>{match.professional.experience} years</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4 text-gray-500" />
                            <span>{match.professional.completedProjects} projects</span>
                          </div>
                          {match.professional.user.city && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span>{match.professional.user.city}</span>
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-gray-700 line-clamp-2">
                          {match.professional.description}
                        </p>

                        <div className="flex flex-wrap gap-1">
                          {match.reasonsForMatch.map((reason: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>

                        {match.professional.portfolios.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Recent Portfolios:</p>
                            <div className="flex gap-2">
                              {match.professional.portfolios.slice(0, 3).map((portfolio: any) => (
                                <div key={portfolio.id} className="text-xs">
                                  <Badge variant="secondary">
                                    {formatCurrency(Number(portfolio.price))}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Badge 
                        variant="default" 
                        className="bg-green-100 text-green-800 justify-center"
                      >
                        {match.matchScore.toFixed(0)}% match
                      </Badge>
                      
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewDetails?.(match.professional)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(match.professional)}
                          disabled={selectedProfessionals.has(match.professional.id)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          {selectedProfessionals.has(match.professional.id) 
                            ? "Added to Cart" 
                            : "Add to Cart"
                          }
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
"use client"

import { useState } from "react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import AIAssistant from "@/components/ai/ai-assistant"
import ProjectResults from "@/components/ai/project-results"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Bot, Sparkles } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function AIAssistantPage() {
  const [projectData, setProjectData] = useState<any>(null)
  const [showResults, setShowResults] = useState(false)

  const handleProjectExtracted = (data: any) => {
    setProjectData(data)
    setShowResults(true)
  }

  const handleAddToCart = (professional: any) => {
    // TODO: Implement cart functionality
    toast.success(`${professional.businessName} added to cart!`)
  }

  const handleViewDetails = (professional: any) => {
    // TODO: Implement professional details modal/page
    toast.info("Professional details coming soon!")
  }

  const handleStartOver = () => {
    setProjectData(null)
    setShowResults(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Bot className="h-8 w-8 text-blue-600" />
                AI Assistant
              </h1>
              <p className="text-gray-600">
                Get matched with perfect professionals for your project
              </p>
            </div>
          </div>
          
          {showResults && (
            <Button onClick={handleStartOver} variant="outline">
              Start New Project
            </Button>
          )}
        </div>

        {!showResults ? (
          /* AI Chat Interface */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <AIAssistant 
                onProjectExtracted={handleProjectExtracted}
                className="h-[700px]"
              />
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Describe Your Project</h4>
                        <p className="text-xs text-gray-600">
                          Tell our AI about your requirements, budget, and preferences
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">AI Analysis</h4>
                        <p className="text-xs text-gray-600">
                          Our AI extracts key information and generates visualizations
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Get Matched</h4>
                        <p className="text-xs text-gray-600">
                          Receive personalized professional recommendations
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        4
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Start Your Project</h4>
                        <p className="text-xs text-gray-600">
                          Choose professionals and begin with secure payments
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tips for Better Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Be specific about your project requirements</li>
                    <li>• Mention your budget range in Indonesian Rupiah</li>
                    <li>• Include your preferred style and timeline</li>
                    <li>• Describe the location and space size</li>
                    <li>• Upload reference images if you have any</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Project Results */
          <div className="max-w-4xl mx-auto">
            <ProjectResults
              data={projectData}
              onAddToCart={handleAddToCart}
              onViewDetails={handleViewDetails}
            />
          </div>
        )}
      </div>
    </div>
  )
}
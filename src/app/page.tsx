import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Bot, Users, Shield, Zap } from "lucide-react"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">Legia</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AI-powered professional services marketplace connecting clients with top contractors, 
            architects, and designers. Get fixed pricing, escrow protection, and intelligent matching.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/auth/signin">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Bot className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>AI Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Smart matching system that understands your project needs and connects you with the perfect professionals.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Escrow Protection</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Secure payment system with term-based releases. Your money is protected until work is completed.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Verified Professionals</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                All professionals go through KYC verification and maintain ratings based on completed projects.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle>Fixed Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                No bidding wars. Get transparent, fixed pricing for your projects with clear payment terms.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold">Describe Your Project</h3>
              <p className="text-gray-600">
                Chat with our AI assistant about your project requirements, budget, and timeline.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold">Get Matched</h3>
              <p className="text-gray-600">
                Our AI finds the best professionals based on location, budget, and ratings.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold">Start Your Project</h3>
              <p className="text-gray-600">
                Choose your professional, make secure payments, and track progress in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

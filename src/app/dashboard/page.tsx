import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import SignOutButton from "@/components/auth/signout-button"
import { CartButton } from "@/components/cart/cart-button"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session.user.name}!</p>
        </div>
        <div className="flex items-center gap-4">
          <CartButton />
          <SignOutButton />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Name:</strong> {session.user.name}</p>
              <p><strong>Email:</strong> {session.user.email}</p>
              <p><strong>Role:</strong> {session.user.role}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Assistant</CardTitle>
            <CardDescription>Get matched with professionals</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Use our AI-powered assistant to find the perfect professionals for your project.
            </p>
            <Button className="w-full" asChild>
              <Link href="/ai-assistant">Start AI Chat</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>View your active projects</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Track progress and communicate with professionals.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/projects">View Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
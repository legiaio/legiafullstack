"use client"

import { useState, Suspense } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/ui/icons"
import { toast } from "sonner"
import Link from "next/link"

function SignInContent() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("from") || "/dashboard"

  const handleSocialSignIn = async (provider: "google" | "apple") => {
    try {
      setIsLoading(provider)
      
      const result = await signIn(provider, {
        callbackUrl,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Authentication failed. Please try again.")
      } else if (result?.ok) {
        // Wait for session to be updated
        await getSession()
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (error) {
      console.error("Sign in error:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(null)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      setIsLoading("credentials")
      
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        callbackUrl,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Invalid email or password")
      } else if (result?.ok) {
        // Wait for session to be updated
        await getSession()
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (error) {
      console.error("Sign in error:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(null)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Welcome to Legia
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to access our AI-powered professional services marketplace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showEmailForm ? (
            <>
              {/* Social Login Buttons */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSocialSignIn("google")}
                disabled={isLoading !== null}
              >
                {isLoading === "google" ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icons.google className="mr-2 h-4 w-4" />
                )}
                Continue with Google
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSocialSignIn("apple")}
                disabled={isLoading !== null}
              >
                {isLoading === "apple" ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icons.apple className="mr-2 h-4 w-4" />
                )}
                Continue with Apple
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Email/Password Toggle */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowEmailForm(true)}
                disabled={isLoading !== null}
              >
                <Icons.mail className="mr-2 h-4 w-4" />
                Continue with Email
              </Button>
            </>
          ) : (
            <>
              {/* Email/Password Form */}
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading !== null}
                >
                  {isLoading === "credentials" ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              {/* Back to social login */}
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowEmailForm(false)}
                disabled={isLoading !== null}
              >
                Back to other options
              </Button>
            </>
          )}

          {/* Registration Link */}
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link href="/auth/register" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </div>

          <div className="text-center text-sm text-gray-600">
            By signing in, you agree to our{" "}
            <a href="/terms" className="underline hover:text-gray-900">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline hover:text-gray-900">
              Privacy Policy
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignInForm() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Welcome to Legia
            </CardTitle>
            <CardDescription className="text-center">
              Loading...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
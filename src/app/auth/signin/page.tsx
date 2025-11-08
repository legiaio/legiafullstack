import { Metadata } from "next"
import SignInForm from "@/components/auth/signin-form"

export const metadata: Metadata = {
  title: "Sign In | Legia",
  description: "Sign in to your Legia account",
}

export default function SignInPage() {
  return <SignInForm />
}
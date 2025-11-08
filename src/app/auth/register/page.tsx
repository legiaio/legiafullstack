import { Metadata } from "next"
import RegisterForm from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Register | Legia",
  description: "Create your Legia account",
}

export default function RegisterPage() {
  return <RegisterForm />
}
import { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import CheckoutPage from "@/components/checkout/checkout-page"

export const metadata: Metadata = {
  title: "Checkout | Legia",
  description: "Complete your order",
}

export default async function Checkout() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin?from=/checkout")
  }

  return <CheckoutPage />
}
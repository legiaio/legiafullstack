import { Metadata } from "next"
import CartPage from "@/components/cart/cart-page"

export const metadata: Metadata = {
  title: "Shopping Cart | Legia",
  description: "Review your selected professional services",
}

export default function Cart() {
  return <CartPage />
}
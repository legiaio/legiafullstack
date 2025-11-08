import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const paymentTermSchema = z.object({
  id: z.string(),
  name: z.string(),
  percentage: z.number().min(0).max(100),
  amount: z.number().min(0),
  description: z.string(),
})

const cartItemSchema = z.object({
  id: z.string(),
  professionalId: z.string(),
  professionalName: z.string(),
  portfolioId: z.string(),
  portfolioTitle: z.string(),
  portfolioPrice: z.number().min(0),
  portfolioImage: z.string().optional(),
  serviceType: z.string(),
  projectBrief: z.object({
    serviceType: z.string(),
    landArea: z.string(),
    budget: z.string(),
    location: z.string(),
    style: z.string(),
    timeline: z.string(),
    description: z.string(),
    generatedImage: z.string().optional(),
  }).optional(),
})

const createOrderSchema = z.object({
  items: z.array(cartItemSchema),
  shippingInfo: z.object({
    fullName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    province: z.string().min(1),
    postalCode: z.string().min(1),
    notes: z.string().optional(),
  }),
  paymentTerms: z.array(paymentTermSchema),
  pricing: z.object({
    subtotal: z.number().min(0),
    vat: z.number().min(0),
    transactionFee: z.number().min(0),
    total: z.number().min(0),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { items, shippingInfo, paymentTerms, pricing } = createOrderSchema.parse(body)

    // Validate payment terms total 100%
    const totalPercentage = paymentTerms.reduce((sum, term) => sum + term.percentage, 0)
    if (totalPercentage !== 100) {
      return NextResponse.json(
        { error: "Payment terms must total 100%" },
        { status: 400 }
      )
    }

    // Create order in database transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the main order
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          orderNumber: `ORD-${Date.now()}`,
          totalAmount: pricing.total,
          vatAmount: pricing.vat,
          feeAmount: pricing.transactionFee,
          paymentStatus: "PENDING",
          shippingAddress: {
            fullName: shippingInfo.fullName,
            email: shippingInfo.email,
            phone: shippingInfo.phone,
            address: shippingInfo.address,
            city: shippingInfo.city,
            province: shippingInfo.province,
            postalCode: shippingInfo.postalCode,
            notes: shippingInfo.notes,
          },
          paymentTerms: paymentTerms.length,
          termAmounts: paymentTerms.map(term => term.amount),
        }
      })

      // Create order items
      for (const item of items) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            professionalId: item.professionalId,
            portfolioId: item.portfolioId,
            portfolioTitle: item.portfolioTitle,
            portfolioPrice: item.portfolioPrice,
            portfolioImage: item.portfolioImage,
            serviceType: item.serviceType,
            projectBrief: item.projectBrief || undefined,
          }
        })
      }

      // Create payment terms
      for (const term of paymentTerms) {
        await tx.paymentTerm.create({
          data: {
            orderId: newOrder.id,
            name: term.name,
            percentage: term.percentage,
            amount: term.amount,
            description: term.description,
            status: "PENDING",
            sequence: parseInt(term.id),
          }
        })
      }

      // Create escrow entry
      await tx.escrow.create({
        data: {
          orderId: newOrder.id,
          totalAmount: pricing.total,
          heldAmount: pricing.total,
          status: "PENDING",
        }
      })

      return newOrder
    })

    return NextResponse.json({
      message: "Order created successfully",
      order: {
        id: order.id,
        status: order.paymentStatus,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Create order error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
import { z } from "zod"

// Enums
export const ServiceTypeSchema = z.enum([
  "CONTRACTOR",
  "ARCHITECT", 
  "INTERIOR_DESIGNER",
  "DESIGN_BUILD"
])

export const RoomStyleSchema = z.enum([
  "MODERN",
  "CLASSIC",
  "MINIMALIST",
  "INDUSTRIAL",
  "SCANDINAVIAN",
  "BOHEMIAN",
  "TRADITIONAL",
  "CONTEMPORARY"
])

export const UserRoleSchema = z.enum([
  "CLIENT",
  "PROFESSIONAL",
  "ADMIN",
  "FINANCE",
  "MODERATION"
])

export const ProjectStatusSchema = z.enum([
  "PENDING",
  "ACCEPTED",
  "CANCELLED",
  "IN_PROGRESS",
  "COMPLETED",
  "DISPUTED"
])

export const PaymentStatusSchema = z.enum([
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED"
])

export const PaymentGatewaySchema = z.enum([
  "MIDTRANS",
  "XENDIT",
  "TRIPAY"
])

export const KYCStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "INCOMPLETE"
])

// AI Assistant Project Brief Schema
export const ProjectBriefSchema = z.object({
  serviceType: ServiceTypeSchema,
  landArea: z.number().positive().optional(),
  jobDescription: z.string().min(10).max(2000),
  location: z.string().min(5).max(200),
  estimatedBudget: z.number().positive(),
  roomStyle: RoomStyleSchema,
  timeline: z.number().int().positive(),
  referenceImages: z.array(z.string().url()).optional(),
  additionalRequirements: z.string().max(1000).optional()
})

// User Registration/Update Schemas
export const UserUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(10).max(20).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  postalCode: z.string().max(10).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
})

// Professional Registration Schema
export const ProfessionalRegistrationSchema = z.object({
  businessName: z.string().min(2).max(200),
  description: z.string().min(50).max(2000),
  serviceTypes: z.array(ServiceTypeSchema).min(1),
  experience: z.number().int().min(0).max(50),
  minBudget: z.number().positive(),
  maxBudget: z.number().positive(),
  kycDocuments: z.object({
    businessLicense: z.string().url(),
    identityCard: z.string().url(),
    taxNumber: z.string().optional(),
    bankAccount: z.string().optional()
  })
}).refine(data => data.maxBudget > data.minBudget, {
  message: "Maximum budget must be greater than minimum budget",
  path: ["maxBudget"]
})

// Portfolio Schema
export const PortfolioSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(2000),
  serviceType: ServiceTypeSchema,
  roomStyle: RoomStyleSchema,
  images: z.array(z.string().url()).min(1).max(10),
  price: z.number().positive(),
  duration: z.number().int().positive(),
  features: z.array(z.string()).min(1).max(20)
})

// Order Schema
export const OrderSchema = z.object({
  portfolioIds: z.array(z.string()).min(1),
  projectId: z.string().optional(),
  shippingAddress: z.object({
    fullName: z.string().min(2).max(100),
    phone: z.string().min(10).max(20),
    address: z.string().min(10).max(500),
    city: z.string().min(2).max(100),
    province: z.string().min(2).max(100),
    postalCode: z.string().min(5).max(10)
  }),
  paymentTerms: z.number().int().min(1).max(12),
  termAmounts: z.array(z.number().positive()).optional(),
  paymentGateway: PaymentGatewaySchema
})

// Term Progress Schema
export const TermProgressSchema = z.object({
  termNumber: z.number().int().positive(),
  description: z.string().min(10).max(1000),
  documentation: z.array(z.string().url()).min(1).max(10)
})

// Review Schema
export const ReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
  images: z.array(z.string().url()).max(5).optional()
})

// Chat Message Schema
export const ChatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  attachments: z.array(z.string().url()).max(5).optional()
})

// Admin Settings Schema
export const AdminSettingsSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.any(),
  description: z.string().max(500).optional()
})

// Payment Gateway Config Schema
export const PaymentGatewayConfigSchema = z.object({
  gateway: PaymentGatewaySchema,
  isEnabled: z.boolean(),
  config: z.object({
    apiKey: z.string().optional(),
    secretKey: z.string().optional(),
    merchantId: z.string().optional(),
    isProduction: z.boolean().optional()
  })
})

// AI Model Config Schema
export const AIModelConfigSchema = z.object({
  provider: z.string().min(1).max(50),
  isActive: z.boolean(),
  config: z.object({
    apiKey: z.string(),
    model: z.string().optional(),
    endpoint: z.string().url().optional()
  })
})

// Search and Filter Schemas
export const ProfessionalSearchSchema = z.object({
  serviceType: ServiceTypeSchema.optional(),
  location: z.string().optional(),
  minBudget: z.number().positive().optional(),
  maxBudget: z.number().positive().optional(),
  minRating: z.number().min(0).max(5).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(50).default(10)
})

export const PortfolioSearchSchema = z.object({
  serviceType: ServiceTypeSchema.optional(),
  roomStyle: RoomStyleSchema.optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  professionalId: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(50).default(10)
})

// Types
export type ProjectBrief = z.infer<typeof ProjectBriefSchema>
export type UserUpdate = z.infer<typeof UserUpdateSchema>
export type ProfessionalRegistration = z.infer<typeof ProfessionalRegistrationSchema>
export type Portfolio = z.infer<typeof PortfolioSchema>
export type Order = z.infer<typeof OrderSchema>
export type TermProgress = z.infer<typeof TermProgressSchema>
export type Review = z.infer<typeof ReviewSchema>
export type ChatMessage = z.infer<typeof ChatMessageSchema>
export type AdminSettings = z.infer<typeof AdminSettingsSchema>
export type PaymentGatewayConfig = z.infer<typeof PaymentGatewayConfigSchema>
export type AIModelConfig = z.infer<typeof AIModelConfigSchema>
export type ProfessionalSearch = z.infer<typeof ProfessionalSearchSchema>
export type PortfolioSearch = z.infer<typeof PortfolioSearchSchema>
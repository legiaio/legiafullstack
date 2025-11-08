import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import { UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role || UserRole.CLIENT
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "apple") {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (!existingUser) {
            // Create new user with CLIENT role by default
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                image: user.image,
                role: UserRole.CLIENT,
                emailVerified: new Date(),
              }
            })
          }
          return true
        } catch (error) {
          console.error("Error during sign in:", error)
          return false
        }
      }
      return true
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  events: {
    async createUser({ user }) {
      // Send welcome notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Welcome to Legia!",
          message: "Thank you for joining our professional services marketplace. Start exploring our AI-powered matching system to find the perfect professionals for your projects.",
          type: "welcome",
        }
      })
    },
  },
}

// Middleware helper to check user roles
export const hasRole = (userRole: UserRole, allowedRoles: UserRole[]): boolean => {
  return allowedRoles.includes(userRole)
}

// Role hierarchy for admin access
export const isAdmin = (userRole: UserRole): boolean => {
  return hasRole(userRole, [UserRole.ADMIN])
}

export const isAdminOrModerator = (userRole: UserRole): boolean => {
  return hasRole(userRole, [UserRole.ADMIN, UserRole.MODERATION])
}

export const isAdminOrFinance = (userRole: UserRole): boolean => {
  return hasRole(userRole, [UserRole.ADMIN, UserRole.FINANCE])
}

export const isProfessional = (userRole: UserRole): boolean => {
  return hasRole(userRole, [UserRole.PROFESSIONAL])
}

export const isClient = (userRole: UserRole): boolean => {
  return hasRole(userRole, [UserRole.CLIENT])
}
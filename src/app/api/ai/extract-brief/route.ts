import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { geminiService } from "@/lib/ai/gemini"
import { imageGenerationService } from "@/lib/ai/image-generation"
import { professionalMatchingService } from "@/lib/services/professional-matching"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { chatHistory } = await req.json()

    if (!chatHistory || chatHistory.length === 0) {
      return NextResponse.json({ error: "Chat history is required" }, { status: 400 })
    }

    // Convert chat history to string
    const chatText = chatHistory
      .map((msg: any) => `${msg.role}: ${msg.content}`)
      .join('\n')

    // Extract project brief using Gemini
    const projectBrief = await geminiService.extractProjectBrief(chatText)

    // Generate project summary
    const projectSummary = await geminiService.generateProjectSummary(projectBrief)

    // Generate image visualization
    const imageResult = await imageGenerationService.generateProjectVisualization(projectBrief)

    // Find matching professionals
    const matchingProfessionals = await professionalMatchingService.findMatchingProfessionals(
      projectBrief,
      5
    )

    // Save project to database
    const project = await prisma.project.create({
      data: {
        clientId: session.user.id,
        serviceType: projectBrief.serviceType,
        landArea: projectBrief.landArea,
        jobDescription: projectBrief.jobDescription,
        location: projectBrief.location,
        estimatedBudget: projectBrief.estimatedBudget,
        roomStyle: projectBrief.roomStyle,
        timeline: projectBrief.timeline,
        referenceImages: projectBrief.referenceImages || [],
        aiGeneratedImage: imageResult.imageUrl,
        aiAnalysis: {
          projectSummary,
          imagePrompt: imageResult.prompt,
          extractedAt: new Date().toISOString(),
          chatHistory: chatHistory
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        projectId: project.id,
        projectBrief,
        projectSummary,
        generatedImage: {
          url: imageResult.imageUrl,
          prompt: imageResult.prompt
        },
        matchingProfessionals: matchingProfessionals.map(match => ({
          professional: {
            id: match.professional.id,
            businessName: match.professional.businessName,
            description: match.professional.description,
            rating: match.professional.rating,
            experience: match.professional.experience,
            completedProjects: match.professional.completedProjects,
            user: {
              name: match.professional.user.name,
              image: match.professional.user.image,
              city: match.professional.user.city
            },
            portfolios: match.professional.portfolios
          },
          matchScore: match.matchScore,
          distance: match.distance,
          reasonsForMatch: match.reasonsForMatch
        }))
      }
    })
  } catch (error) {
    console.error("Error extracting project brief:", error)
    return NextResponse.json(
      { error: "Failed to extract project information" },
      { status: 500 }
    )
  }
}
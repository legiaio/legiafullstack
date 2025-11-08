import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { geminiService } from "@/lib/ai/gemini"
import { streamText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, chatHistory, projectBrief } = await req.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Use Vercel AI SDK for streaming responses
    const result = await streamText({
      model: google("gemini-1.5-flash"),
      system: `
You are Legia AI, an intelligent assistant for a professional services marketplace in Indonesia.
You help clients find contractors, architects, interior designers, and design & build professionals.

Your role:
- Help clients describe their project requirements clearly
- Ask relevant follow-up questions to gather complete information
- Provide guidance on budgets, timelines, and project scope
- Be friendly, professional, and knowledgeable about construction and design

Key information to gather:
- Service type needed (Contractor, Architect, Interior Designer, Design & Build)
- Project location (city/area in Indonesia)
- Budget range (in Indonesian Rupiah - IDR)
- Timeline/deadline
- Design style preferences (Modern, Classic, Minimalist, etc.)
- Land/space area (in square meters)
- Specific requirements and features

Current context:
${projectBrief ? `Project Brief: ${JSON.stringify(projectBrief)}` : 'No project brief yet'}
${chatHistory ? `Chat History: ${chatHistory.join('\n')}` : ''}

Guidelines:
- Keep responses concise but informative
- Use Indonesian Rupiah (IDR) for budget discussions
- Ask one question at a time to avoid overwhelming the user
- When you have enough information, suggest moving forward with professional matching
- Be encouraging and supportive throughout the conversation
`,
      messages: [
        ...chatHistory.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      maxOutputTokens: 500,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Error in AI chat:", error)
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    )
  }
}
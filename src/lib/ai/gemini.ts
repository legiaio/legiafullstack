import { GoogleGenerativeAI } from "@google/generative-ai"
import { ProjectBriefSchema, type ProjectBrief } from "@/lib/validations"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
  private visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  async extractProjectBrief(chatHistory: string): Promise<ProjectBrief> {
    const prompt = `
You are an AI assistant for Legia, a professional services marketplace. 
Analyze the following chat conversation and extract structured project information.

Chat History:
${chatHistory}

Extract the following information and return it as a JSON object:
- serviceType: One of "CONTRACTOR", "ARCHITECT", "INTERIOR_DESIGNER", "DESIGN_BUILD"
- landArea: Number in square meters (if mentioned)
- jobDescription: Detailed description of the project
- location: Full address or city/area
- estimatedBudget: Budget amount in IDR
- roomStyle: One of "MODERN", "CLASSIC", "MINIMALIST", "INDUSTRIAL", "SCANDINAVIAN", "BOHEMIAN", "TRADITIONAL", "CONTEMPORARY"
- timeline: Project duration in days
- referenceImages: Array of image URLs (if any were uploaded)
- additionalRequirements: Any special requirements or notes

If information is not provided, make reasonable assumptions based on the context.
For budget, if a range is given, use the middle value.
For timeline, if not specified, estimate based on project type and scope.

Return only valid JSON that matches this schema:
{
  "serviceType": "CONTRACTOR",
  "landArea": 100,
  "jobDescription": "...",
  "location": "...",
  "estimatedBudget": 50000000,
  "roomStyle": "MODERN",
  "timeline": 30,
  "referenceImages": [],
  "additionalRequirements": "..."
}
`

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No JSON found in response")
      }

      const jsonData = JSON.parse(jsonMatch[0])
      
      // Validate with Zod schema
      const validatedData = ProjectBriefSchema.parse(jsonData)
      return validatedData
    } catch (error) {
      console.error("Error extracting project brief:", error)
      throw new Error("Failed to extract project information")
    }
  }

  async generateProjectSummary(projectBrief: ProjectBrief): Promise<string> {
    const prompt = `
Create a professional project summary based on this information:

Service Type: ${projectBrief.serviceType}
Location: ${projectBrief.location}
Budget: IDR ${projectBrief.estimatedBudget.toLocaleString()}
Timeline: ${projectBrief.timeline} days
Style: ${projectBrief.roomStyle}
${projectBrief.landArea ? `Land Area: ${projectBrief.landArea} sqm` : ''}

Description: ${projectBrief.jobDescription}
${projectBrief.additionalRequirements ? `Additional Requirements: ${projectBrief.additionalRequirements}` : ''}

Write a concise, professional summary (2-3 paragraphs) that would be suitable for presenting to potential professionals. 
Focus on key requirements, scope, and expectations.
`

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error("Error generating project summary:", error)
      throw new Error("Failed to generate project summary")
    }
  }

  async generateImagePrompt(projectBrief: ProjectBrief): Promise<string> {
    const prompt = `
Create a detailed text-to-image prompt for generating a visualization of this project:

Service Type: ${projectBrief.serviceType}
Style: ${projectBrief.roomStyle}
${projectBrief.landArea ? `Area: ${projectBrief.landArea} sqm` : ''}
Description: ${projectBrief.jobDescription}

Generate a detailed prompt for an AI image generator that would create a realistic visualization.
Include specific details about:
- Architectural style and design elements
- Color schemes and materials
- Lighting and atmosphere
- Spatial layout and proportions
- Any specific features mentioned in the description

Keep the prompt under 200 words and focus on visual elements that would help a client visualize the final result.
Return only the image generation prompt, no additional text.
`

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      return response.text().trim()
    } catch (error) {
      console.error("Error generating image prompt:", error)
      throw new Error("Failed to generate image prompt")
    }
  }

  async analyzeReferenceImages(imageUrls: string[]): Promise<string> {
    if (imageUrls.length === 0) return ""

    const prompt = `
Analyze these reference images and provide insights about:
- Design style and aesthetic preferences
- Color schemes and materials
- Architectural elements
- Overall mood and atmosphere
- Any specific features or details that stand out

Provide a concise analysis that would help match the client with appropriate professionals.
`

    try {
      // For now, return a placeholder since we need to implement image analysis
      // In a real implementation, you would process the images with the vision model
      return "Reference images analyzed - modern aesthetic with clean lines and neutral color palette detected."
    } catch (error) {
      console.error("Error analyzing reference images:", error)
      return ""
    }
  }

  async generateChatResponse(
    message: string, 
    context: {
      projectBrief?: Partial<ProjectBrief>
      chatHistory?: string[]
      userRole?: string
    }
  ): Promise<string> {
    const systemPrompt = `
You are Legia AI, an intelligent assistant for a professional services marketplace in Indonesia.
You help clients find contractors, architects, interior designers, and design & build professionals.

Your role:
- Help clients describe their project requirements clearly
- Ask relevant follow-up questions to gather complete information
- Provide guidance on budgets, timelines, and project scope
- Be friendly, professional, and knowledgeable about construction and design

Key information to gather:
- Service type needed
- Project location
- Budget range
- Timeline/deadline
- Design style preferences
- Land/space area
- Specific requirements

Current context:
${context.projectBrief ? `Project Brief: ${JSON.stringify(context.projectBrief)}` : 'No project brief yet'}
${context.chatHistory ? `Chat History: ${context.chatHistory.join('\n')}` : ''}

Respond in a helpful, conversational manner. If you have enough information, suggest moving forward with professional matching.
Keep responses concise but informative. Use Indonesian Rupiah (IDR) for budget discussions.
`

    try {
      const result = await this.model.generateContent([
        { text: systemPrompt },
        { text: `User message: ${message}` }
      ])
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error("Error generating chat response:", error)
      throw new Error("Failed to generate response")
    }
  }
}

export const geminiService = new GeminiService()
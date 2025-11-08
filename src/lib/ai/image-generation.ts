import { ProjectBrief } from "@/lib/validations"

export interface ImageGenerationResult {
  imageUrl: string
  prompt: string
  model: string
}

export class ImageGenerationService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || ""
    this.baseUrl = "https://api.openai.com/v1"
  }

  async generateProjectVisualization(
    projectBrief: ProjectBrief,
    customPrompt?: string
  ): Promise<ImageGenerationResult> {
    const prompt = customPrompt || this.buildPromptFromBrief(projectBrief)

    try {
      // Using OpenAI DALL-E for image generation
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          style: "natural"
        }),
      })

      if (!response.ok) {
        throw new Error(`Image generation failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.data || data.data.length === 0) {
        throw new Error("No image generated")
      }

      return {
        imageUrl: data.data[0].url,
        prompt: prompt,
        model: "dall-e-3"
      }
    } catch (error) {
      console.error("Error generating image:", error)
      
      // Fallback to placeholder image
      return {
        imageUrl: this.generatePlaceholderImage(projectBrief),
        prompt: prompt,
        model: "placeholder"
      }
    }
  }

  private buildPromptFromBrief(projectBrief: ProjectBrief): string {
    const styleMap = {
      MODERN: "modern, minimalist, clean lines, contemporary",
      CLASSIC: "classic, traditional, elegant, timeless",
      MINIMALIST: "minimalist, simple, clean, uncluttered",
      INDUSTRIAL: "industrial, raw materials, exposed brick, metal",
      SCANDINAVIAN: "scandinavian, light wood, cozy, hygge",
      BOHEMIAN: "bohemian, eclectic, colorful, artistic",
      TRADITIONAL: "traditional, ornate, detailed, heritage",
      CONTEMPORARY: "contemporary, current, stylish, trendy"
    }

    const serviceMap = {
      CONTRACTOR: "construction site, building renovation",
      ARCHITECT: "architectural design, building exterior",
      INTERIOR_DESIGNER: "interior space, room design",
      DESIGN_BUILD: "complete building project, exterior and interior"
    }

    const styleKeywords = styleMap[projectBrief.roomStyle] || "modern"
    const serviceContext = serviceMap[projectBrief.serviceType] || "interior space"

    let prompt = `Professional ${serviceContext} in ${styleKeywords} style. `
    
    if (projectBrief.landArea) {
      prompt += `Space area approximately ${projectBrief.landArea} square meters. `
    }

    // Add specific elements from job description
    const description = projectBrief.jobDescription.toLowerCase()
    if (description.includes("kitchen")) prompt += "Modern kitchen design. "
    if (description.includes("bedroom")) prompt += "Comfortable bedroom space. "
    if (description.includes("living")) prompt += "Spacious living area. "
    if (description.includes("bathroom")) prompt += "Elegant bathroom design. "
    if (description.includes("office")) prompt += "Professional office space. "

    prompt += `High quality architectural visualization, professional lighting, realistic materials, detailed textures. `
    prompt += `Indonesian residential context, tropical climate considerations. `
    prompt += `Photorealistic rendering, interior design magazine quality.`

    return prompt
  }

  private generatePlaceholderImage(projectBrief: ProjectBrief): string {
    // Generate a placeholder image URL based on project type and style
    const width = 1024
    const height = 1024
    const backgroundColor = this.getStyleColor(projectBrief.roomStyle)
    const text = `${projectBrief.serviceType} - ${projectBrief.roomStyle}`
    
    return `https://via.placeholder.com/${width}x${height}/${backgroundColor}/ffffff?text=${encodeURIComponent(text)}`
  }

  private getStyleColor(style: string): string {
    const colorMap = {
      MODERN: "2563eb",
      CLASSIC: "92400e", 
      MINIMALIST: "6b7280",
      INDUSTRIAL: "374151",
      SCANDINAVIAN: "f59e0b",
      BOHEMIAN: "dc2626",
      TRADITIONAL: "059669",
      CONTEMPORARY: "7c3aed"
    }
    return colorMap[style as keyof typeof colorMap] || "6b7280"
  }

  async generateMultipleOptions(
    projectBrief: ProjectBrief,
    count: number = 3
  ): Promise<ImageGenerationResult[]> {
    const basePrompt = this.buildPromptFromBrief(projectBrief)
    const variations = [
      basePrompt + " Daytime natural lighting.",
      basePrompt + " Evening ambient lighting.",
      basePrompt + " Different angle perspective."
    ]

    const promises = variations.slice(0, count).map(prompt =>
      this.generateProjectVisualization(projectBrief, prompt)
    )

    try {
      return await Promise.all(promises)
    } catch (error) {
      console.error("Error generating multiple images:", error)
      // Return at least one placeholder
      return [await this.generateProjectVisualization(projectBrief)]
    }
  }
}

export const imageGenerationService = new ImageGenerationService()
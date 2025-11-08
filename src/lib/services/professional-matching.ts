import { prisma } from "@/lib/prisma"
import { ProjectBrief } from "@/lib/validations"
import { Professional, Portfolio, User } from "@prisma/client"

export interface ProfessionalMatch {
  professional: Professional & {
    user: User
    portfolios: Portfolio[]
    _count: {
      reviews: number
    }
  }
  matchScore: number
  distance?: number
  reasonsForMatch: string[]
}

export interface MatchingCriteria {
  serviceType: string
  location: string
  budget: number
  latitude?: number
  longitude?: number
  roomStyle?: string
}

export class ProfessionalMatchingService {
  async findMatchingProfessionals(
    projectBrief: ProjectBrief,
    limit: number = 5
  ): Promise<ProfessionalMatch[]> {
    try {
      // First, get all professionals that match the service type and budget range
      const professionals = await prisma.professional.findMany({
        where: {
          serviceTypes: {
            has: projectBrief.serviceType
          },
          minBudget: {
            lte: projectBrief.estimatedBudget
          },
          maxBudget: {
            gte: projectBrief.estimatedBudget
          },
          isActive: true,
          isVerified: true,
          kycStatus: "APPROVED"
        },
        include: {
          user: true,
          portfolios: {
            where: {
              isActive: true,
              serviceType: projectBrief.serviceType
            },
            take: 3
          },
          _count: {
            select: {
              reviews: true
            }
          }
        }
      })

      // Calculate match scores and distances
      const matches: ProfessionalMatch[] = []

      for (const professional of professionals) {
        const matchScore = await this.calculateMatchScore(professional, projectBrief)
        const distance = await this.calculateDistance(
          professional.user,
          projectBrief.location
        )
        const reasonsForMatch = this.generateMatchReasons(professional, projectBrief)

        matches.push({
          professional,
          matchScore,
          distance,
          reasonsForMatch
        })
      }

      // Sort by match score (descending) and distance (ascending)
      matches.sort((a, b) => {
        if (Math.abs(a.matchScore - b.matchScore) < 0.1) {
          // If match scores are very close, prioritize by distance
          return (a.distance || Infinity) - (b.distance || Infinity)
        }
        return b.matchScore - a.matchScore
      })

      return matches.slice(0, limit)
    } catch (error) {
      console.error("Error finding matching professionals:", error)
      throw new Error("Failed to find matching professionals")
    }
  }

  private async calculateMatchScore(
    professional: Professional & {
      user: User
      portfolios: Portfolio[]
      _count: { reviews: number }
    },
    projectBrief: ProjectBrief
  ): Promise<number> {
    let score = 0

    // Service type match (base requirement - already filtered)
    score += 20

    // Budget compatibility (0-25 points)
    const budgetScore = this.calculateBudgetScore(
      professional.minBudget,
      professional.maxBudget,
      projectBrief.estimatedBudget
    )
    score += budgetScore

    // Rating score (0-20 points)
    const ratingScore = (professional.rating / 5) * 20
    score += ratingScore

    // Experience score (0-15 points)
    const experienceScore = Math.min(professional.experience / 10, 1) * 15
    score += experienceScore

    // Portfolio relevance (0-10 points)
    const portfolioScore = this.calculatePortfolioScore(
      professional.portfolios,
      projectBrief
    )
    score += portfolioScore

    // Completed projects bonus (0-10 points)
    const completedScore = Math.min(professional.completedProjects / 50, 1) * 10
    score += completedScore

    return Math.min(score, 100) // Cap at 100
  }

  private calculateBudgetScore(
    minBudget: any,
    maxBudget: any,
    projectBudget: number
  ): number {
    const min = Number(minBudget)
    const max = Number(maxBudget)

    if (projectBudget >= min && projectBudget <= max) {
      return 25 // Perfect match
    }

    // Calculate how far outside the range
    const distanceFromRange = projectBudget < min 
      ? min - projectBudget 
      : projectBudget - max

    const rangeSize = max - min
    const relativeDistance = distanceFromRange / rangeSize

    // Reduce score based on distance from range
    return Math.max(0, 25 - (relativeDistance * 25))
  }

  private calculatePortfolioScore(
    portfolios: Portfolio[],
    projectBrief: ProjectBrief
  ): number {
    if (portfolios.length === 0) return 0

    let score = 0
    let relevantPortfolios = 0

    for (const portfolio of portfolios) {
      let portfolioScore = 0

      // Service type match
      if (portfolio.serviceType === projectBrief.serviceType) {
        portfolioScore += 3
      }

      // Room style match
      if (portfolio.roomStyle === projectBrief.roomStyle) {
        portfolioScore += 3
      }

      // Price range compatibility
      const portfolioPrice = Number(portfolio.price)
      if (Math.abs(portfolioPrice - projectBrief.estimatedBudget) / projectBrief.estimatedBudget < 0.5) {
        portfolioScore += 2
      }

      // Features relevance (basic keyword matching)
      const projectKeywords = projectBrief.jobDescription.toLowerCase().split(' ')
      const portfolioKeywords = [
        ...portfolio.features.map(f => f.toLowerCase()),
        portfolio.description.toLowerCase()
      ].join(' ')

      const matchingKeywords = projectKeywords.filter(keyword => 
        keyword.length > 3 && portfolioKeywords.includes(keyword)
      )

      portfolioScore += Math.min(matchingKeywords.length, 2)

      if (portfolioScore > 0) {
        score += portfolioScore
        relevantPortfolios++
      }
    }

    return relevantPortfolios > 0 ? Math.min(score / relevantPortfolios, 10) : 0
  }

  private async calculateDistance(
    professionalUser: User,
    projectLocation: string
  ): Promise<number | undefined> {
    // For now, return undefined since we don't have geocoding implemented
    // In a real implementation, you would:
    // 1. Geocode the project location to get lat/lng
    // 2. Calculate distance using the professional's lat/lng
    // 3. Use PostGIS functions for accurate distance calculation
    
    return undefined
  }

  private generateMatchReasons(
    professional: Professional & {
      user: User
      portfolios: Portfolio[]
      _count: { reviews: number }
    },
    projectBrief: ProjectBrief
  ): string[] {
    const reasons: string[] = []

    // High rating
    if (professional.rating >= 4.5) {
      reasons.push(`Excellent rating (${professional.rating.toFixed(1)}/5.0)`)
    } else if (professional.rating >= 4.0) {
      reasons.push(`High rating (${professional.rating.toFixed(1)}/5.0)`)
    }

    // Experience
    if (professional.experience >= 10) {
      reasons.push(`${professional.experience}+ years of experience`)
    } else if (professional.experience >= 5) {
      reasons.push(`${professional.experience} years of experience`)
    }

    // Completed projects
    if (professional.completedProjects >= 50) {
      reasons.push(`${professional.completedProjects}+ completed projects`)
    } else if (professional.completedProjects >= 20) {
      reasons.push(`${professional.completedProjects} completed projects`)
    }

    // Budget compatibility
    const minBudget = Number(professional.minBudget)
    const maxBudget = Number(professional.maxBudget)
    if (projectBrief.estimatedBudget >= minBudget && projectBrief.estimatedBudget <= maxBudget) {
      reasons.push("Budget perfectly matches your range")
    }

    // Portfolio relevance
    const relevantPortfolios = professional.portfolios.filter(p => 
      p.serviceType === projectBrief.serviceType || 
      p.roomStyle === projectBrief.roomStyle
    )
    if (relevantPortfolios.length > 0) {
      reasons.push(`${relevantPortfolios.length} relevant portfolio${relevantPortfolios.length > 1 ? 's' : ''}`)
    }

    // Service specialization
    if (professional.serviceTypes.length === 1) {
      reasons.push(`Specialized in ${professional.serviceTypes[0].toLowerCase().replace('_', ' ')}`)
    }

    return reasons.slice(0, 3) // Limit to top 3 reasons
  }

  async getDetailedProfessionalInfo(professionalId: string) {
    return await prisma.professional.findUnique({
      where: { id: professionalId },
      include: {
        user: true,
        portfolios: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                image: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            reviews: true,
            projects: true
          }
        }
      }
    })
  }
}

export const professionalMatchingService = new ProfessionalMatchingService()
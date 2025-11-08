import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateProjectRequest, ProjectFilters } from '@/types/project';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const clientId = searchParams.get('clientId');
    const professionalId = searchParams.get('professionalId');

    const where: any = {};

    // Filter by user role
    if (session.user.role === 'CLIENT') {
      where.clientId = session.user.id;
    } else if (session.user.role === 'PROFESSIONAL') {
      where.professionalId = session.user.id;
    }

    // Apply additional filters
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (clientId) where.clientId = clientId;
    if (professionalId) where.professionalId = professionalId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const projects = await prisma.projectManagement.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, email: true, image: true }
        },
        professional: {
          select: { id: true, name: true, email: true, image: true }
        },
        service: {
          select: { id: true, title: true, category: true }
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, image: true }
            }
          }
        },
        milestones: true,
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, image: true, role: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        files: {
          include: {
            uploadedBy: {
              select: { id: true, name: true, image: true }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: CreateProjectRequest = await request.json();

    // Validate required fields
    if (!data.title || !data.description || !data.serviceId || !data.budget) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create project with milestones
    const project = await prisma.projectManagement.create({
      data: {
        title: data.title,
        description: data.description,
        budget: data.budget,
        currency: data.currency || 'IDR',
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        priority: data.priority,
        clientId: session.user.id,
        serviceId: data.serviceId,
        milestones: {
          create: data.milestones.map((milestone, index) => ({
            title: milestone.title,
            description: milestone.description,
            amount: milestone.amount,
            dueDate: new Date(milestone.dueDate)
          }))
        }
      },
      include: {
        client: {
          select: { id: true, name: true, email: true, image: true }
        },
        service: {
          select: { id: true, title: true, category: true }
        },
        milestones: true,
        tasks: true,
        messages: true,
        files: true
      }
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
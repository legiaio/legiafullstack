import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateTaskRequest } from '@/types/project';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check project access
    const project = await prisma.projectManagement.findUnique({
      where: { id },
      select: { clientId: true, professionalId: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const hasAccess = 
      project.clientId === session.user.id ||
      project.professionalId === session.user.id ||
      session.user.role === 'ADMIN';

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const tasks = await prisma.projectTask.findMany({
      where: { projectId: id },
      include: {
        assignee: {
          select: { id: true, name: true, image: true }
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, image: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: CreateTaskRequest = await request.json();

    // Check project access
    const project = await prisma.projectManagement.findUnique({
      where: { id },
      select: { clientId: true, professionalId: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const hasAccess = 
      project.clientId === session.user.id ||
      project.professionalId === session.user.id ||
      session.user.role === 'ADMIN';

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate required fields
    if (!data.title) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    const task = await prisma.projectTask.create({
      data: {
        projectId: id,
        title: data.title,
        description: data.description,
        priority: data.priority,
        assignedTo: data.assignedTo,
        dueDate: data.dueDate ? new Date(data.dueDate) : null
      },
      include: {
        assignee: {
          select: { id: true, name: true, image: true }
        },
        comments: true
      }
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
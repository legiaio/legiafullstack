import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UpdateProjectRequest } from '@/types/project';

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

    const project = await prisma.projectManagement.findUnique({
      where: { id },
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
        },
        milestones: {
          orderBy: { dueDate: 'asc' }
        },
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, image: true, role: true }
            },
            attachments: true
          },
          orderBy: { createdAt: 'desc' }
        },
        files: {
          include: {
            uploadedBy: {
              select: { id: true, name: true, image: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check access permissions
    const hasAccess = 
      project.clientId === session.user.id ||
      project.professionalId === session.user.id ||
      session.user.role === 'ADMIN';

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: UpdateProjectRequest = await request.json();

    // Check if project exists and user has access
    const existingProject = await prisma.projectManagement.findUnique({
      where: { id },
      select: { clientId: true, professionalId: true }
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const hasAccess = 
      existingProject.clientId === session.user.id ||
      existingProject.professionalId === session.user.id ||
      session.user.role === 'ADMIN';

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update project
    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.status) updateData.status = data.status;
    if (data.priority) updateData.priority = data.priority;
    if (data.budget) updateData.budget = data.budget;
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    const project = await prisma.projectManagement.update({
      where: { id },
      data: updateData,
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
        tasks: true,
        milestones: true,
        messages: true,
        files: true
      }
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if project exists and user has access
    const existingProject = await prisma.projectManagement.findUnique({
      where: { id },
      select: { clientId: true, professionalId: true }
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const hasAccess = 
      existingProject.clientId === session.user.id ||
      session.user.role === 'ADMIN';

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await prisma.projectManagement.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
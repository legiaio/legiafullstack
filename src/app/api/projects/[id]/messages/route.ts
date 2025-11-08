import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SendMessageRequest } from '@/types/project';

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

    const messages = await prisma.projectMessage.findMany({
      where: { projectId: id },
      include: {
        sender: {
          select: { id: true, name: true, image: true, role: true }
        },
        attachments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
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

    const data: SendMessageRequest = await request.json();

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
    if (!data.content) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const message = await prisma.projectMessage.create({
      data: {
        projectId: id,
        senderId: session.user.id,
        content: data.content,
        type: data.type || 'TEXT'
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true, role: true }
        },
        attachments: true
      }
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
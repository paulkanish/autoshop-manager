import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const notes = await prisma.note.findMany({
    where: { appointmentId: id },
    orderBy: { createdAt: 'asc' },
    include: {
      author: {
        select: { id: true, name: true, role: true },
      },
    },
  });

  return NextResponse.json({ notes });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const text = typeof body?.text === 'string' ? body.text.trim() : '';

  if (!text) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  }

  const note = await prisma.note.create({
    data: {
      appointmentId: id,
      authorId: session.user.id,
      text,
    },
    include: {
      author: {
        select: { id: true, name: true, role: true },
      },
    },
  });

  return NextResponse.json({ note }, { status: 201 });
}

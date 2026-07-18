import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth'; 

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { appointmentId, text } = await request.json();

    if (!appointmentId || !text.trim()) {
      return NextResponse.json({ error: 'Appointment ID and note text are required' }, { status: 400 });
    }

    // Create the note in the database
    const newNote = await prisma.note.create({
      data: {
        text: text.trim(),
        appointmentId,
        authorId: session.user.id,
      },
      include: {
        author: true, // Return author info so the UI can display it immediately
      },
    });

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error('Error adding note:', error);
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, JobStatus } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Check if user is logged in
  const session = await auth();
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Await the params to get the id
  const { id } = await params;

  // 3. Get the new status and optional note from the request body
  const body = await request.json();
  const { newStatus, note } = body;

  // 4. Validate the status against our Prisma Enum
  if (!Object.values(JobStatus).includes(newStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // 5. Enforce mandatory note for WAITING_ON_PARTS
  if (newStatus === 'WAITING_ON_PARTS' && (!note || note.trim() === '')) {
    return NextResponse.json({ error: 'A note specifying the required parts is mandatory.' }, { status: 400 });
  }

  // 6. Update the appointment in the database
  try {
    // Use a transaction to update the status and create the note simultaneously
    const result = await prisma.$transaction(async (tx) => {
      // Update the appointment status
      const updatedJob = await tx.appointment.update({
        where: { id },
        data: { status: newStatus as JobStatus },
      });

      // If a note was provided, create it
      if (note && note.trim() !== '') {
        await tx.note.create({
          data: {
            appointmentId: id,
            authorId: (session.user as any).id,
            text: `STATUS CHANGE TO WAITING ON PARTS: ${note.trim()}`,
          },
        });
      }

      return updatedJob;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

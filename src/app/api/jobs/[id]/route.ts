import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, JobStatus } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { newStatus, note, completionData } = body;

  if (!Object.values(JobStatus).includes(newStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  if (newStatus === 'WAITING_ON_PARTS' && (!note || note.trim() === '')) {
    return NextResponse.json({ error: 'A note specifying the required parts is mandatory.' }, { status: 400 });
  }

  // Validate Completion Data if moving to COMPLETED
  if (newStatus === 'COMPLETED') {
    if (!completionData || !completionData.laborHours || !completionData.laborRate) {
      return NextResponse.json({ error: 'Labor hours and rate are required to complete a job.' }, { status: 400 });
    }
    if (parseFloat(completionData.laborHours) <= 0 || parseFloat(completionData.laborRate) <= 0) {
      return NextResponse.json({ error: 'Labor hours and rate must be greater than 0.' }, { status: 400 });
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the appointment status
      const updatedJob = await tx.appointment.update({
        where: { id },
        data: { status: newStatus as JobStatus },
      });

      // 2. Create the Note if moving to WAITING_ON_PARTS
      if (note && note.trim() !== '' && newStatus === 'WAITING_ON_PARTS') {
        await tx.note.create({
          data: {
            appointmentId: id,
            authorId: (session.user as any).id,
            text: `STATUS CHANGE TO WAITING ON PARTS: ${note.trim()}`,
          },
        });
      }

      // 3. Create Service Record and Part Logs if moving to COMPLETED
      if (newStatus === 'COMPLETED' && completionData) {
        const laborHours = parseFloat(completionData.laborHours);
        const laborRate = parseFloat(completionData.laborRate);
        
        // Calculate parts total safely
        const validParts = (completionData.parts || []).filter((p: any) => p.partName && p.partName.trim() !== '');
        const partsTotal = validParts.reduce((sum: number, p: any) => {
          return sum + ((parseInt(p.quantity, 10) || 1) * (parseFloat(p.unitCost) || 0));
        }, 0);
        
        const totalCost = (laborHours * laborRate) + partsTotal;

        const serviceRecord = await tx.serviceRecord.create({
          data: {
            appointmentId: id,
            mechanicId: (session.user as any).id,
            laborHours,
            laborRate,
            totalCost,
            notes: completionData.notes || null,
            completedAt: new Date(),
          },
        });

        // Bulk create PartLogs
        if (validParts.length > 0) {
          await tx.partLog.createMany({
            data: validParts.map((p: any) => ({
              serviceRecordId: serviceRecord.id,
              partName: p.partName.trim(),
              quantity: parseInt(p.quantity, 10) || 1,
              unitCost: parseFloat(p.unitCost) || 0,
            })),
          });
        }
      }

      return updatedJob;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

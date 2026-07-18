import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Priority, JobStatus } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role === 'MECHANIC') {
    return NextResponse.json({ error: 'Forbidden: Admins/Owners only' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { firstName, lastName, phone, registration, make, model, issueDescription, priority, mechanicId } = body;

    // 1. Upsert Customer (find by phone, or create)
    const customer = await prisma.customer.upsert({
      where: { phone },
      update: { firstName, lastName }, // Update name if they changed it
      create: { firstName, lastName, phone },
    });

    // 2. Upsert Vehicle (find by registration, or create)
    const vehicle = await prisma.vehicle.upsert({
      where: { registration },
      update: { customerId: customer.id, make, model }, // Ensure it's linked to this customer
      create: { registration, make, model, customerId: customer.id },
    });

    // 3. Create the Appointment (Walk-in = Immediate, so scheduledDateTime is now)
    const appointment = await prisma.appointment.create({
      data: {
        customerId: customer.id,
        vehicleId: vehicle.id,
        mechanicId: mechanicId || null,
        requestedService: issueDescription,
        priority: priority as Priority,
        status: JobStatus.SCHEDULED, // Goes to "To Do" column
        scheduledDateTime: new Date(),
      },
    });

    return NextResponse.json({ success: true, appointmentId: appointment.id });
  } catch (error) {
    console.error('Walk-in creation error:', error);
    return NextResponse.json({ error: 'Failed to create walk-in job' }, { status: 500 });
  }
}

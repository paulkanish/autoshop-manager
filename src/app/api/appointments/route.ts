import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth'; // Adjust path if your auth file is elsewhere

const prisma = new PrismaClient();

// GET: Fetch jobs for the logged-in mechanic
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch appointments assigned to this mechanic
    const appointments = await prisma.appointment.findMany({
      where: {
        mechanicId: session.user.id,
        deletedAt: null, // Ignore soft-deleted records
      },
      include: {
        vehicle: true, // Get car details (make, model, plate)
        customer: true, // Get customer details (name, phone)
        notes: {
          include: { author: true }, //get the mechanic's name
          orderBy: { createdAt: 'desc' } //show newest nots first
        }
      },
      orderBy: [
        { scheduledDateTime: 'asc' }, // Sort by time
      ],
    });

    return NextResponse.json(appointments, { status: 200 });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

// PATCH: Update the status of a specific appointment
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Appointment ID and Status are required' }, { status: 400 });
    }

    // Update the appointment status
    const updatedAppointment = await prisma.appointment.update({
      where: {
        id: id,
        mechanicId: session.user.id // Ensure they can only update their own jobs
      },
      data: {
        status: status
      },
      include: {
        vehicle: true,
        customer: true,
      }
    });

    return NextResponse.json(updatedAppointment, { status: 200 });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}


// POST: Create a new appointment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Admins and Owners can create appointments
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { customerId, vehicleId, mechanicId, scheduledDateTime, requestedService, estimatedDuration, priority } = body;

    if (!customerId || !vehicleId || !requestedService) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        customerId,
        vehicleId,
        mechanicId: mechanicId || null, // Optional assignment
        scheduledDateTime: scheduledDateTime ? new Date(scheduledDateTime) : null,
        requestedService,
        estimatedDuration: estimatedDuration || null,
        priority: priority || 'ROUTINE',
        status: 'SCHEDULED',
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { PrismaClient, Priority } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  // 1. Check if user is logged in
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Fetch appointments from the database
  const jobs = await prisma.appointment.findMany({
    include: {
      customer: { select: { firstName: true, lastName: true, phone: true } },
      vehicle: { select: { registration: true, make: true, model: true } },
      mechanic: { select: { name: true } },
    },
    orderBy: [
      // Sort by Priority: Critical (2) -> High (1) -> Routine (0)
      { priority: 'desc' },
      // Then by creation date (oldest first)
      { createdAt: 'asc' },
    ],
  });

  return NextResponse.json(jobs);
}

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const registration = request.nextUrl.searchParams.get('registration');
  if (!registration || registration.trim() === '') {
    return NextResponse.json({ vehicle: null });
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      registration: {
        equals: registration.trim(),
        mode: 'insensitive',
      },
    },
    include: {
      customer: true,
    },
  });

  if (!vehicle) {
    return NextResponse.json({ vehicle: null });
  }

  return NextResponse.json({
    vehicle: {
      registration: vehicle.registration,
      make: vehicle.make,
      model: vehicle.model,
      customer: {
        firstName: vehicle.customer.firstName,
        lastName: vehicle.customer.lastName,
        phone: vehicle.customer.phone,
      },
    },
  });
}

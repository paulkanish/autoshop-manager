import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  // 1. Check Authentication
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Get Search Query
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.trim() === '') {
    return NextResponse.json([]);
  }

  const searchTerm = query.trim();

  try {
    // 3. Search Vehicles by Registration OR Customer Phone
    const vehicles = await prisma.vehicle.findMany({
      where: {
        OR: [
          { 
            registration: { 
              contains: searchTerm,
              mode: 'insensitive' 
            } 
          },
          { 
            customer: { 
              phone: { 
                contains: searchTerm,
                mode: 'insensitive' 
              } 
            } 
          },
        ],
      },
      include: {
        customer: true,
        appointments: {
          include: {
            mechanic: { select: { name: true } },
            serviceRecord: {
              include: {
                partsUsed: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    // 4. Aggregate "Parts Previously Used" for each vehicle
    const results = vehicles.map((vehicle) => {
      const partMap = new Map<
        string,
        { name: string; count: number; lastUsed: Date; lastCost: number }
      >();

      vehicle.appointments.forEach((appt) => {
        if (appt.serviceRecord) {
          appt.serviceRecord.partsUsed.forEach((part) => {
            if (partMap.has(part.partName)) {
              const existing = partMap.get(part.partName)!;
              existing.count += part.quantity;
              existing.lastUsed = appt.createdAt;
              existing.lastCost = part.unitCost;
            } else {
              partMap.set(part.partName, {
                name: part.partName,
                count: part.quantity,
                lastUsed: appt.createdAt,
                lastCost: part.unitCost,
              });
            }
          });
        }
      });

      return {
        ...vehicle,
        aggregatedParts: Array.from(partMap.values()),
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Vehicle search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

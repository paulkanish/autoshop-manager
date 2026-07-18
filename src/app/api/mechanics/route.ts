import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch all users who are mechanics (or admins/owners who might also work on cars)
  const mechanics = await prisma.user.findMany({
    where: {
      role: { in: ['MECHANIC', 'ADMIN', 'OWNER'] },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      role: true,
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(mechanics);
}

import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();
const VALID_ROLES = ['ADMIN', 'MECHANIC', 'OWNER'] as const;
type Role = (typeof VALID_ROLES)[number];

// GET /api/users?role=MECHANIC  — list active users (Admin only)
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const roleFilter = new URL(request.url).searchParams.get('role');
  const where: Prisma.UserWhereInput = { deletedAt: null };
  if (roleFilter && (VALID_ROLES as readonly string[]).includes(roleFilter)) {
    where.role = roleFilter as Role;
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ users });
}

// POST /api/users — create a user with a role (Admin only)
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const { name, email, password, role } = body ?? {};

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? ''))
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  if (typeof password !== 'string' || password.length < 8)
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  if (!(VALID_ROLES as readonly string[]).includes(role))
    return NextResponse.json({ error: 'Role must be ADMIN, MECHANIC, or OWNER.' }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });

  const user = await prisma.user.create({
    data: { name: name.trim(), email, passwordHash: await bcrypt.hash(password, 10), role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return NextResponse.json({ user }, { status: 201 });
}

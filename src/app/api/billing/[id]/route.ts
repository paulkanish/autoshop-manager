import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, PaymentStatus } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { paymentStatus } = await request.json();

  if (!Object.values(PaymentStatus).includes(paymentStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  try {
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { 
        paymentStatus: paymentStatus as PaymentStatus,
        paymentDate: paymentStatus === 'PAID' ? new Date() : null,
      },
    });
    return NextResponse.json(updatedInvoice);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

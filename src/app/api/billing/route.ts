import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, PaymentStatus } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// GET: Fetch pending invoices (Completed jobs with Service Records but no Invoice)
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 1. Fetch ALL completed jobs that have a service record
  const allCompletedJobs = await prisma.appointment.findMany({
    where: {
      status: 'COMPLETED',
      serviceRecord: {
        isNot: null,
      },
    },
    include: {
      customer: true,
      vehicle: true,
      serviceRecord: { 
        include: { 
          partsUsed: true,
          invoice: true // We include this relation so we can check it in JS
        } 
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // 2. Filter in JavaScript: Keep ONLY the ones that DO NOT have an invoice yet
  const pendingJobs = allCompletedJobs.filter(job => !job.serviceRecord?.invoice);

  // 3. Fetch existing invoices for the history table
  const invoices = await prisma.invoice.findMany({
    include: {
      serviceRecord: {
        include: {
          appointment: { include: { customer: true, vehicle: true } },
          partsUsed: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ pendingJobs, invoices });
}

// POST: Generate an Invoice for a pending job
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role === 'MECHANIC') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { appointmentId } = await request.json();

  try {
    // 1. Get the appointment and its service record
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { serviceRecord: { include: { partsUsed: true } } },
    });

    if (!appointment || !appointment.serviceRecord) {
      throw new Error('Invalid appointment or missing service record');
    }

    const sr = appointment.serviceRecord;

    // 2. Calculate Totals
    const laborTotal = sr.laborHours * sr.laborRate;
    const partsTotal = sr.partsUsed.reduce((sum, part) => sum + (part.quantity * part.unitCost), 0);
    const totalAmount = laborTotal + partsTotal;

    // 3. Generate a simple invoice number (e.g., INV-1001)
    const invoiceCount = await prisma.invoice.count();
    const invoiceNumber = `INV-${1000 + invoiceCount + 1}`;

    // 4. Create the Invoice
    const invoice = await prisma.invoice.create({
      data: {
        serviceRecordId: sr.id,
        invoiceNumber,
        totalAmount,
        paymentStatus: 'PENDING',
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}

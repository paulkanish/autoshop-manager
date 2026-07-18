import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AppointmentForm from './AppointmentForm';

const prisma = new PrismaClient();

export default async function NewAppointmentPage() {
  const session = await auth();
  
  // Security check
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
    redirect('/dashboard');
  }

  // Fetch data for dropdowns
  const customers = await prisma.customer.findMany({ orderBy: { lastName: 'asc' } });
  const vehicles = await prisma.vehicle.findMany({ include: { customer: true }, orderBy: { registration: 'asc' } });
  const mechanics = await prisma.user.findMany({ where: { role: 'MECHANIC' }, orderBy: { name: 'asc' } });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Appointment</h1>
      <AppointmentForm customers={customers} vehicles={vehicles} mechanics={mechanics} />
    </div>
  );
}

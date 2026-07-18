import { PrismaClient, JobStatus, Priority } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱  Seeding database...');

  // Hash a default password for all users
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@autoshop.com' },
    update: {},
    create: {
      email: 'admin@autoshop.com',
      name: 'Shop Admin',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const mechanic = await prisma.user.upsert({
    where: { email: 'mechanic@autoshop.com' },
    update: {},
    create: {
      email: 'mechanic@autoshop.com',
      name: 'Lead Mechanic',
      passwordHash,
      role: 'MECHANIC',
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@autoshop.com' },
    update: {},
    create: {
      email: 'owner@autoshop.com',
      name: 'Shop Owner',
      passwordHash,
      role: 'OWNER',
    },
  });

  // 2. Create a Customer
  const customer = await prisma.customer.upsert({
    where: { phone: '555-0100' },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-0100',
      email: 'john.doe@example.com',
    },
  });

  // 3. Create a Vehicle linked to the Customer
  const vehicle = await prisma.vehicle.upsert({
    where: { registration: 'ABC-123' },
    update: {},
    create: {
      registration: 'ABC-123',
      make: 'Toyota',
      model: 'Camry',
      year: 2018,
      customerId: customer.id,
    },
  });

  console.log('✅ Base users, customer, and vehicle seeded.');

  
  // 4. Create Dummy Appointments (Jobs) for the Kanban Board WITH PARTS
  console.log('🔧 Creating dummy jobs with service records and parts...');

  // Job 1: Scheduled for later today (Oil Change - No parts logged yet, just scheduled)
  await prisma.appointment.create({
    data: {
      customerId: customer.id,
      vehicleId: vehicle.id,
      mechanicId: mechanic.id,
      scheduledDateTime: new Date(new Date().setHours(14, 0, 0, 0)),
      requestedService: 'Routine Oil Change and Tire Rotation',
      status: JobStatus.SCHEDULED,
      priority: Priority.ROUTINE,
    },
  });

  // Job 2: In Progress (Brakes - Has parts logged from a previous similar job or initial intake)
  await prisma.appointment.create({
    data: {
      customerId: customer.id,
      vehicleId: vehicle.id,
      mechanicId: mechanic.id,
      scheduledDateTime: new Date(new Date().setHours(9, 0, 0, 0)),
      requestedService: 'Brake pad replacement - front',
      status: JobStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      serviceRecord: {
        create: {
          laborHours: 1.5,
          laborRate: 100.0,
          totalCost: 207.50,
          notes: 'Replaced front pads and flushed fluid.',
          partsUsed: {
            create: [
              { partName: 'Front Brake Pads (Ceramic)', quantity: 1, unitCost: 45.00 },
              { partName: 'DOT 4 Brake Fluid (1L)', quantity: 1, unitCost: 12.50 },
            ],
          },
        },
      },
    },
  });

  // Job 3: Waiting on Parts (Alternator - Has parts logged showing what was used previously)
  await prisma.appointment.create({
    data: {
      customerId: customer.id,
      vehicleId: vehicle.id,
      mechanicId: mechanic.id,
      scheduledDateTime: new Date(new Date().setHours(10, 30, 0, 0)),
      requestedService: 'Alternator replacement - waiting on new alternator',
      status: JobStatus.WAITING_ON_PARTS,
      priority: Priority.CRITICAL,
      serviceRecord: {
        create: {
          laborHours: 2.0,
          laborRate: 100.0,
          totalCost: 375.00,
          notes: 'Diagnosed faulty alternator. Ordered replacement.',
          partsUsed: {
            create: [
              { partName: 'Serpentine Belt', quantity: 1, unitCost: 25.00 },
              { partName: 'Alternator (Remanufactured)', quantity: 1, unitCost: 150.00 },
            ],
          },
        },
      },
    },
  });

  console.log('✅ Database fully seeded with dummy jobs and parts history!');

}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

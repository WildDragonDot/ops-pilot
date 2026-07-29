import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const prisma = new PrismaClient();

export async function initDatabase() {
  try {
    const orgCount = await prisma.organization.count();
    if (orgCount === 0) {
      console.log('🌱 Initializing Prisma SQLite database with default Organization & Project...');
      
      const org = await prisma.organization.create({
        data: {
          name: 'Acme Operations Corp',
          slug: 'acme-corp'
        }
      });

      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          email: 'admin@opspilot.ai',
          name: 'Chandan Vishwakarma (Admin)',
          password: hashedPassword,
          role: 'ADMIN',
          organizationId: org.id
        }
      });

      console.log('✅ Prisma SQLite Database ready.');
    }
  } catch (err) {
    console.error('⚠️ DB Initialization notice:', err);
  }
}

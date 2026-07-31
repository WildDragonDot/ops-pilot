import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from './logger.service.js';

export const prisma = new PrismaClient();

export async function initDatabase() {
  try {
    const orgCount = await prisma.organization.count();
    if (orgCount === 0) {
      logger.info('Initializing PostgreSQL database with default Organization & User');
      
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

      logger.info('PostgreSQL Database ready');
    }
  } catch (err) {
    logger.warn('DB initialization notice', err);
  }
}

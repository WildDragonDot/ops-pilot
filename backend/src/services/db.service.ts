import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { logger } from './logger.service.js';

export const prisma = new PrismaClient();

export async function initDatabase() {
  try {
    const orgCount = await prisma.organization.count();
    if (orgCount === 0) {
      logger.info('Initializing database with default Organization & Admin User');

      const org = await prisma.organization.create({
        data: {
          name: 'Acme Operations Corp',
          slug: 'acme-corp'
        }
      });

      // Use SEED_ADMIN_PASSWORD from env, or generate a random one-time password.
      // The generated password is printed once to logs so the operator can retrieve it.
      const seedPassword = process.env.SEED_ADMIN_PASSWORD || randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(seedPassword, 12);

      await prisma.user.create({
        data: {
          email: process.env.SEED_ADMIN_EMAIL || 'admin@opspilot.ai',
          name: 'Admin',
          password: hashedPassword,
          role: 'ADMIN',
          organizationId: org.id
        }
      });

      if (!process.env.SEED_ADMIN_PASSWORD) {
        // Only log the generated password — it won't appear again
        logger.warn(`⚠️  [SETUP] No SEED_ADMIN_PASSWORD env var set. Generated one-time admin password: ${seedPassword}`);
        logger.warn(`⚠️  [SETUP] Admin email: ${process.env.SEED_ADMIN_EMAIL || 'admin@opspilot.ai'} — Change this password immediately after first login.`);
      }

      logger.info('Database initialized and ready.');
    }
  } catch (err) {
    logger.warn('DB initialization notice', err);
  }
}

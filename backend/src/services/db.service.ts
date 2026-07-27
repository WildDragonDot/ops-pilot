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

      const project = await prisma.project.create({
        data: {
          id: 'demo-commerce-api',
          name: 'Production E-Commerce API',
          rootPath: process.cwd(),
          runtimeType: 'Docker Compose (Node.js + PostgreSQL + Redis + Nginx)',
          healthCheckUrl: 'http://localhost:8080/health',
          composeFile: 'docker-compose.yml',
          testCommand: 'npm test',
          restartCommand: 'docker compose restart postgres api',
          organizationId: org.id
        }
      });

      const repo = await prisma.repository.create({
        data: {
          id: 'opspilot-demo-repo',
          projectId: project.id,
          name: 'company/production-backend-api',
          url: 'https://github.com/company/production-backend-api',
          defaultBranch: 'main'
        }
      });

      const scan = await prisma.repositoryScan.create({
        data: {
          id: 'scan-init-001',
          repositoryId: repo.id,
          status: 'COMPLETED',
          overallScore: 78,
          securityScore: 72,
          qualityScore: 80,
          testingScore: 65,
          reliabilityScore: 85,
          documentationScore: 90,
          maintainabilityScore: 76,
          summary: 'Initial repository audit detected 2 Critical Security findings and missing authentication unit tests.',
          startedAt: new Date(Date.now() - 3600000),
          completedAt: new Date(Date.now() - 3540000)
        }
      });

      await prisma.repositoryFinding.createMany({
        data: [
          {
            id: 'find-sec-1',
            scanId: scan.id,
            severity: 'CRITICAL',
            category: 'SECURITY',
            title: 'Hardcoded JWT Secret in Source Code',
            filePath: 'backend/src/config/auth.ts',
            line: 14,
            impact: 'Anyone with read access to the repository can forge administrative access tokens.',
            recommendation: 'Move secret to process.env.JWT_SECRET and fail startup if missing.',
            patch: `--- backend/src/config/auth.ts\n+++ backend/src/config/auth.ts\n@@ -13,2 +13,5 @@\n-export const JWT_SECRET = "super_secret_key";\n+export const JWT_SECRET = process.env.JWT_SECRET;`
          },
          {
            id: 'find-bug-1',
            scanId: scan.id,
            severity: 'CRITICAL',
            category: 'BUG',
            title: 'Unsanitized String Passed to Integer DB Field',
            filePath: 'backend/src/controllers/auth.controller.ts',
            line: 42,
            impact: 'Triggers unhandled Prisma Client Validation exception resulting in 500 error for valid requests.',
            recommendation: 'Cast route parameter using Number(req.params.id) and return HTTP 400 if invalid.',
            patch: `--- backend/src/controllers/auth.controller.ts\n+++ backend/src/controllers/auth.controller.ts\n@@ -41,2 +41,5 @@\n-const user = await prisma.user.findUnique({ where: { id: req.params.id } });\n+const userId = Number(req.params.id);\n+if (isNaN(userId)) return res.status(400).json({ error: "Invalid ID" });`
          }
        ]
      });

      console.log('✅ Prisma SQLite Database ready & seeded.');
    }
  } catch (err) {
    console.error('⚠️ DB Initialization notice:', err);
  }
}

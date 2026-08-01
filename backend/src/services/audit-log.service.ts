import { prisma } from './db.service.js';

export interface AuditLogPayload {
  orgId: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  category: 'AUTH' | 'INCIDENT' | 'APPROVAL' | 'SCAN' | 'CODE_PATCH' | 'FAILURE_INJECTION' | 'SYSTEM';
  target: string;
  ipAddress?: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  details?: string;
}

/**
 * Write a persistent audit log entry to the database.
 * Call this from any controller after a significant action.
 */
export async function writeAuditLog(payload: AuditLogPayload): Promise<void> {
  try {
    await prisma.auditLog.create({ data: payload });
  } catch (err) {
    // Never throw — audit log failures should not break the primary operation
    const errorMessage = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[${new Date().toISOString()}] [error] [AuditLog] Failed to write audit entry: ${errorMessage}\n`);
  }
}

import { Response } from 'express';
import { prisma } from '../services/db.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { writeAuditLog } from '../services/audit-log.service.js';

const VALID_ROLES = ['ADMIN', 'APPROVER', 'DEVELOPER'];

/**
 * GET /api/users
 * List all users in the authenticated user's organization. (ADMIN only)
 */
export async function listUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const users = await prisma.user.findMany({
      where: { organizationId: user.organizationId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        provider: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ success: true, users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/users/:id/role
 * Update a user's role within the organization. (ADMIN only)
 */
export async function updateUserRole(req: AuthenticatedRequest, res: Response) {
  try {
    const admin = req.user!;
    const id = String(req.params.id);
    const { role } = req.body;

    if (!role || !VALID_ROLES.includes(role.toUpperCase())) {
      return res.status(400).json({
        error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}.`
      });
    }

    // Prevent changing your own role
    if (id === admin.userId) {
      return res.status(400).json({ error: 'You cannot change your own role.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser || targetUser.organizationId !== admin.organizationId) {
      return res.status(404).json({ error: 'User not found in your organization.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: role.toUpperCase() },
      select: { id: true, email: true, name: true, role: true }
    });

    await writeAuditLog({
      orgId: admin.organizationId,
      userId: admin.userId,
      userEmail: admin.email,
      userName: admin.email,
      action: 'USER_ROLE_UPDATED',
      category: 'SYSTEM',
      target: `${targetUser.email} → role: ${role.toUpperCase()}`,
      status: 'SUCCESS',
      details: `Admin changed role of ${targetUser.email} from ${targetUser.role} to ${role.toUpperCase()}`
    });

    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/users/:id
 * Remove a user from the organization. (ADMIN only)
 */
export async function removeUser(req: AuthenticatedRequest, res: Response) {
  try {
    const admin = req.user!;
    const id = String(req.params.id);

    if (id === admin.userId) {
      return res.status(400).json({ error: 'You cannot remove yourself from the organization.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser || targetUser.organizationId !== admin.organizationId) {
      return res.status(404).json({ error: 'User not found in your organization.' });
    }

    await prisma.user.delete({ where: { id } });

    await writeAuditLog({
      orgId: admin.organizationId,
      userId: admin.userId,
      userEmail: admin.email,
      userName: admin.email,
      action: 'USER_REMOVED',
      category: 'SYSTEM',
      target: targetUser.email,
      status: 'SUCCESS',
      details: `User ${targetUser.email} (${targetUser.role}) was removed from the organization.`
    });

    res.json({ success: true, message: `User ${targetUser.email} has been removed.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/users/invite
 * Generate an invite link for a new team member. (ADMIN only)
 * In a full SaaS implementation, this would send an email.
 * For now, returns a tokenized invite URL.
 */
export async function inviteUser(req: AuthenticatedRequest, res: Response) {
  try {
    const admin = req.user!;
    const { email, role = 'DEVELOPER' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!VALID_ROLES.includes(role.toUpperCase())) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}.` });
    }

    // Check if user already exists in the org
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing && existing.organizationId === admin.organizationId) {
      return res.status(409).json({ error: 'This user is already a member of your organization.' });
    }

    const org = await prisma.organization.findUnique({ where: { id: admin.organizationId } });

    // Create an invite token (in production: store in DB with expiry, send email)
    const inviteToken = Buffer.from(
      JSON.stringify({ email: email.toLowerCase(), orgId: admin.organizationId, role, ts: Date.now() })
    ).toString('base64url');

    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?invite=${inviteToken}`;

    await writeAuditLog({
      orgId: admin.organizationId,
      userId: admin.userId,
      userEmail: admin.email,
      userName: admin.email,
      action: 'USER_INVITED',
      category: 'SYSTEM',
      target: email,
      status: 'SUCCESS',
      details: `Invite sent to ${email} with role ${role.toUpperCase()} for org ${org?.name}`
    });

    res.json({
      success: true,
      message: `Invite generated for ${email}.`,
      inviteUrl,
      role: role.toUpperCase(),
      organization: org?.name
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

import { Request, Response } from 'express';
import { registerUser, loginUser, authenticateFirebaseUser } from '../services/auth.service.js';
import { prisma } from '../services/db.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { writeAuditLog } from '../services/audit-log.service.js';

function getIp(req: Request): string {
  const fwd = req?.headers ? req.headers['x-forwarded-for'] : undefined;
  const first = Array.isArray(fwd) ? fwd[0] : fwd;
  return (first?.split(',')[0]?.trim() || String(req?.ip || '') || 'unknown').replace('::ffff:', '');
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name, organizationName } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }

    const result = await registerUser(email.trim().toLowerCase(), password, name.trim(), organizationName?.trim());

    // Audit: new account registered
    await writeAuditLog({
      orgId: result.user.organizationId,
      userId: result.user.id,
      userEmail: result.user.email,
      userName: result.user.name,
      action: 'USER_REGISTERED',
      category: 'AUTH',
      target: result.user.email,
      ipAddress: getIp(req),
      status: 'SUCCESS',
      details: `New account created via email/password. Organization: ${result.user.organizationName || organizationName || 'default'}`
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      ...result
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed.' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await loginUser(email.trim().toLowerCase(), password);

    // Audit: successful login
    await writeAuditLog({
      orgId: result.user.organizationId,
      userId: result.user.id,
      userEmail: result.user.email,
      userName: result.user.name,
      action: 'USER_LOGIN',
      category: 'AUTH',
      target: 'D-OpsPilot Workspace',
      ipAddress: getIp(req),
      status: 'SUCCESS',
      details: `Authenticated via email/password. Role: ${result.user.role}`
    });

    res.json({
      success: true,
      message: 'Logged in successfully.',
      ...result
    });
  } catch (err: any) {
    // Audit: failed login attempt (no orgId since user may not exist)
    await writeAuditLog({
      orgId: 'unknown',
      userEmail: req.body?.email || 'unknown',
      action: 'USER_LOGIN_FAILED',
      category: 'AUTH',
      target: req.body?.email || 'unknown',
      ipAddress: getIp(req),
      status: 'FAILED',
      details: `Login failed: ${err.message}`
    });
    res.status(401).json({ error: err.message || 'Authentication failed.' });
  }
}

export async function firebaseAuth(req: Request, res: Response) {
  try {
    const { firebaseUid, email, name, provider, avatarUrl } = req.body;

    if (!firebaseUid || typeof firebaseUid !== 'string') {
      return res.status(400).json({ error: 'Firebase UID is required.' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required from your social provider.' });
    }

    const result = await authenticateFirebaseUser(
      firebaseUid,
      email.trim().toLowerCase(),
      name?.trim() || email.split('@')[0],
      provider || 'social',
      avatarUrl
    );

    const providerLabel = provider === 'github.com' ? 'GitHub' : provider === 'google.com' ? 'Google' : 'Firebase';

    // Audit: social sign-in
    await writeAuditLog({
      orgId: result.user.organizationId,
      userId: result.user.id,
      userEmail: result.user.email,
      userName: result.user.name,
      action: 'USER_LOGIN_SOCIAL',
      category: 'AUTH',
      target: 'D-OpsPilot Workspace',
      ipAddress: getIp(req),
      status: 'SUCCESS',
      details: `Signed in via ${providerLabel}. Role: ${result.user.role}`
    });

    res.json({
      success: true,
      message: `Signed in with ${providerLabel} successfully.`,
      ...result
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Social authentication failed.' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { organization: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        provider: user.provider || 'email',
        avatarUrl: user.avatarUrl,
        organizationId: user.organizationId,
        organizationName: user.organization.name
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch user profile.' });
  }
}

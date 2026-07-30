import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware.js';

/**
 * Role hierarchy: ADMIN > APPROVER > DEVELOPER
 * ADMIN    — full access to all operations
 * APPROVER — can approve/reject fixes + all DEVELOPER ops
 * DEVELOPER — read-only on sensitive actions
 */
const ROLE_HIERARCHY: Record<string, number> = {
  DEVELOPER: 1,
  APPROVER: 2,
  ADMIN: 3
};

/**
 * requireRole(...allowedRoles)
 * Factory middleware that restricts a route to users who have at least one of the specified roles.
 *
 * Usage:
 *   router.delete('/projects/:id', requireAuth, requireRole('ADMIN'), deleteProject);
 *   router.post('/approvals/:id/approve', requireAuth, requireRole('ADMIN', 'APPROVER'), approveFix);
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: 'Authentication required.',
        code: 'UNAUTHENTICATED'
      });
    }

    const userRole = user.role?.toUpperCase() || 'DEVELOPER';
    const hasPermission = allowedRoles.some(role => {
      const required = role.toUpperCase();
      // Exact match OR user role is higher in hierarchy
      return userRole === required || (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[required] || 99);
    });

    if (!hasPermission) {
      return res.status(403).json({
        error: `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}.`,
        code: 'FORBIDDEN',
        yourRole: userRole,
        requiredRoles: allowedRoles
      });
    }

    next();
  };
}

/**
 * Convenience exports for common role checks
 */
export const requireAdmin = requireRole('ADMIN');
export const requireApprover = requireRole('ADMIN', 'APPROVER');

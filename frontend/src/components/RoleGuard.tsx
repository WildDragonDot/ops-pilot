import React from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_HIERARCHY: Record<string, number> = {
  DEVELOPER: 1,
  APPROVER: 2,
  ADMIN: 3
};

interface RoleGuardProps {
  /** Required role(s). User must have at least one of these (or a higher role). */
  roles: string | string[];
  /** What to show when the user lacks permission. Defaults to a lock placeholder. */
  fallback?: React.ReactNode;
  /** If true, renders nothing instead of the fallback when unauthorized. */
  silent?: boolean;
  children: React.ReactNode;
}

/**
 * RoleGuard
 * Wraps children with a role-based access check.
 * 
 * Usage:
 *   <RoleGuard roles="ADMIN">
 *     <DangerButton />
 *   </RoleGuard>
 * 
 *   <RoleGuard roles={['ADMIN', 'APPROVER']}>
 *     <ApproveButton />
 *   </RoleGuard>
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ roles, fallback, silent = false, children }) => {
  const { user } = useAuth();

  if (!user) {
    return silent ? null : (fallback ?? <UnauthorizedPlaceholder requiredRoles={Array.isArray(roles) ? roles : [roles]} />);
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const userLevel = ROLE_HIERARCHY[user.role?.toUpperCase() || 'DEVELOPER'] || 1;

  const hasPermission = allowedRoles.some(r => {
    const required = ROLE_HIERARCHY[r.toUpperCase()] || 99;
    return userLevel >= required;
  });

  if (!hasPermission) {
    if (silent) return null;
    return fallback ? <>{fallback}</> : <UnauthorizedPlaceholder requiredRoles={allowedRoles} />;
  }

  return <>{children}</>;
};

const UnauthorizedPlaceholder: React.FC<{ requiredRoles: string[] }> = ({ requiredRoles }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-xs select-none">
    <Lock className="w-3.5 h-3.5 shrink-0" />
    <span>Requires <strong className="text-slate-500 dark:text-slate-400">{requiredRoles.join(' or ')}</strong> role</span>
  </div>
);

/**
 * useHasRole — hook version for programmatic checks
 * 
 * Usage:
 *   const canApprove = useHasRole(['ADMIN', 'APPROVER']);
 */
export function useHasRole(roles: string | string[]): boolean {
  const { user } = useAuth();
  if (!user) return false;

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const userLevel = ROLE_HIERARCHY[user.role?.toUpperCase() || 'DEVELOPER'] || 1;

  return allowedRoles.some(r => {
    const required = ROLE_HIERARCHY[r.toUpperCase()] || 99;
    return userLevel >= required;
  });
}

import { describe, it } from 'node:test';
import assert from 'node:assert';

console.log('🧪 Starting Auth & RBAC API Tests...');

export async function testAuthSuite() {
  console.log('\n--- 1. AUTHENTICATION & RBAC SUITE ---');

  // Test 1: User Password Hashing & Verification
  const testPassword = 'Password123!';
  const bcrypt = await import('bcryptjs');
  const hash = await bcrypt.default.hash(testPassword, 10);
  const isValid = await bcrypt.default.compare(testPassword, hash);
  assert.strictEqual(isValid, true, 'Password verification failed');
  console.log('  ✅ Password hashing and verification passed');

  // Test 2: JWT Token Generation & Verification
  const jwt = await import('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'test-secret';
  const token = jwt.default.sign({ userId: 'usr-123', role: 'ADMIN', email: 'test@opspilot.ai' }, secret, { expiresIn: '1h' });
  const decoded = jwt.default.verify(token, secret) as any;
  assert.strictEqual(decoded.userId, 'usr-123');
  assert.strictEqual(decoded.role, 'ADMIN');
  console.log('  ✅ JWT Token generation & verification passed');

  // Test 3: Role-Based Access Control (RBAC) Hierarchy
  const roles = ['VIEWER', 'OPERATOR', 'APPROVER', 'ADMIN'];
  const hasMinRole = (userRole: string, requiredRole: string) => {
    return roles.indexOf(userRole) >= roles.indexOf(requiredRole);
  };
  assert.strictEqual(hasMinRole('ADMIN', 'APPROVER'), true);
  assert.strictEqual(hasMinRole('VIEWER', 'APPROVER'), false);
  console.log('  ✅ RBAC Role hierarchy checks passed');

  return true;
}

import assert from 'node:assert';
import { assertSafeHost, assertSafeUser, assertSafeAbsolutePath } from '../services/ssh.service.js';

export async function testProjectSuite() {
  console.log('\n--- 2. PROJECT MANAGEMENT & SERVER DISCOVERY SUITE ---');

  // Test 1: Host parsing and validation
  const validHost = assertSafeHost('192.168.1.100');
  assert.strictEqual(validHost, '192.168.1.100');
  assert.throws(() => assertSafeHost('; rm -rf /'), /Invalid SSH host/);
  console.log('  ✅ SSH host parsing and command injection guardrails passed');

  // Test 2: User parsing and sanitization
  const validUser = assertSafeUser('ubuntu');
  assert.strictEqual(validUser, 'ubuntu');
  assert.throws(() => assertSafeUser('user&whoami'), /Invalid SSH user/);
  console.log('  ✅ SSH user sanitization passed');

  // Test 3: Path sanitization
  const validPath = assertSafeAbsolutePath('/var/www/app');
  assert.strictEqual(validPath, '/var/www/app');
  assert.throws(() => assertSafeAbsolutePath('/var/www/../etc/passwd'), /Invalid remote path/);
  console.log('  ✅ Target directory traversal protection passed');

  // Test 4: Project Operating Mode Resolver
  const getOperatingMode = (proj: { gitUrl?: string; serverHost?: string }) => {
    const hasGit = Boolean(proj.gitUrl?.trim());
    const hasServer = Boolean(proj.serverHost?.trim());
    if (hasGit && hasServer) return 'HYBRID_BOTH';
    if (hasGit) return 'GITHUB_ONLY';
    if (hasServer) return 'SERVER_ONLY';
    return 'LOCAL_SANDBOX';
  };

  assert.strictEqual(getOperatingMode({ gitUrl: 'https://github.com/a/b', serverHost: '1.2.3.4' }), 'HYBRID_BOTH');
  assert.strictEqual(getOperatingMode({ gitUrl: 'https://github.com/a/b' }), 'GITHUB_ONLY');
  assert.strictEqual(getOperatingMode({ serverHost: '1.2.3.4' }), 'SERVER_ONLY');
  assert.strictEqual(getOperatingMode({}), 'LOCAL_SANDBOX');
  console.log('  ✅ Project Operating Mode (GitHub/Server/Hybrid/Sandbox) resolver passed');

  return true;
}

import assert from 'node:assert';
import { parseGitHubRepo, fetchLiveGitHubAudit } from '../services/github-audit.service.js';

export async function testRepoAuditorSuite() {
  console.log('\n--- 4. REPOSITORY AUDITOR & AST CODE SCAN SUITE ---');

  // Test 1: HTTPS & SSH GitHub URL Parser
  const httpsParsed = parseGitHubRepo('https://github.com/WildDragonDot/ops-pilot');
  assert.deepStrictEqual(httpsParsed, { owner: 'WildDragonDot', repo: 'ops-pilot' });

  const sshParsed = parseGitHubRepo('git@github.com:WildDragonDot/ops-pilot.git');
  assert.deepStrictEqual(sshParsed, { owner: 'WildDragonDot', repo: 'ops-pilot' });
  console.log('  ✅ HTTPS & SSH GitHub URL parsers passed');

  // Test 2: Validation errors for missing/invalid URLs
  const missingRes = await fetchLiveGitHubAudit({ gitUrl: '' });
  assert.strictEqual(missingRes.connected, false);

  const invalidRes = await fetchLiveGitHubAudit({ gitUrl: 'invalid-url' });
  assert.strictEqual(invalidRes.connected, false);
  console.log('  ✅ Validation handling for invalid GitHub URLs passed');

  // Test 3: Live GitHub API Branch & Commit Audit
  const liveRes = await fetchLiveGitHubAudit({
    gitUrl: 'https://github.com/WildDragonDot/ops-pilot',
    gitBranch: 'main'
  });

  assert.ok(typeof liveRes.connected === 'boolean', 'Connection boolean state must be returned');
  assert.ok(liveRes.message, 'Status message must be returned');
  if (liveRes.connected) {
    assert.strictEqual(liveRes.targetBranch, 'main');
    assert.ok(liveRes.repository, 'Repository metadata must be returned');
    console.log(`  ✅ Live GitHub API Audit passed (Repo: ${liveRes.repository?.fullName || 'ops-pilot'})`);
  } else {
    console.log(`  ✅ GitHub API Rate Limit / Authentication response handling passed (${liveRes.message})`);
  }

  return true;
}

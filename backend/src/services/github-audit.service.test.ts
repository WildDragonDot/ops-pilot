import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGitHubRepo, fetchLiveGitHubAudit } from './github-audit.service.js';

test('parseGitHubRepo supports HTTPS repository URLs', () => {
  assert.deepEqual(parseGitHubRepo('https://github.com/openai/codex'), {
    owner: 'openai',
    repo: 'codex'
  });
});

test('parseGitHubRepo supports SSH repository URLs', () => {
  assert.deepEqual(parseGitHubRepo('git@github.com:WildDragonDot/ops-pilot.git'), {
    owner: 'WildDragonDot',
    repo: 'ops-pilot'
  });
});

test('parseGitHubRepo rejects non-GitHub URLs', () => {
  assert.equal(parseGitHubRepo('https://gitlab.com/acme/app'), null);
});

test('fetchLiveGitHubAudit returns a local validation error for missing URL', async () => {
  const result = await fetchLiveGitHubAudit({});
  assert.equal(result.connected, false);
  assert.match(result.message, /No GitHub repository URL/);
});

test('fetchLiveGitHubAudit returns a local validation error for malformed URL', async () => {
  const result = await fetchLiveGitHubAudit({ gitUrl: 'not-a-repository' });
  assert.equal(result.connected, false);
  assert.match(result.message, /Invalid GitHub URL format/);
});

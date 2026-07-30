import test from 'node:test';
import assert from 'node:assert/strict';
import { getModeBadgeInfo, getProjectOperatingMode } from './projectMode';

test('getProjectOperatingMode detects GitHub-only projects', () => {
  assert.equal(getProjectOperatingMode({ gitUrl: 'https://github.com/acme/app' } as any), 'GITHUB_ONLY');
});

test('getProjectOperatingMode detects server-only projects', () => {
  assert.equal(getProjectOperatingMode({ serverHost: '10.0.0.8' } as any), 'SERVER_ONLY');
});

test('getProjectOperatingMode detects hybrid projects', () => {
  assert.equal(
    getProjectOperatingMode({ gitUrl: 'https://github.com/acme/app', serverHost: '10.0.0.8' } as any),
    'HYBRID_BOTH'
  );
});

test('getProjectOperatingMode uses local sandbox when no integrations exist', () => {
  assert.equal(getProjectOperatingMode({ name: 'Local' } as any), 'LOCAL_SANDBOX');
});

test('getModeBadgeInfo labels server-only mode as infrastructure mode', () => {
  assert.equal(getModeBadgeInfo('SERVER_ONLY').label, 'INFRASTRUCTURE MODE');
});

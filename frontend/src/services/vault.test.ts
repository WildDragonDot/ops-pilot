import test from 'node:test';
import assert from 'node:assert/strict';
import { OpsPilotVault } from './vault';

// ── Minimal browser API stubs for Node test environment ──────────────────────

const store = new Map<string, string>();
globalThis.localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value); },
  removeItem: (key: string) => { store.delete(key); },
  clear: () => { store.clear(); },
  key: (index: number) => Array.from(store.keys())[index] ?? null,
  get length() { return store.size; }
} as Storage;

// Stub WebCrypto with a deterministic key so tests are reproducible
const FIXED_KEY_BYTES = new Uint8Array(32).fill(0x42);
let cryptoKey: CryptoKey;

async function getFixedKey(): Promise<CryptoKey> {
  if (!cryptoKey) {
    cryptoKey = await globalThis.crypto.subtle.importKey(
      'raw', FIXED_KEY_BYTES, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']
    );
  }
  return cryptoKey;
}

// Override getOrCreateMasterKey by pre-seeding localStorage with our fixed JWK
async function seedFixedMasterKey() {
  const key = await getFixedKey();
  const jwk = await globalThis.crypto.subtle.exportKey('jwk', key);
  store.set('opspilot_vault_masterkey_v3', JSON.stringify(jwk));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test('OpsPilotVault stores and restores project credentials', async () => {
  store.clear();
  await seedFixedMasterKey();

  await OpsPilotVault.setCredentials('project-1', {
    projectId: 'project-1',
    githubToken: 'ghp_secret',
    serverHost: '10.0.0.8',
    serverUser: 'ubuntu'
  });

  const creds = await OpsPilotVault.getCredentials('project-1');
  assert.deepEqual(creds, {
    projectId: 'project-1',
    githubToken: 'ghp_secret',
    serverHost: '10.0.0.8',
    serverUser: 'ubuntu'
  });
});

test('OpsPilotVault removes credentials by project id', async () => {
  await OpsPilotVault.setCredentials('project-2', { sshPassword: 'secret' });
  OpsPilotVault.removeCredentials('project-2');
  const creds = await OpsPilotVault.getCredentials('project-2');
  assert.equal(creds, null);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { OpsPilotVault } from './vault';

const store = new Map<string, string>();

globalThis.localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => {
    store.set(key, value);
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
  clear: () => {
    store.clear();
  },
  key: (index: number) => Array.from(store.keys())[index] ?? null,
  get length() {
    return store.size;
  }
} as Storage;

test('OpsPilotVault stores and restores project credentials', () => {
  store.clear();
  OpsPilotVault.setCredentials('project-1', {
    projectId: 'project-1',
    githubToken: 'ghp_secret',
    serverHost: '10.0.0.8',
    serverUser: 'ubuntu'
  });

  assert.deepEqual(OpsPilotVault.getCredentials('project-1'), {
    projectId: 'project-1',
    githubToken: 'ghp_secret',
    serverHost: '10.0.0.8',
    serverUser: 'ubuntu'
  });
});

test('OpsPilotVault removes credentials by project id', () => {
  OpsPilotVault.setCredentials('project-2', { sshPassword: 'secret' });
  OpsPilotVault.removeCredentials('project-2');
  assert.equal(OpsPilotVault.getCredentials('project-2'), null);
});

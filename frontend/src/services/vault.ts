import { logger } from './logger';

export interface ProjectCredentials {
  projectId?: string;
  gitUrl?: string;
  githubToken?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  serverHost?: string;
  serverPort?: number;
  serverUser?: string;
  sshKey?: string;
  sshPassword?: string;
}

const VAULT_KEY_PREFIX = 'opspilot_vault_creds_v3_';
// Separate storage key for the vault's AES-GCM CryptoKey (exported as JWK)
const VAULT_MASTER_KEY = 'opspilot_vault_masterkey_v3';

// ─── AES-256-GCM helpers ──────────────────────────────────────────────────────

async function getOrCreateMasterKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(VAULT_MASTER_KEY);
  if (stored) {
    try {
      const jwk = JSON.parse(stored);
      return await crypto.subtle.importKey('jwk', jwk, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
    } catch {
      // Key corrupted — regenerate
      localStorage.removeItem(VAULT_MASTER_KEY);
    }
  }
  // Generate a fresh AES-256-GCM key and persist it as JWK
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const jwk = await crypto.subtle.exportKey('jwk', key);
  localStorage.setItem(VAULT_MASTER_KEY, JSON.stringify(jwk));
  return key;
}

async function encryptPayload(plaintext: string): Promise<string> {
  const key = await getOrCreateMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  // Pack IV + ciphertext into a single base64 string: [12 bytes IV][ciphertext]
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

async function decryptPayload(encoded: string): Promise<string> {
  const key = await getOrCreateMasterKey();
  const combined = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

// ─── Vault API ─────────────────────────────────────────────────────────────────

export const OpsPilotVault = {
  /**
   * Save credentials using AES-256-GCM encryption in browser storage.
   * Credentials are NEVER sent to the backend database.
   */
  async setCredentials(projectId: string, creds: ProjectCredentials): Promise<void> {
    if (!projectId) return;
    try {
      const payload = JSON.stringify(creds);
      const encrypted = await encryptPayload(payload);
      localStorage.setItem(`${VAULT_KEY_PREFIX}${projectId}`, encrypted);
    } catch (e) {
      logger.error('Failed to write to client security vault', e);
    }
  },

  /**
   * Retrieve and decrypt credentials for a project from the vault.
   */
  async getCredentials(projectId: string): Promise<ProjectCredentials | null> {
    if (!projectId) return null;
    try {
      const item = localStorage.getItem(`${VAULT_KEY_PREFIX}${projectId}`);
      if (!item) return null;
      const decrypted = await decryptPayload(item);
      if (!decrypted) return null;
      return JSON.parse(decrypted);
    } catch (e) {
      logger.error('Failed to read from client security vault', e);
      return null;
    }
  },

  /**
   * Remove credentials for a project from the vault.
   */
  removeCredentials(projectId: string): void {
    if (!projectId) return;
    localStorage.removeItem(`${VAULT_KEY_PREFIX}${projectId}`);
  }
};

export async function saveUserCredentials(creds: Partial<ProjectCredentials>, projectId: string = 'global'): Promise<void> {
  const existing = (await OpsPilotVault.getCredentials(projectId)) || {};
  await OpsPilotVault.setCredentials(projectId, { ...existing, ...creds });
}

export async function getUserCredentials(projectId: string = 'global'): Promise<ProjectCredentials | null> {
  return OpsPilotVault.getCredentials(projectId);
}

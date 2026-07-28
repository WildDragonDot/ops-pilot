export interface ProjectCredentials {
  projectId?: string;
  gitUrl?: string;
  githubToken?: string;
  serverHost?: string;
  serverPort?: number;
  serverUser?: string;
  sshKey?: string;
  sshPassword?: string;
}

const VAULT_KEY_PREFIX = 'opspilot_vault_creds_v2_';

function encryptPayload(str: string): string {
  // XOR-stream Obfuscated client cipher for zero-db browser storage security
  const encoded = encodeURIComponent(str);
  let result = '';
  for (let i = 0; i < encoded.length; i++) {
    result += String.fromCharCode(encoded.charCodeAt(i) ^ (0x5A + (i % 7)));
  }
  return btoa(result);
}

function decryptPayload(str: string): string {
  try {
    const raw = atob(str);
    let result = '';
    for (let i = 0; i < raw.length; i++) {
      result += String.fromCharCode(raw.charCodeAt(i) ^ (0x5A + (i % 7)));
    }
    return decodeURIComponent(result);
  } catch (e) {
    return '';
  }
}

export const OpsPilotVault = {
  /**
   * Save credentials safely in encrypted client security vault.
   * NOTE: Credentials NEVER touch backend database!
   */
  setCredentials(projectId: string, creds: ProjectCredentials): void {
    if (!projectId) return;
    try {
      const payload = JSON.stringify(creds);
      const encrypted = encryptPayload(payload);
      localStorage.setItem(`${VAULT_KEY_PREFIX}${projectId}`, encrypted);
    } catch (e) {
      console.error('Failed to write to client security vault:', e);
    }
  },

  /**
   * Get credentials for a project from encrypted client vault.
   */
  getCredentials(projectId: string): ProjectCredentials | null {
    if (!projectId) return null;
    try {
      const item = localStorage.getItem(`${VAULT_KEY_PREFIX}${projectId}`);
      if (!item) return null;
      const decrypted = decryptPayload(item);
      if (!decrypted) return null;
      return JSON.parse(decrypted);
    } catch (e) {
      console.error('Failed to read from client security vault:', e);
      return null;
    }
  },

  /**
   * Delete credentials for a project.
   */
  removeCredentials(projectId: string): void {
    if (!projectId) return;
    localStorage.removeItem(`${VAULT_KEY_PREFIX}${projectId}`);
  }
};

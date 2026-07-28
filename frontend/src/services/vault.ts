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

const VAULT_KEY_PREFIX = 'opspilot_vault_creds_';

export const OpsPilotVault = {
  /**
   * Save credentials safely in browser storage keyed by project ID.
   * NOTE: Credentials NEVER touch backend database!
   */
  setCredentials(projectId: string, creds: ProjectCredentials): void {
    if (!projectId) return;
    try {
      const payload = JSON.stringify(creds);
      // Store encoded string in local storage
      const encoded = btoa(encodeURIComponent(payload));
      localStorage.setItem(`${VAULT_KEY_PREFIX}${projectId}`, encoded);
    } catch (e) {
      console.error('Failed to write to client security vault:', e);
    }
  },

  /**
   * Get credentials for a project from client vault.
   */
  getCredentials(projectId: string): ProjectCredentials | null {
    if (!projectId) return null;
    try {
      const item = localStorage.getItem(`${VAULT_KEY_PREFIX}${projectId}`);
      if (!item) return null;
      const decoded = decodeURIComponent(atob(item));
      return JSON.parse(decoded);
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

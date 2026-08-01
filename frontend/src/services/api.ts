import { Project, Scan, Incident } from '../types';
import { OpsPilotVault, ProjectCredentials } from './vault';

const API_BASE = '/api';

// ─── Auto-logout on 401 ───────────────────────────────────────────────────────
function handleUnauthorized() {
  localStorage.removeItem('opspilot_token');
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

/**
 * Central fetch wrapper — handles all error scenarios:
 * - Network offline / Failed to fetch
 * - Non-ok HTTP responses (extracts server JSON `error` field)
 * - 401 auto-logout
 * - 403 permission error
 * - Timeout (optional)
 */
async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 120_000
): Promise<T> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Network error — please check your internet connection.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, { ...options, signal: controller.signal });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('Request timed out. Please try again.');
    if (err instanceof TypeError) throw new Error('Network error — please check your internet connection.');
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Session expired. Please log in again.');
  }

  if (res.status === 403) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'You do not have permission to perform this action.');
  }

  if (!res.ok) {
    let serverMessage = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) serverMessage = body.error;
      else if (body?.message) serverMessage = body.message;
    } catch {
      if (res.statusText) serverMessage = res.statusText;
    }
    throw new Error(serverMessage);
  }

  try {
    return await res.json() as T;
  } catch {
    return undefined as T;
  }
}

// ─── Header helpers ────────────────────────────────────────────────────────────
function safeHeaderEncode(val?: string): string | undefined {
  if (!val) return undefined;
  try {
    return encodeURIComponent(val);
  } catch {
    return undefined;
  }
}

async function getAuthHeaders(projectId?: string): Promise<Record<string, string>> {
  const token = localStorage.getItem('opspilot_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Merge project-specific credentials with global vault fallback (both async now)
  const [globalCreds, projectCreds] = await Promise.all([
    OpsPilotVault.getCredentials('global'),
    projectId ? OpsPilotVault.getCredentials(projectId) : Promise.resolve(null)
  ]);
  const creds: ProjectCredentials = { ...globalCreds, ...projectCreds };

  if (creds.sshKey) {
    const enc = safeHeaderEncode(creds.sshKey);
    if (enc) headers['x-server-ssh-key'] = enc;
  }
  if (creds.sshPassword) {
    const enc = safeHeaderEncode(creds.sshPassword);
    if (enc) headers['x-server-pass'] = enc;
  }
  if (creds.githubToken) {
    const enc = safeHeaderEncode(creds.githubToken);
    if (enc) headers['x-github-token'] = enc;
  }
  if (creds.openaiApiKey) {
    headers['x-openai-api-key'] = creds.openaiApiKey;
  }
  if (creds.geminiApiKey) {
    headers['x-gemini-api-key'] = creds.geminiApiKey;
  }

  return headers;
}

// ─── Projects ──────────────────────────────────────────────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  const data = await apiFetch<any>(`${API_BASE}/projects`, { headers: await getAuthHeaders() });
  return data.projects || [data.project];
}

export async function fetchProject(id?: string): Promise<Project> {
  const url = id ? `${API_BASE}/projects/${id}` : `${API_BASE}/projects`;
  const data = await apiFetch<any>(url, { headers: await getAuthHeaders(id) });
  return data.project || (data.projects ? data.projects[0] : null);
}

export async function createNewProject(
  payload: { name: string; gitUrl?: string; serverHost?: string; serverPort?: number; serverUser?: string; environmentType?: string },
  creds?: ProjectCredentials
): Promise<Project> {
  const data = await apiFetch<any>(`${API_BASE}/projects`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  if (data.project && creds) {
    OpsPilotVault.setCredentials(data.project.id, {
      ...creds,
      projectId: data.project.id
    });
  }

  return data.project;
}

export async function testConnection(
  payload: { gitUrl?: string; gitBranch?: string; serverHost?: string; serverPort?: number; serverUser?: string; rootPath?: string },
  creds?: ProjectCredentials
): Promise<any> {
  const headers = await getAuthHeaders();
  if (creds?.sshKey) {
    const enc = safeHeaderEncode(creds.sshKey);
    if (enc) headers['x-server-ssh-key'] = enc;
  }
  if (creds?.sshPassword) {
    const enc = safeHeaderEncode(creds.sshPassword);
    if (enc) headers['x-server-pass'] = enc;
  }
  if (creds?.githubToken) {
    const enc = safeHeaderEncode(creds.githubToken);
    if (enc) headers['x-github-token'] = enc;
  }

  return apiFetch<any>(`${API_BASE}/projects/test-connection`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...payload,
      sshKey: creds?.sshKey,
      sshPassword: creds?.sshPassword,
      githubToken: creds?.githubToken
    })
  });
}

export async function suggestAICommandApi(query: string, serverHost?: string, serverUser?: string): Promise<{
  command: string;
  explanation: string;
  detectedIntent: string;
  confidence: number;
}> {
  return apiFetch(`${API_BASE}/ai/suggest-command`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ query, serverHost, serverUser })
  });
}

export async function scanDirectoriesApi(payload: { serverHost?: string; serverPort?: number; serverUser?: string; baseDir?: string }, creds?: ProjectCredentials): Promise<{ directories: string[] }> {
  const headers = await getAuthHeaders();
  if (creds?.sshKey) {
    const enc = safeHeaderEncode(creds.sshKey);
    if (enc) headers['x-server-ssh-key'] = enc;
  }
  return apiFetch(`${API_BASE}/projects/scan-directories`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
}

export async function analyzeLogsWithAiApi(logs: string): Promise<{
  analysis: {
    summary: string;
    errors: string[];
    recommendation: string;
    cleanLogs: string;
  }
}> {
  return apiFetch(`${API_BASE}/ai/analyze-logs`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ logs })
  });
}

export async function removeProject(id: string): Promise<any> {
  const data = await apiFetch<any>(`${API_BASE}/projects/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(id)
  });
  OpsPilotVault.removeCredentials(id);
  return data;
}

export async function fetchProjectHealth(projectId?: string): Promise<{
  status: string;
  services: Record<string, { status: string; message?: string }>;
  metrics?: { cpuUsage: number; memoryMB: number; memoryPct: number; memoryTotalMB: number; networkMBs: number; htopSource: string };
  timestamp: string;
}> {
  if (!projectId) throw new Error('Project ID is required to fetch project health');
  return apiFetch(`${API_BASE}/projects/${projectId}/health`, { headers: await getAuthHeaders(projectId) });
}

export async function fetchRepositoryScan(projectId?: string): Promise<Scan> {
  const url = projectId ? `${API_BASE}/repositories?projectId=${encodeURIComponent(projectId)}` : `${API_BASE}/repositories`;
  const data = await apiFetch<any>(url, { headers: await getAuthHeaders(projectId) });
  return data.repository?.latestScan ?? null;
}

export async function triggerRepositoryScan(projectId?: string): Promise<Scan> {
  const data = await apiFetch<any>(`${API_BASE}/repositories/scan`, {
    method: 'POST',
    headers: await getAuthHeaders(projectId),
    body: JSON.stringify({ projectId })
  });
  return data.scan;
}

export async function applySecurityPatch(findingId: string, projectId?: string): Promise<Scan> {
  const data = await apiFetch<any>(`${API_BASE}/repositories/findings/${findingId}/patch`, {
    method: 'POST',
    headers: await getAuthHeaders(projectId)
  });
  return data.scan;
}

export async function fetchIncidents(projectId?: string): Promise<Incident[]> {
  const url = projectId ? `${API_BASE}/incidents?projectId=${encodeURIComponent(projectId)}` : `${API_BASE}/incidents`;
  const data = await apiFetch<any>(url, { headers: await getAuthHeaders() });
  return data.incidents;
}

export async function fetchIncident(id: string): Promise<Incident> {
  const data = await apiFetch<any>(`${API_BASE}/incidents/${id}`, { headers: await getAuthHeaders() });
  return data.incident;
}

export async function startIncident(userPrompt: string, scenarioKey: string, projectId?: string): Promise<Incident> {
  const data = await apiFetch<any>(`${API_BASE}/incidents`, {
    method: 'POST',
    headers: await getAuthHeaders(projectId),
    body: JSON.stringify({ userPrompt, scenarioKey, projectId }),
  });
  return data.incident;
}

export async function approveFix(approvalId: string): Promise<any> {
  return apiFetch(`${API_BASE}/approvals/${approvalId}/approve`, {
    method: 'POST',
    headers: await getAuthHeaders()
  });
}

export async function rejectFix(approvalId: string): Promise<any> {
  return apiFetch(`${API_BASE}/approvals/${approvalId}/reject`, {
    method: 'POST',
    headers: await getAuthHeaders()
  });
}

export async function injectFailure(scenarioKey: string, projectId?: string): Promise<any> {
  return apiFetch(`${API_BASE}/demo/inject-failure`, {
    method: 'POST',
    headers: await getAuthHeaders(projectId),
    body: JSON.stringify({ scenarioKey, projectId }),
  });
}

export async function resetEnvironment(projectId?: string): Promise<any> {
  return apiFetch(`${API_BASE}/demo/reset`, {
    method: 'POST',
    headers: await getAuthHeaders(projectId),
    body: JSON.stringify({ projectId })
  });
}

export async function fetchPostMortemReport(incidentId: string): Promise<string> {
  const data = await apiFetch<any>(`${API_BASE}/incidents/${incidentId}/report`, { headers: await getAuthHeaders() });
  return data.report;
}

export async function executeCommandOnServer(command: string, projectId?: string, cwd?: string): Promise<{ success: boolean; command: string; output: string; exitCode: number; cwd?: string }> {
  return apiFetch(`${API_BASE}/projects/exec`, {
    method: 'POST',
    headers: await getAuthHeaders(projectId),
    body: JSON.stringify({ command, projectId, cwd }),
  });
}

export async function scanServerDirectoriesApi(params: {
  serverHost: string;
  serverPort?: number;
  serverUser?: string;
  baseDir?: string;
}): Promise<{ success: boolean; directories: string[]; error?: string }> {
  return apiFetch(`${API_BASE}/projects/scan-directories`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(params),
  });
}

export async function inspectTargetFolderApi(params: {
  projectId?: string;
  serverHost?: string;
  serverPort?: number;
  serverUser?: string;
  targetPath?: string;
}): Promise<{
  success: boolean;
  targetPath: string;
  detectedTechStack: string;
  hasDockerCompose: boolean;
  hasPackageJson: boolean;
  containersCount: number;
  dynamicNodes: Array<{ id: string; label: string; status: 'RUNNING' | 'STOPPED'; raw: string }>;
}> {
  return apiFetch(`${API_BASE}/projects/inspect-folder`, {
    method: 'POST',
    headers: await getAuthHeaders(params.projectId),
    body: JSON.stringify(params),
  });
}

export async function updateProject(id: string, projectData: Partial<Project>): Promise<Project> {
  return apiFetch(`${API_BASE}/projects/${id}`, {
    method: 'PUT',
    headers: await getAuthHeaders(id),
    body: JSON.stringify(projectData),
  });
}

export async function fetchServerLogs(projectId?: string): Promise<{ logs: Array<{ id: string; time: string; level: 'INFO' | 'OK' | 'WARN' | 'ERR'; message: string }>; host?: string; realRemote: boolean }> {
  if (!projectId) throw new Error('Project ID is required to fetch server logs');
  return apiFetch(`${API_BASE}/projects/${projectId}/server-logs`, { headers: await getAuthHeaders(projectId) });
}

export async function fetchAuditLogs(params?: {
  projectId?: string;
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ logs: any[]; total: number; page: number; totalPages: number; limit: number }> {
  const qp = new URLSearchParams();
  if (params?.projectId) qp.set('projectId', params.projectId);
  if (params?.page) qp.set('page', String(params.page));
  if (params?.limit) qp.set('limit', String(params.limit));
  if (params?.category && params.category !== 'ALL') qp.set('category', params.category);
  if (params?.status && params.status !== 'ALL') qp.set('status', params.status);
  if (params?.search) qp.set('search', params.search);
  if (params?.startDate) qp.set('startDate', params.startDate);
  if (params?.endDate) qp.set('endDate', params.endDate);
  return apiFetch(`${API_BASE}/audit-logs?${qp.toString()}`, { headers: await getAuthHeaders() });
}

// ─── Notification API ──────────────────────────────────────────────────────────

export async function fetchNotifications(params?: { page?: number; limit?: number; unread?: boolean }) {
  const qp = new URLSearchParams();
  if (params?.page) qp.set('page', String(params.page));
  if (params?.limit) qp.set('limit', String(params.limit));
  if (params?.unread) qp.set('unread', 'true');
  return apiFetch(`${API_BASE}/notifications?${qp.toString()}`, { headers: await getAuthHeaders() });
}

export async function persistNotification(payload: { type: string; title: string; message: string }) {
  try {
    return await apiFetch(`${API_BASE}/notifications`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
  } catch {
    return null; // Fire-and-forget — silent failure is acceptable for notifications
  }
}

export async function markNotificationRead(id: string) {
  try {
    await apiFetch(`${API_BASE}/notifications/${id}/read`, { method: 'PATCH', headers: await getAuthHeaders() });
    return true;
  } catch {
    return false;
  }
}

export async function markAllNotificationsRead() {
  try {
    await apiFetch(`${API_BASE}/notifications/read-all`, { method: 'PATCH', headers: await getAuthHeaders() });
    return true;
  } catch {
    return false;
  }
}

export async function deleteNotificationApi(id: string) {
  try {
    await apiFetch(`${API_BASE}/notifications/${id}`, { method: 'DELETE', headers: await getAuthHeaders() });
    return true;
  } catch {
    return false;
  }
}

export async function clearAllNotificationsApi() {
  try {
    await apiFetch(`${API_BASE}/notifications`, { method: 'DELETE', headers: await getAuthHeaders() });
    return true;
  } catch {
    return false;
  }
}

// ─── User Management API ───────────────────────────────────────────────────────

export async function fetchOrgUsers(): Promise<any[]> {
  const data = await apiFetch<any>(`${API_BASE}/users`, { headers: await getAuthHeaders() });
  return data.users || [];
}

export async function updateUserRoleApi(userId: string, role: string): Promise<any> {
  return apiFetch(`${API_BASE}/users/${userId}/role`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ role })
  });
}

export async function removeOrgUser(userId: string): Promise<any> {
  return apiFetch(`${API_BASE}/users/${userId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders()
  });
}

export async function inviteUserApi(email: string, role: string): Promise<any> {
  return apiFetch(`${API_BASE}/users/invite`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ email, role })
  });
}

// ─── Org API ───────────────────────────────────────────────────────────────────

export async function fetchOrg(): Promise<any> {
  const data = await apiFetch<any>(`${API_BASE}/org`, { headers: await getAuthHeaders() });
  return data.organization;
}

export async function updateOrgApi(name: string): Promise<any> {
  return apiFetch(`${API_BASE}/org`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ name })
  });
}

export async function fetchOrgStats(): Promise<any> {
  const data = await apiFetch<any>(`${API_BASE}/org/stats`, { headers: await getAuthHeaders() });
  return data.stats;
}

export async function fetchDeploymentGap(projectId?: string): Promise<{
  hasGap: boolean;
  githubCommit: string;
  serverCommit: string;
  serverHost: string;
  gitUrl: string;
  targetPath: string;
  message: string;
}> {
  if (!projectId) throw new Error('Project ID is required to fetch deployment gap status');
  return apiFetch(`${API_BASE}/projects/${projectId}/deploy-gap`, { headers: await getAuthHeaders(projectId) });
}

export async function triggerAIDeployment(projectId?: string, targetPath?: string): Promise<{
  success: boolean;
  message: string;
  deployedCommit: string;
  serverHost: string;
  logs: string[];
}> {
  // Deployment can take 3-5 min on fresh server (Node 22 download + npm install + Prisma)
  // Timeout set to 6 minutes (360s) to avoid premature completion
  return apiFetch(`${API_BASE}/projects/ai-deploy`, {
    method: 'POST',
    headers: await getAuthHeaders(projectId),
    body: JSON.stringify({ projectId, targetPath })
  }, 360_000);
}

import { Project, Scan, Incident } from '../types';
import { OpsPilotVault, ProjectCredentials } from './vault';

const API_BASE = '/api';

function safeHeaderEncode(val?: string): string | undefined {
  if (!val) return undefined;
  try {
    return encodeURIComponent(val);
  } catch {
    return undefined;
  }
}

function getAuthHeaders(projectId?: string): Record<string, string> {
  const token = localStorage.getItem('opspilot_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (projectId) {
    const creds = OpsPilotVault.getCredentials(projectId);
    if (creds) {
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
    }
  }

  return headers;
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch projects');
  const data = await res.json();
  return data.projects || [data.project];
}

export async function fetchProject(id?: string): Promise<Project> {
  const url = id ? `${API_BASE}/projects/${id}` : `${API_BASE}/projects`;
  const res = await fetch(url, { headers: getAuthHeaders(id) });
  if (!res.ok) throw new Error('Failed to fetch project');
  const data = await res.json();
  return data.project || (data.projects ? data.projects[0] : null);
}

export async function createNewProject(
  payload: { name: string; gitUrl?: string; serverHost?: string; serverPort?: number; serverUser?: string; environmentType?: string },
  creds?: ProjectCredentials
): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to create project');
  const data = await res.json();

  if (data.project && creds) {
    OpsPilotVault.setCredentials(data.project.id, {
      ...creds,
      projectId: data.project.id
    });
  }

  return data.project;
}

export async function testConnection(
  payload: { gitUrl?: string; gitBranch?: string; serverHost?: string; serverPort?: number; serverUser?: string },
  creds?: ProjectCredentials
): Promise<any> {
  const headers = getAuthHeaders();
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

  const res = await fetch(`${API_BASE}/projects/test-connection`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...payload,
      sshKey: creds?.sshKey,
      sshPassword: creds?.sshPassword,
      githubToken: creds?.githubToken
    })
  });
  if (!res.ok) throw new Error('Connection test failed');
  return res.json();
}

export async function suggestAICommandApi(query: string, serverHost?: string, serverUser?: string): Promise<{
  command: string;
  explanation: string;
  detectedIntent: string;
  confidence: number;
}> {
  const res = await fetch(`${API_BASE}/ai/suggest-command`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ query, serverHost, serverUser })
  });
  if (!res.ok) throw new Error('AI Command Suggestion failed');
  return res.json();
}

export async function scanDirectoriesApi(payload: { serverHost?: string; serverPort?: number; serverUser?: string; baseDir?: string }, creds?: ProjectCredentials): Promise<{ directories: string[] }> {
  const headers = getAuthHeaders();
  if (creds?.sshKey) {
    const enc = safeHeaderEncode(creds.sshKey);
    if (enc) headers['x-server-ssh-key'] = enc;
  }
  const res = await fetch(`${API_BASE}/projects/scan-directories`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to scan remote directories');
  return res.json();
}

export async function analyzeLogsWithAiApi(logs: string): Promise<{
  analysis: {
    summary: string;
    errors: string[];
    recommendation: string;
    cleanLogs: string;
  }
}> {
  const res = await fetch(`${API_BASE}/ai/analyze-logs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ logs })
  });
  if (!res.ok) throw new Error('Log AI Analysis failed');
  return res.json();
}

export async function removeProject(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(id)
  });
  if (!res.ok) throw new Error('Failed to delete project');
  OpsPilotVault.removeCredentials(id);
  return res.json();
}

export async function fetchProjectHealth(projectId?: string): Promise<{
  status: string;
  services: any;
  metrics?: { cpuUsage: number; memoryMB: number; memoryPct: number; memoryTotalMB: number; networkMBs: number; htopSource: string };
  timestamp: string;
}> {
  const id = projectId || 'demo-project';
  const res = await fetch(`${API_BASE}/projects/${id}/health`, { headers: getAuthHeaders(id) });
  if (!res.ok) throw new Error('Failed to fetch project health');
  return res.json();
}

export async function fetchRepositoryScan(): Promise<Scan> {
  const res = await fetch(`${API_BASE}/repositories`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch repository');
  const data = await res.json();
  return data.repository.latestScan;
}

export async function triggerRepositoryScan(): Promise<Scan> {
  const res = await fetch(`${API_BASE}/repositories/scan`, { 
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to trigger scan');
  const data = await res.json();
  return data.scan;
}

export async function applySecurityPatch(findingId: string): Promise<Scan> {
  const res = await fetch(`${API_BASE}/repositories/findings/${findingId}/patch`, { 
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to apply security patch');
  const data = await res.json();
  return data.scan;
}

export async function fetchIncidents(projectId?: string): Promise<Incident[]> {
  const url = projectId ? `${API_BASE}/incidents?projectId=${encodeURIComponent(projectId)}` : `${API_BASE}/incidents`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch incidents');
  const data = await res.json();
  return data.incidents;
}

export async function fetchIncident(id: string): Promise<Incident> {
  const res = await fetch(`${API_BASE}/incidents/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch incident');
  const data = await res.json();
  return data.incident;
}

export async function startIncident(userPrompt: string, scenarioKey: string): Promise<Incident> {
  const res = await fetch(`${API_BASE}/incidents`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ userPrompt, scenarioKey }),
  });
  if (!res.ok) throw new Error('Failed to start incident');
  const data = await res.json();
  return data.incident;
}

export async function approveFix(approvalId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/approvals/${approvalId}/approve`, { 
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to approve fix');
  return res.json();
}

export async function rejectFix(approvalId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/approvals/${approvalId}/reject`, { 
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to reject fix');
  return res.json();
}

export async function injectFailure(scenarioKey: string): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/inject-failure`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ scenarioKey }),
  });
  if (!res.ok) throw new Error('Failed to inject failure');
  return res.json();
}

export async function resetEnvironment(): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/reset`, { 
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to reset environment');
  return res.json();
}

export async function fetchPostMortemReport(incidentId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/report`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch report');
  const data = await res.json();
  return data.report;
}

export async function executeCommandOnServer(command: string): Promise<{ success: boolean; command: string; output: string; exitCode: number; cwd?: string }> {
  const res = await fetch(`${API_BASE}/projects/exec`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ command }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to execute command on server');
  }
  return res.json();
}

export async function fetchServerLogs(projectId?: string): Promise<{ logs: Array<{ id: string; time: string; level: 'INFO' | 'OK' | 'WARN' | 'ERR'; message: string }>; host?: string; realRemote: boolean }> {
  const id = projectId || 'demo-project';
  const res = await fetch(`${API_BASE}/projects/${id}/server-logs`, { headers: getAuthHeaders(id) });
  if (!res.ok) throw new Error('Failed to fetch server logs');
  return res.json();
}

export async function fetchAuditLogs(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/audit-logs`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  const data = await res.json();
  return data.logs || [];
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
  const id = projectId || 'demo-project';
  const res = await fetch(`${API_BASE}/projects/${id}/deploy-gap`, { headers: getAuthHeaders(id) });
  if (!res.ok) throw new Error('Failed to fetch deployment gap status');
  return res.json();
}

export async function triggerAIDeployment(projectId?: string): Promise<{
  success: boolean;
  message: string;
  deployedCommit: string;
  serverHost: string;
  logs: string[];
}> {
  const res = await fetch(`${API_BASE}/projects/ai-deploy`, {
    method: 'POST',
    headers: getAuthHeaders(projectId),
    body: JSON.stringify({ projectId })
  });
  if (!res.ok) throw new Error('AI Autonomous Deployment failed');
  return res.json();
}

import { Project, Scan, Incident } from '../types';

const API_BASE = '/api';

export async function fetchProject(): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to fetch project');
  const data = await res.json();
  return data.project;
}

export async function fetchRepositoryScan(): Promise<Scan> {
  const res = await fetch(`${API_BASE}/repositories`);
  if (!res.ok) throw new Error('Failed to fetch repository');
  const data = await res.json();
  return data.repository.latestScan;
}

export async function triggerRepositoryScan(): Promise<Scan> {
  const res = await fetch(`${API_BASE}/repositories/scan`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger scan');
  const data = await res.json();
  return data.scan;
}

export async function fetchIncidents(): Promise<Incident[]> {
  const res = await fetch(`${API_BASE}/incidents`);
  if (!res.ok) throw new Error('Failed to fetch incidents');
  const data = await res.json();
  return data.incidents;
}

export async function fetchIncident(id: string): Promise<Incident> {
  const res = await fetch(`${API_BASE}/incidents/${id}`);
  if (!res.ok) throw new Error('Failed to fetch incident');
  const data = await res.json();
  return data.incident;
}

export async function startIncident(userPrompt: string, scenarioKey: string): Promise<Incident> {
  const res = await fetch(`${API_BASE}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userPrompt, scenarioKey }),
  });
  if (!res.ok) throw new Error('Failed to start incident');
  const data = await res.json();
  return data.incident;
}

export async function approveFix(approvalId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/approvals/${approvalId}/approve`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to approve fix');
  return res.json();
}

export async function rejectFix(approvalId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/approvals/${approvalId}/reject`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reject fix');
  return res.json();
}

export async function injectFailure(scenarioKey: string): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/inject-failure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioKey }),
  });
  if (!res.ok) throw new Error('Failed to inject failure');
  return res.json();
}

export async function resetEnvironment(): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset environment');
  return res.json();
}

export async function fetchPostMortemReport(incidentId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/report`);
  if (!res.ok) throw new Error('Failed to fetch report');
  const data = await res.json();
  return data.report;
}

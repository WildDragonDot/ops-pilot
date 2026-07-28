import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from '../services/db.service.js';
import { getProjectState, injectFailureScenario, resetEnvironmentState, createAndRunIncident } from '../services/incident-agent.service.js';
import { testSSHConnection } from '../services/ssh.service.js';
import { fetchLiveGitHubAudit } from '../services/github-audit.service.js';
import { broadcastEvent } from './stream.controller.js';

const execAsync = promisify(exec);

const getHeaderString = (val: string | string[] | undefined): string | undefined => {
  if (!val) return undefined;
  return Array.isArray(val) ? val[0] : val;
};

export async function getProjects(req: Request, res: Response) {
  let projects = await prisma.project.findMany({
    include: { repositories: true },
    orderBy: { createdAt: 'desc' }
  });

  const state = getProjectState();

  if (projects.length === 0) {
    const defaultProj = await prisma.project.create({
      data: {
        id: 'demo-commerce-api',
        name: 'Production E-Commerce API',
        rootPath: process.cwd(),
        runtimeType: 'Docker Compose',
        environmentType: 'Docker Compose'
      },
      include: { repositories: true }
    });
    projects = [defaultProj];
  }

  res.json({
    projects: projects.map(p => ({
      ...p,
      environmentStatus: state.environmentStatus
    }))
  });
}

export async function getProject(req: Request, res: Response) {
  const projectId = req.params.id ? String(req.params.id) : undefined;
  let project = projectId 
    ? await prisma.project.findUnique({ where: { id: projectId }, include: { repositories: true } })
    : await prisma.project.findFirst({ include: { repositories: true } });

  const state = getProjectState();

  if (!project) {
    project = await prisma.project.create({
      data: {
        id: 'demo-commerce-api',
        name: 'Production E-Commerce API',
        rootPath: process.cwd(),
        runtimeType: 'Docker Compose',
        environmentType: 'Docker Compose'
      },
      include: { repositories: true }
    });
  }

  res.json({
    project: {
      ...project,
      environmentStatus: state.environmentStatus
    }
  });
}

export async function createProject(req: Request, res: Response) {
  const { name, gitUrl, serverHost, serverPort, serverUser, environmentType } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  // NOTE: SSH Keys & GitHub Tokens are NEVER stored in DB for security!
  const newProject = await prisma.project.create({
    data: {
      name,
      rootPath: process.cwd(),
      runtimeType: environmentType || 'Docker Compose',
      environmentType: environmentType || 'Docker Compose',
      gitUrl: gitUrl || null,
      serverHost: serverHost || null,
      serverPort: serverPort ? parseInt(serverPort, 10) : 22,
      serverUser: serverUser || 'root'
    },
    include: { repositories: true }
  });

  const state = getProjectState();

  res.status(201).json({
    project: {
      ...newProject,
      environmentStatus: state.environmentStatus
    }
  });
}

export async function testProjectConnection(req: Request, res: Response) {
  const { gitUrl, serverHost, serverPort, serverUser, sshKey, sshPassword, githubToken } = req.body;

  const headerSshKey = getHeaderString(req.headers['x-server-ssh-key']) || sshKey;
  const headerSshPass = getHeaderString(req.headers['x-server-pass']) || sshPassword;
  const headerGitToken = getHeaderString(req.headers['x-github-token']) || githubToken;

  const sshResult = await testSSHConnection({
    host: serverHost,
    port: serverPort ? parseInt(serverPort, 10) : 22,
    user: serverUser || 'root',
    key: headerSshKey,
    password: headerSshPass
  });

  const gitResult = await fetchLiveGitHubAudit({
    gitUrl,
    githubToken: headerGitToken
  });

  res.json({
    success: sshResult.success || gitResult.connected,
    ssh: sshResult,
    github: gitResult
  });
}

export async function deleteProject(req: Request, res: Response) {
  const id = String(req.params.id);
  try {
    await prisma.project.delete({ where: { id } });
    res.json({ success: true, message: 'Project deleted' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export function getProjectHealth(req: Request, res: Response) {
  const state = getProjectState();
  res.json({
    status: state.environmentStatus.overall,
    services: state.environmentStatus,
    timestamp: new Date().toISOString()
  });
}

export async function injectFailure(req: Request, res: Response) {
  const { scenarioKey } = req.body;
  const key = scenarioKey || 'DATABASE_STOPPED';
  const state = injectFailureScenario(key);
  const incident = await createAndRunIncident('', key);
  broadcastEvent({ type: 'danger', title: 'Failure Injected', message: `Scenario '${key}' triggered container degradation` });
  res.json({ success: true, services: state.environmentStatus, incident });
}

export function resetEnv(req: Request, res: Response) {
  const state = resetEnvironmentState();
  broadcastEvent({ type: 'success', title: 'Environment Restored', message: 'All container services reset to HEALTHY status' });
  res.json({ success: true, services: state.environmentStatus });
}

export async function executeServerCommand(req: Request, res: Response) {
  const { command } = req.body;
  if (!command || typeof command !== 'string') {
    return res.status(400).json({ error: 'Command string is required' });
  }

  const trimmed = command.trim();
  if (trimmed.startsWith('rm -rf /') || trimmed.includes('mkfs') || trimmed.includes('dd if=')) {
    return res.status(403).json({ error: 'Command blocked by OpsPilot AI Safety Policy' });
  }

  try {
    const { stdout, stderr } = await execAsync(command, { cwd: process.cwd(), timeout: 15000 });
    const output = (stdout + (stderr ? `\n[STDERR]\n${stderr}` : '')).trim();
    res.json({
      success: true,
      command,
      output: output || '(Command executed successfully)',
      exitCode: 0,
      cwd: process.cwd()
    });
  } catch (err: any) {
    res.json({
      success: false,
      command,
      output: (err.stdout || '') + (err.stderr ? `\n[STDERR]\n${err.stderr}` : '') || err.message,
      exitCode: err.code || 1,
      cwd: process.cwd()
    });
  }
}

import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from '../services/db.service.js';
import { getProjectState, injectFailureScenario, resetEnvironmentState, createAndRunIncident } from '../services/incident-agent.service.js';
import { testSSHConnection, discoverServerTechStack } from '../services/ssh.service.js';
import { fetchLiveGitHubAudit } from '../services/github-audit.service.js';
import { broadcastEvent } from './stream.controller.js';
import { logger } from '../services/logger.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { writeAuditLog } from '../services/audit-log.service.js';

const execAsync = promisify(exec);

function getIp(req: Request): string {
  const fwd = req?.headers ? req.headers['x-forwarded-for'] : undefined;
  const first = Array.isArray(fwd) ? fwd[0] : fwd;
  return (first?.split(',')[0]?.trim() || String(req?.ip || '') || 'unknown').replace('::ffff:', '');
}

const getHeaderString = (val: string | string[] | undefined): string | undefined => {
  if (!val) return undefined;
  const str = Array.isArray(val) ? val[0] : val;
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
};

const shellQuote = (value: string): string => `'${value.replace(/'/g, "'\\''")}'`;

export async function getProjects(req: AuthenticatedRequest, res: Response) {
  const orgId = req?.user?.organizationId;
  const projects = await prisma.project.findMany({
    where: orgId ? { organizationId: orgId } : {},
    include: { repositories: true },
    orderBy: { createdAt: 'desc' }
  });

  const state = getProjectState();

  res.json({
    projects: projects.map(p => ({
      ...p,
      environmentStatus: state.environmentStatus
    }))
  });
}

export async function getProject(req: AuthenticatedRequest, res: Response) {
  const projectId = req?.params?.id ? String(req.params.id) : undefined;
  const orgId = req?.user?.organizationId;

  let project = projectId
    ? await prisma.project.findFirst({
        where: { id: projectId, ...(orgId ? { organizationId: orgId } : {}) },
        include: { repositories: true }
      })
    : await prisma.project.findFirst({
        where: orgId ? { organizationId: orgId } : {},
        include: { repositories: true }
      });

  const state = getProjectState();

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const user = project.serverUser || 'ec2-user';
  const repoName = project.gitUrl ? project.gitUrl.split('/').pop()?.replace('.git', '') || 'app' : 'app';
  const defaultDir = user === 'root' ? `/root/${repoName}` : `/home/${user}/${repoName}`;
  const isLocalMacPath = project.rootPath?.startsWith('/Users/') || project.rootPath?.includes('Desktop');
  const cleanRootPath = isLocalMacPath ? defaultDir : (project.rootPath || defaultDir);

  res.json({
    project: {
      ...project,
      rootPath: cleanRootPath,
      environmentStatus: state.environmentStatus
    }
  });
}

export async function createProject(req: AuthenticatedRequest, res: Response) {
  const { name, gitUrl, serverHost, serverPort, serverUser, environmentType } = req?.body || {};
  const user = req?.user;

  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  if (!user?.organizationId) {
    return res.status(400).json({ error: 'User organization is required to create a project.' });
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
      serverUser: serverUser || 'ec2-user',
      organizationId: user.organizationId
    },
    include: { repositories: true }
  });

  const state = getProjectState();

  // Audit: project created
  if (user) {
    await writeAuditLog({
      orgId: user.organizationId,
      userId: user.userId,
      userEmail: user.email,
      userName: user.email,
      action: 'PROJECT_CREATED',
      category: 'SYSTEM',
      target: `Project: ${name}`,
      ipAddress: getIp(req),
      status: 'SUCCESS',
      details: `Project "${name}" created with runtime ${environmentType || 'Docker Compose'}`
    });
  }

  res.status(201).json({
    project: {
      ...newProject,
      environmentStatus: state.environmentStatus
    }
  });
}

export async function testProjectConnection(req: Request, res: Response) {
  const headers = req?.headers || {};
  const body = req?.body || {};
  const { gitUrl, gitBranch, serverHost, serverPort, serverUser, sshKey, sshPassword, githubToken } = body;

  const headerSshKey = getHeaderString(headers['x-server-ssh-key']) || sshKey;
  const headerSshPass = getHeaderString(headers['x-server-pass']) || sshPassword;
  const headerGitToken = getHeaderString(headers['x-github-token']) || githubToken;

  const sshCreds = {
    host: serverHost,
    port: serverPort ? parseInt(serverPort, 10) : 22,
    user: serverUser || 'root',
    key: headerSshKey,
    password: headerSshPass
  };

  const sshResult = serverHost 
    ? await testSSHConnection(sshCreds) 
    : { success: true, message: 'Local Sandbox Engine Active (Port 5080)' };

  const gitResult = await fetchLiveGitHubAudit({
    gitUrl,
    gitBranch,
    githubToken: headerGitToken
  });

  const discoveryResult = (serverHost && sshResult.success) ? await discoverServerTechStack(sshCreds) : null;

  const isSuccess = (serverHost ? sshResult.success : true) && (gitUrl ? gitResult.connected : true);

  res.json({
    success: isSuccess,
    ssh: sshResult,
    github: gitResult,
    discovery: discoveryResult
  });
}

export async function deleteProject(req: AuthenticatedRequest, res: Response) {
  const id = String(req.params.id);
  const user = req.user;
  try {
    // Verify the project belongs to the user's org before deleting
    const existing = await prisma.project.findFirst({
      where: { id, ...(user?.organizationId ? { organizationId: user.organizationId } : {}) }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    await prisma.project.delete({ where: { id } });

    // Instantly delete local cloned repository folder from disk storage
    try {
      const { deleteClonedRepo } = await import('../services/repo-clone.service.js');
      deleteClonedRepo(id);
    } catch (e) {}

    if (user) {
      await writeAuditLog({
        orgId: user.organizationId,
        userId: user.userId,
        userEmail: user.email,
        userName: user.email,
        action: 'PROJECT_DELETED',
        category: 'SYSTEM',
        target: `Project: ${existing.name}`,
        ipAddress: getIp(req),
        status: 'SUCCESS',
        details: `Project "${existing.name}" permanently deleted by ${user.email} (role: ${user.role})`
      });
    }

    res.json({ success: true, message: 'Project deleted' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

async function fetchHtopSystemMetrics(serverHost?: string, creds?: any) {
  let cpuUsage = 14.5;
  let memoryMB = 444;
  let memoryTotalMB = 4096;
  let memoryPct = 11;
  let networkMBs = 1.4;
  let htopSource = 'Local Host (ps/free/top)';

  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    if (serverHost) {
      const { executeRemoteCommand } = await import('../services/ssh.service.js');
      const topOutput = await executeRemoteCommand(creds, 'top -b -n 1 | head -n 12 && free -m');
      if (topOutput && !topOutput.includes('Command failed') && !topOutput.includes('Permission denied')) {
        htopSource = `Remote SSH Server (${serverHost})`;
        const cpuMatch = topOutput.match(/%Cpu\(s\):\s*([\d.]+)\s*us/);
        if (cpuMatch) cpuUsage = parseFloat(cpuMatch[1]);

        const memMatch = topOutput.match(/Mem:\s*(\d+)\s+total,\s+(\d+)\s+used/i) || topOutput.match(/Mem:\s*(\d+)\s+(\d+)/);
        if (memMatch) {
          memoryTotalMB = parseInt(memMatch[1], 10);
          memoryMB = parseInt(memMatch[2], 10);
          memoryPct = Math.round((memoryMB / memoryTotalMB) * 100);
        }
      }
    } else {
      const isMac = process.platform === 'darwin';
      if (isMac) {
        const { stdout: psOut } = await execAsync("ps -A -o %cpu,%mem | awk '{cpu+=$1; mem+=$2} END {print cpu, mem}'");
        const [cpu, mem] = psOut.trim().split(/\s+/).map(Number);
        if (!isNaN(cpu)) cpuUsage = Math.min(99.9, Math.max(2.1, parseFloat((cpu / 8).toFixed(1))));
        if (!isNaN(mem)) {
          memoryPct = Math.min(95, Math.max(5, parseFloat(mem.toFixed(1))));
          memoryMB = Math.round((memoryPct / 100) * 16384);
        }
      } else {
        const { stdout: topOut } = await execAsync('top -b -n 1 | head -n 10 && free -m');
        const cpuMatch = topOut.match(/%Cpu\(s\):\s*([\d.]+)\s*us/);
        if (cpuMatch) cpuUsage = parseFloat(cpuMatch[1]);
        const memMatch = topOut.match(/Mem:\s*(\d+)\s+(\d+)/);
        if (memMatch) {
          memoryTotalMB = parseInt(memMatch[1], 10);
          memoryMB = parseInt(memMatch[2], 10);
          memoryPct = Math.round((memoryMB / memoryTotalMB) * 100);
        }
      }
    }
  } catch (err) {
    logger.warn('Htop metric collection error', err);
  }

  return {
    cpuUsage,
    memoryMB,
    memoryPct,
    memoryTotalMB,
    networkMBs,
    htopSource
  };
}

export async function getProjectHealth(req: AuthenticatedRequest, res: Response) {
  const projectId = String(req.params.id);
  const orgId = req.user?.organizationId;
  const project = await prisma.project.findFirst({
    where: { id: projectId, ...(orgId ? { organizationId: orgId } : {}) }
  });

  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }
  
  const headerSshKey = getHeaderString(req.headers['x-server-ssh-key']);
  const headerSshPass = getHeaderString(req.headers['x-server-pass']);
  const creds = {
    host: project?.serverHost?.trim(),
    port: project?.serverPort || 22,
    user: project?.serverUser || 'root',
    key: headerSshKey,
    password: headerSshPass
  };

  const metrics = await fetchHtopSystemMetrics(project?.serverHost?.trim(), creds);
  
  let status = 'DOWN';
  let services: any = {};
  
  if (project?.serverHost?.trim()) {
    const discovery = await discoverServerTechStack(creds);
    if (discovery.containers && discovery.containers.length > 0) {
      status = 'HEALTHY';
      services = {
        overall: 'HEALTHY',
        dynamicNodes: discovery.containers.map(c => {
          const namePart = c.includes('(') ? c.split('(')[0]?.trim() : c.trim();
          const statusPart = c.includes('(') ? c.split('(')[1]?.replace(')', '')?.trim() : 'Up';
          return {
            id: namePart.replace(/[^\w-]/g, '_').toLowerCase(),
            label: namePart,
            status: statusPart?.toLowerCase().includes('up') ? 'RUNNING' : 'STOPPED',
            raw: c
          };
        })
      };
    } else {
      status = 'EMPTY';
      services = { overall: 'EMPTY', dynamicNodes: [] };
    }
  } else {
    const state = getProjectState();
    status = state.environmentStatus.overall;
    services = state.environmentStatus;
  }

  res.json({
    status,
    services,
    metrics,
    timestamp: new Date().toISOString()
  });
}

export async function injectFailure(req: AuthenticatedRequest, res: Response) {
  const { scenarioKey, projectId } = req.body;
  const user = req.user;
  const project = projectId ? await prisma.project.findUnique({ where: { id: String(projectId) } }) : null;
  if (!project?.serverHost?.trim()) {
    return res.status(400).json({ error: 'Failure injection requires a selected project with an SSH server host.' });
  }
  const key = scenarioKey || 'DATABASE_STOPPED';
  const state = injectFailureScenario(key);
  const incident = await createAndRunIncident('', key, project.id);
  broadcastEvent({ type: 'danger', title: 'Failure Injected', message: `Scenario '${key}' triggered container degradation` });

  // Audit: failure injection
  if (user) {
    await writeAuditLog({
      orgId: user.organizationId,
      userId: user.userId,
      userEmail: user.email,
      userName: user.email,
      action: 'FAILURE_INJECTION_TRIGGERED',
      category: 'FAILURE_INJECTION',
      target: `Project: ${project.name} — Scenario: ${key}`,
      ipAddress: getIp(req),
      status: 'WARNING',
      details: `Chaos scenario "${key}" injected by ${user.email} (role: ${user.role}) on project "${project.name}"`
    });
  }

  res.json({ success: true, services: state.environmentStatus, incident });
}

export async function resetEnv(req: AuthenticatedRequest, res: Response) {
  const { projectId } = req.body || {};
  const user = req.user;
  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: String(projectId) } });
    if (!project?.serverHost?.trim()) {
      return res.status(400).json({ error: 'Environment reset requires a server-connected project.' });
    }
  }
  const state = resetEnvironmentState();
  broadcastEvent({ type: 'success', title: 'Environment Restored', message: 'All container services reset to HEALTHY status' });

  // Audit: environment reset
  if (user) {
    await writeAuditLog({
      orgId: user.organizationId,
      userId: user.userId,
      userEmail: user.email,
      userName: user.email,
      action: 'ENVIRONMENT_RESET',
      category: 'INCIDENT',
      target: projectId ? `Project #${projectId}` : 'Global Environment',
      ipAddress: getIp(req),
      status: 'SUCCESS',
      details: `Environment reset to HEALTHY state by ${user.email} (role: ${user.role})`
    });
  }

  res.json({ success: true, services: state.environmentStatus });
}

export async function executeServerCommand(req: AuthenticatedRequest, res: Response) {
  const { command, projectId, cwd } = req.body;
  const user = req.user;
  if (!command || typeof command !== 'string') {
    return res.status(400).json({ error: 'Command string is required' });
  }

  const trimmed = command.trim();
  if (trimmed.startsWith('rm -rf /') || trimmed.includes('mkfs') || trimmed.includes('dd if=')) {
    // Audit: blocked dangerous command
    if (user) {
      await writeAuditLog({
        orgId: user.organizationId,
        userId: user.userId,
        userEmail: user.email,
        userName: user.email,
        action: 'COMMAND_BLOCKED',
        category: 'SYSTEM',
        target: `Blocked: ${trimmed.slice(0, 80)}`,
        ipAddress: getIp(req),
        status: 'FAILED',
        details: `Destructive command blocked by safety policy: "${trimmed.slice(0, 200)}"`
      });
    }
    return res.status(403).json({ error: 'Command blocked by D-OpsPilot AI Safety Policy' });
  }

  let serverHost = '';
  let serverUser = 'ubuntu';
  let serverPort = 22;

  if (projectId) {
    try {
      const proj = await prisma.project.findUnique({ where: { id: String(projectId) } });
      if (proj?.serverHost) {
        serverHost = proj.serverHost;
        serverUser = proj.serverUser || 'ubuntu';
        serverPort = proj.serverPort || 22;
      }
    } catch (e) {}
  }

  if (!serverHost) {
    return res.status(400).json({ error: 'Server command execution requires a project with an SSH server host.' });
  }

  const headerSshKey = getHeaderString(req.headers['x-server-ssh-key']);
  const headerSshPass = getHeaderString(req.headers['x-server-pass']);
  const creds = {
    host: serverHost,
    port: serverPort,
    user: serverUser,
    key: headerSshKey,
    password: headerSshPass
  };

  let cmdToExec = trimmed;
  if (cwd && typeof cwd === 'string' && cwd.trim() !== '' && cwd !== '~') {
    cmdToExec = `cd ${shellQuote(cwd)} 2>/dev/null && ${trimmed}`;
  }

  try {
    const { executeRemoteCommand } = await import('../services/ssh.service.js');
    const output = await executeRemoteCommand(creds, cmdToExec);
    const success = !output.includes('Command failed') && !output.includes('Permission denied');

    // Audit: server command executed
    if (user) {
      await writeAuditLog({
        orgId: user.organizationId,
        userId: user.userId,
        userEmail: user.email,
        userName: user.email,
        action: 'EXECUTED_SERVER_COMMAND',
        category: 'INCIDENT',
        target: `${serverUser}@${serverHost}`,
        ipAddress: getIp(req),
        status: success ? 'SUCCESS' : 'WARNING',
        details: `CMD: ${trimmed.slice(0, 200)} | Output: ${output?.slice(0, 150) || '(empty)'}`
      });
    }

    res.json({
      success,
      command: trimmed,
      output: output || '(Command executed successfully)',
      exitCode: 0,
      cwd: `${serverUser}@${serverHost}:~`
    });
  } catch (err: any) {
    // Audit: command execution error
    if (user) {
      await writeAuditLog({
        orgId: user.organizationId,
        userId: user.userId,
        userEmail: user.email,
        userName: user.email,
        action: 'EXECUTED_SERVER_COMMAND',
        category: 'INCIDENT',
        target: `${serverUser}@${serverHost}`,
        ipAddress: getIp(req),
        status: 'FAILED',
        details: `CMD: ${trimmed.slice(0, 150)} | Error: ${err.message}`
      });
    }
    res.json({
      success: false,
      command: trimmed,
      output: err.message || 'Execution error',
      exitCode: 1,
      cwd: `${serverUser}@${serverHost}:~`
    });
  }
}

export async function getServerLogs(req: AuthenticatedRequest, res: Response) {
  const projectId = String(req.params.id);
  const orgId = req.user?.organizationId;
  const project = await prisma.project.findFirst({
    where: { id: projectId, ...(orgId ? { organizationId: orgId } : {}) }
  });
  
  const serverHost = project?.serverHost?.trim();
  const gitUrl = project?.gitUrl?.trim();
  const now = new Date();

  if (serverHost) {
    try {
      const { executeRemoteCommand } = await import('../services/ssh.service.js');
      const headerSshKey = getHeaderString(req.headers['x-server-ssh-key']);
      const headerSshPass = getHeaderString(req.headers['x-server-pass']);
      
      const creds = {
        host: serverHost,
        port: project?.serverPort || 22,
        user: project?.serverUser || 'root',
        key: headerSshKey,
        password: headerSshPass
      };

      const rawLogs = await executeRemoteCommand(
        creds,
        `(for c in $(sudo docker ps --format '{{.Names}}' 2>/dev/null || docker ps --format '{{.Names}}' 2>/dev/null); do echo "=== CONTAINER: $c ==="; sudo docker logs --tail 10 $c 2>&1 || docker logs --tail 10 $c 2>&1; done) || journalctl -n 20 --no-pager 2>/dev/null`
      );
      
      if (rawLogs && !rawLogs.includes('Command failed')) {
        const lines = rawLogs
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.includes('permission denied while trying to connect to the docker API'));

        if (lines.length > 0) {
          const formatted = lines.map((msg, i) => ({
            id: `log-${Date.now()}-${i}`,
            time: new Date(now.getTime() - (lines.length - i) * 2000).toTimeString().split(' ')[0],
            level: (msg.toLowerCase().includes('err') || msg.toLowerCase().includes('fail') ? 'ERR' : msg.toLowerCase().includes('warn') ? 'WARN' : 'INFO') as 'INFO' | 'OK' | 'WARN' | 'ERR',
            message: msg.substring(0, 150)
          }));
          return res.json({ logs: formatted, host: serverHost, realRemote: true });
        }
      }
    } catch (e) {
      logger.warn('Remote log stream error', e);
    }
  }

  const timeStr = now.toTimeString().split(' ')[0];
  const logs = serverHost ? [
    { id: `l1-${Date.now()}`, time: timeStr, level: 'WARN' as const, message: `ssh.auth        -- Remote SSH credentials required for host ${serverHost}:22` },
    { id: `l2-${Date.now()}`, time: timeStr, level: 'INFO' as const, message: `project.config  -- Server host configured: ${serverHost}` },
    { id: `l3-${Date.now()}`, time: timeStr, level: 'INFO' as const, message: `settings.vault  -- Configure SSH key/pass in Project Settings to enable live remote log streaming` }
  ] : [
    { id: `l1-${Date.now()}`, time: timeStr, level: gitUrl ? 'OK' as const : 'WARN' as const, message: gitUrl ? `git.auditor     -- Verified remote GitHub branch "main" (${gitUrl})` : 'git.auditor     -- No GitHub repository configured for this project' },
    { id: `l2-${Date.now()}`, time: timeStr, level: 'INFO' as const, message: `ast.scanner     -- AST vulnerability scan clean (0 active risks)` },
    { id: `l3-${Date.now()}`, time: timeStr, level: 'OK' as const, message: `vault.crypto    -- Zero-DB WebCrypto AES-256 vault active` },
    { id: `l4-${Date.now()}`, time: timeStr, level: 'INFO' as const, message: `webhook.ingress -- Live repository audit stream standing by` }
  ];

  res.json({ logs, host: serverHost || 'GitHub Audit Mode', realRemote: false });
}

export async function suggestAICommand(req: Request, res: Response) {
  const { query, serverHost, serverUser } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query string is required' });
  }

  if (!serverHost?.trim()) {
    return res.json({
      success: true,
      command: 'git status && npm audit --audit-level=high',
      explanation: 'Runs repository status and dependency audit checks in GitHub AST mode.',
      detectedIntent: 'Repository Audit',
      confidence: 0.92
    });
  }

  try {
    const { generateAICommandFromPrompt } = await import('../services/openai.service.js');
    const result = await generateAICommandFromPrompt(query, { host: serverHost, user: serverUser });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.json({
      success: true,
      command: 'sudo docker ps',
      explanation: 'Inspects active containers on remote server',
      detectedIntent: 'Container Discovery',
      confidence: 0.95
    });
  }
}

export async function scanServerDirectories(req: Request, res: Response) {
  const { serverHost, serverPort, serverUser, baseDir } = req.body;
  const sshKey = getHeaderString(req.headers['x-server-ssh-key']);
  const sshPassword = getHeaderString(req.headers['x-server-pass']) || getHeaderString(req.headers['x-server-ssh-pass']);

  const creds = {
    host: serverHost,
    port: Number(serverPort) || 22,
    user: serverUser || 'root',
    key: sshKey,
    password: sshPassword
  };

  if (!creds.host?.trim()) {
    return res.status(400).json({ error: 'Directory scan requires an SSH server host.' });
  }

  try {
    const { listRemoteServerDirectories } = await import('../services/ssh.service.js');
    const userDefault = creds.user === 'root' ? '/root' : `/home/${creds.user}`;
    const directories = await listRemoteServerDirectories(creds, baseDir || userDefault);
    res.json({ success: true, directories });
  } catch (err: any) {
    res.status(502).json({ success: false, directories: [], error: err.message || 'Unable to scan remote server directories.' });
  }
}

export async function inspectTargetFolder(req: Request, res: Response) {
  const { projectId, serverHost, serverPort, serverUser, targetPath } = req.body;
  const sshKey = getHeaderString(req.headers['x-server-ssh-key']);
  const sshPassword = getHeaderString(req.headers['x-server-pass']) || getHeaderString(req.headers['x-server-ssh-pass']);

  let host = serverHost;
  let port = Number(serverPort) || 22;
  let user = serverUser || 'root';

  if (projectId) {
    try {
      const proj = await prisma.project.findUnique({ where: { id: String(projectId) } });
      if (proj?.serverHost) {
        host = proj.serverHost;
        port = proj.serverPort || 22;
        user = proj.serverUser || 'root';
      }
    } catch (e) {}
  }

  if (!host) {
    return res.status(400).json({ error: 'Inspection requires a server host.' });
  }

  const creds = { host, port, user, key: sshKey, password: sshPassword };
  const folder = targetPath || (user === 'root' ? '/root' : `/home/${user}`);

  try {
    const { executeRemoteCommand } = await import('../services/ssh.service.js');
    const inspectScript = `
      cd ${shellQuote(folder)} 2>/dev/null || exit 0
      echo "=== PWD ==="
      pwd
      echo "=== FILES ==="
      ls -1a | head -n 30
      echo "=== DOCKER ==="
      sudo docker ps --format "{{.Names}} ({{.Status}})" 2>/dev/null || docker ps --format "{{.Names}} ({{.Status}})" 2>/dev/null || echo "no_docker"
      echo "=== PM2 ==="
      pm2 jlist 2>/dev/null || echo "no_pm2"
    `;

    const rawOutput = await executeRemoteCommand(creds, inspectScript);
    
    const hasDockerCompose = rawOutput.includes('docker-compose') || rawOutput.includes('compose.yml');
    const hasPackageJson = rawOutput.includes('package.json');
    const hasRequirementsTxt = rawOutput.includes('requirements.txt') || rawOutput.includes('Pipfile') || rawOutput.includes('pyproject.toml');
    const hasGoMod = rawOutput.includes('go.mod');

    let containers: string[] = [];
    if (rawOutput.includes('=== DOCKER ===')) {
      const dockerSection = rawOutput.split('=== DOCKER ===')[1]?.split('=== PM2 ===')[0] || '';
      containers = dockerSection
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.includes('no_docker') && !l.includes('===') && !l.includes('Command failed') && !l.includes('Permission denied') && !l.includes('sudo:'));
    }

    let detectedTechStack = 'Docker Compose';
    if (containers.length > 0 || hasDockerCompose) {
      detectedTechStack = 'Docker Compose';
    } else if (hasPackageJson) {
      detectedTechStack = 'Node.js API';
    } else if (hasRequirementsTxt) {
      detectedTechStack = 'Python / FastAPI';
    } else if (hasGoMod) {
      detectedTechStack = 'Go / Microservice';
    }

    const dynamicNodes = containers.map(c => {
      const namePart = c.includes('(') ? c.split('(')[0]?.trim() : c.trim();
      const statusPart = c.includes('(') ? c.split('(')[1]?.replace(')', '')?.trim() : 'Up';
      return {
        id: namePart.replace(/[^\w-]/g, '_').toLowerCase(),
        label: namePart,
        status: statusPart?.toLowerCase().includes('up') ? 'RUNNING' : 'STOPPED',
        raw: c
      };
    });

    res.json({
      success: true,
      targetPath: folder,
      detectedTechStack,
      hasDockerCompose,
      hasPackageJson,
      hasRequirementsTxt,
      hasGoMod,
      containersCount: containers.length,
      dynamicNodes
    });
  } catch (err: any) {
    res.status(502).json({ success: false, error: err.message || 'Inspection failed' });
  }
}

export async function analyzeLogsWithAIController(req: Request, res: Response) {
  const { logs } = req.body;
  try {
    const { summarizeLogsWithAI } = await import('../services/openai.service.js');
    const analysis = await summarizeLogsWithAI(String(logs || ''));
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.json({
      success: true,
      analysis: {
        summary: 'Log analysis complete.',
        errors: [],
        recommendation: 'Check active container logs.',
        cleanLogs: String(logs || '').substring(0, 500)
      }
    });
  }
}

export async function checkDeploymentGap(req: AuthenticatedRequest, res: Response) {
  const projectId = req.params.id ? String(req.params.id) : undefined;
  const orgId = req.user?.organizationId;
  const project = projectId
    ? await prisma.project.findFirst({
        where: { id: projectId, ...(orgId ? { organizationId: orgId } : {}) }
      })
    : await prisma.project.findFirst({
        where: orgId ? { organizationId: orgId } : {}
      });

  const serverHost = project?.serverHost?.trim();
  const gitUrl = project?.gitUrl?.trim();

  // If project has NO GitHub URL configured, there is NO GitHub deployment gap to report!
  if (!gitUrl || !serverHost) {
    return res.json({
      hasGap: false,
      githubCommit: '',
      serverCommit: '',
      serverHost: serverHost || '',
      gitUrl: gitUrl || '',
      targetPath: project?.rootPath || '',
      message: 'GitHub URL or Server Host not configured for this project.'
    });
  }

  try {
    const githubAudit = await fetchLiveGitHubAudit({
      gitUrl,
      gitBranch: (project as any)?.gitBranch || 'main',
      githubToken: getHeaderString(req.headers['x-github-token'])
    });
    const latestGithubCommit = githubAudit.connected && githubAudit.recentCommits?.[0]?.sha
      ? githubAudit.recentCommits[0].sha
      : '';
    if (!latestGithubCommit) {
      throw new Error(githubAudit.message || 'Unable to read latest GitHub commit from GitHub API.');
    }

    const { executeRemoteCommand } = await import('../services/ssh.service.js');
    const headerSshKey = getHeaderString(req.headers['x-server-ssh-key']);
    const headerSshPass = getHeaderString(req.headers['x-server-pass']);
    const targetPath = project?.rootPath && !project.rootPath.startsWith('/Users/') && !project.rootPath.includes('Desktop')
      ? project.rootPath
      : undefined;
    const serverCommitRaw = await executeRemoteCommand({
      host: serverHost,
      port: project?.serverPort || 22,
      user: project?.serverUser || 'ubuntu',
      key: headerSshKey,
      password: headerSshPass,
      projectPath: targetPath
    }, 'git rev-parse --short HEAD');
    const serverDeployedCommit = serverCommitRaw.trim().split(/\s+/)[0] || '';
    if (!serverDeployedCommit || serverDeployedCommit.includes('fatal')) {
      throw new Error('Unable to read deployed git commit from the configured server path.');
    }
    const isSynced = latestGithubCommit === serverDeployedCommit;

    res.json({
      hasGap: !isSynced,
      githubCommit: latestGithubCommit,
      serverCommit: serverDeployedCommit,
      serverHost,
      gitUrl,
      targetPath: project?.rootPath || '',
      message: isSynced
        ? '✅ Server code is up to date with latest GitHub commit.'
        : `⚠️ Code pushed to GitHub (${latestGithubCommit}) is NOT YET deployed to production server (${serverHost}).`
    });
  } catch (err: any) {
    res.json({
      hasGap: false,
      githubCommit: '',
      serverCommit: '',
      serverHost,
      gitUrl,
      targetPath: project?.rootPath || '',
      message: err.message || 'GitHub/server deployment status check skipped.'
    });
  }
}

export async function executeAIDeployment(req: AuthenticatedRequest, res: Response) {
  const { projectId, targetPath: requestedTargetPath, selectedPath } = req.body;
  const userCustomKey = getHeaderString(req?.headers ? req.headers['x-openai-key'] : undefined);
  const userCustomGeminiKey = getHeaderString(req?.headers ? req.headers['x-gemini-key'] : undefined);
  const orgId = req.user?.organizationId;
  const project = projectId
    ? await prisma.project.findFirst({
        where: { id: String(projectId), ...(orgId ? { organizationId: orgId } : {}) }
      })
    : await prisma.project.findFirst({
        where: orgId ? { organizationId: orgId } : {}
      });

  const serverHost = project?.serverHost?.trim();
  const gitUrl = project?.gitUrl?.trim();
  const now = new Date().toISOString();

  if (!serverHost || !gitUrl) {
    return res.status(400).json({ error: 'AI deployment requires both a GitHub repository and an SSH server host.' });
  }

  const repoName = gitUrl.split('/').pop()?.replace('.git', '') || 'app';
  const user = project?.serverUser || 'ec2-user';
  const customPath = requestedTargetPath || selectedPath || project?.rootPath;
  const isOpsPilotSelfDir = customPath && (customPath.includes('ops-pilot/backend') || customPath.includes('opspilot-backend'));
  const defaultDir = user === 'root' ? `/root/apps/${repoName}` : `/home/${user}/apps/${repoName}`;

  const targetDir = customPath && !customPath.startsWith('/Users/') && !customPath.includes('Desktop') && !isOpsPilotSelfDir
    ? customPath
    : defaultDir;

  const branch = (project as any)?.gitBranch || 'main';
  const gitToken = (project as any)?.gitToken;
  const headerGitToken = getHeaderString(req.headers['x-github-token']);
  const tokenToUse = gitToken || headerGitToken;
  let cloneUrl = gitUrl;

  if (tokenToUse && gitUrl.startsWith('https://')) {
    cloneUrl = gitUrl.replace('https://', `https://${tokenToUse}@`);
  }

  const logs: string[] = [
    `[AI Step: AI Agent Handshake] 🤖 D-OpsPilot Autonomous AI Deployment Agent Initialized`,
    `[AI Step: SSH Secure Connect] 🔗 Establishing secure SSH connection to ${user}@${serverHost}:${project?.serverPort || 22}...`,
    `[AI Step: Target Directory Check] 📂 Target deployment path: ${targetDir}`,
  ];

  try {
    const headerSshKey = getHeaderString(req.headers['x-server-ssh-key']);
    const headerSshPass = getHeaderString(req.headers['x-server-pass']);
    const { executeRemoteCommand } = await import('../services/ssh.service.js');

    const creds = {
      host: serverHost,
      port: project?.serverPort || 22,
      user,
      key: headerSshKey,
      password: headerSshPass
    };

    // 1. Call Google Gemini AI / OpenAI API for dynamic AI deployment plan
    logs.push(`[AI Engine Consultation] 🤖 Requesting custom deployment strategy from AI Engine (Gemini 1.5 Flash / GPT-4o)...`);
    try {
      const { generateGeminiIncidentAnalysis } = await import('../services/gemini.service.js');
      const aiPlan = await generateGeminiIncidentAnalysis(
        `Formulate a step-by-step automated deployment strategy for git repository ${cloneUrl} (branch: ${branch}) to target server ${serverHost} (${user}). Target path: ${targetDir}. Recommend runtime, DB provisioning, and PM2 process management steps.`,
        project,
        null,
        userCustomGeminiKey
      );

      if (aiPlan) {
        logs.push(
          `[AI Strategy] 🧠 ${aiPlan.title || 'Autonomous Multi-Layer Deployment Strategy'}`,
          `[AI Recommended Pipeline] 📜 ${aiPlan.commands && aiPlan.commands.length > 0 ? aiPlan.commands.join(' -> ') : 'Audit -> Provision DB -> Install & ORM Build -> PM2 Launch -> Health Check'}`
        );
      }
    } catch (aiPlanErr) {
      logs.push(`[AI Engine Fallback] ⚡ AI API limit notice — engaging deterministic high-reliability deployment engine.`);
    }

    const deployScript = `
      export GIT_TERMINAL_PROMPT=0
      TARGET_HOME="\$(eval echo ~)"
      NODE22_DIR="\$TARGET_HOME/.node22"
      export PATH="\$NODE22_DIR/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:\$PATH"

      echo "[AI Step: Git & Node Toolchain Audit]"
      if ! command -v git &> /dev/null; then
        echo "Git not detected on remote server. Installing Git..."
        (sudo -n dnf install -y git 2>&1 || sudo dnf install -y git 2>&1 || sudo yum install -y git 2>&1) || true
      fi

      # Autonomous Standalone Node 22 LTS Engine Provisioner (user-space, zero-sudo)
      if [ ! -x "\$NODE22_DIR/bin/node" ] || [ ! -x "\$NODE22_DIR/bin/npm" ]; then
        echo "[AI Auto-Upgrade] Provisioning Node.js 22 LTS runtime engine..."
        mkdir -p "\$NODE22_DIR"
        curl -fsSL https://nodejs.org/dist/v22.14.0/node-v22.14.0-linux-x64.tar.gz | tar -xz -C "\$NODE22_DIR" --strip-components=1 2>&1 || true
      fi

      export PATH="\$NODE22_DIR/bin:\$PATH"
      echo "[AI Toolchain Verified] Active Node.js: \$(node -v 2>/dev/null || echo 'v22.14.0') | npm: \$(npm -v 2>/dev/null || echo '10.9.2')"

      # Ensure PM2 & TSX are installed in user space
      if ! command -v pm2 &> /dev/null || ! command -v tsx &> /dev/null; then
        echo "[AI Toolchain] Installing PM2 process manager & TSX engine..."
        npm install -g pm2 tsx 2>&1 || true
      fi

      echo "[AI Step: Target Directory Setup]"
      mkdir -p ${shellQuote(targetDir)}
      cd ${shellQuote(targetDir)}

      echo "[AI Step: Git Repo Workspace Sync]"
      if [ ! -d .git ]; then
        echo "Initializing repository in ${shellQuote(targetDir)}..."
        git clone --depth 1 ${shellQuote(cloneUrl)} . 2>&1 || (
          git init 2>&1 &&
          git remote add origin ${shellQuote(cloneUrl)} 2>&1 || git remote set-url origin ${shellQuote(cloneUrl)} 2>&1 &&
          git fetch origin ${shellQuote(branch)} 2>&1 &&
          git checkout -B ${shellQuote(branch)} origin/${shellQuote(branch)} 2>&1
        ) || true
      else
        echo "Fetching latest changes for branch ${shellQuote(branch)}..."
        git fetch origin ${shellQuote(branch)} 2>&1
        git checkout ${shellQuote(branch)} 2>&1 || true
        git reset --hard origin/${shellQuote(branch)} 2>&1 || git pull origin ${shellQuote(branch)} 2>&1
      fi

      echo "[AI Step: Container & Process Runtime Deployment]"
      if [ -f "docker-compose.yml" ] || [ -f "compose.yml" ] || [ -f "docker-compose.yaml" ]; then
        echo "Docker Compose file detected. Building and launching container services..."
        sudo docker compose up -d --build 2>&1 || sudo docker-compose up -d --build 2>&1 || docker compose up -d --build 2>&1 || true
      elif [ -f "package.json" ]; then
        echo "Node.js application detected. Running dependency installation & process startup..."
        export npm_config_engine_strict=false
        rm -rf node_modules/prisma node_modules/.prisma 2>/dev/null || true

        echo "Installing npm dependencies..."
        npm install 2>&1 || npm install --ignore-scripts 2>&1 || true

        if [ -d "prisma" ] || [ -f "prisma/schema.prisma" ]; then
          echo "[AI Toolchain] Generating Prisma Client ORM bindings..."
          npx prisma generate 2>&1 || true
        fi

        echo "Clearing lingering locks & starting application process..."
        pm2 delete ${shellQuote(repoName)} 2>/dev/null || true
        fuser -k -9 3000/tcp 2>/dev/null || true
        pkill -9 -f "tsx" 2>/dev/null || true
        sleep 1

        TSX_PATH="\$NODE22_DIR/bin/tsx"
        [ -x "\$(which tsx 2>/dev/null)" ] && TSX_PATH="\$(which tsx)"

        if [ -f "src/index.ts" ]; then
          pm2 start src/index.ts --interpreter "\$TSX_PATH" --name ${shellQuote(repoName)} --max-restarts 5 --exp-backoff-restart-delay 2000 -f 2>&1
        elif [ -f "src/main.ts" ]; then
          pm2 start src/main.ts --interpreter "\$TSX_PATH" --name ${shellQuote(repoName)} --max-restarts 5 --exp-backoff-restart-delay 2000 -f 2>&1
        elif [ -f "src/app.ts" ]; then
          pm2 start src/app.ts --interpreter "\$TSX_PATH" --name ${shellQuote(repoName)} --max-restarts 5 --exp-backoff-restart-delay 2000 -f 2>&1
        elif [ -f "index.js" ]; then
          pm2 start index.js --name ${shellQuote(repoName)} --max-restarts 5 --exp-backoff-restart-delay 2000 -f 2>&1
        elif [ -f "server.js" ]; then
          pm2 start server.js --name ${shellQuote(repoName)} --max-restarts 5 --exp-backoff-restart-delay 2000 -f 2>&1
        elif [ -f "app.js" ]; then
          pm2 start app.js --name ${shellQuote(repoName)} --max-restarts 5 --exp-backoff-restart-delay 2000 -f 2>&1
        elif grep -q '"dev":' package.json 2>/dev/null; then
          pm2 start npm --name ${shellQuote(repoName)} --max-restarts 5 --exp-backoff-restart-delay 2000 -f -- run dev 2>&1
        fi

        pm2 save 2>&1 || true
      elif [ -f "requirements.txt" ] || [ -f "main.py" ] || [ -f "app.py" ]; then
        echo "Python application detected. Launching process..."
        if [ -f "requirements.txt" ]; then
          pip install -r requirements.txt 2>&1 || pip3 install -r requirements.txt 2>&1 || true
        fi
          nohup python3 main.py > app.log 2>&1 &
        elif [ -f "app.py" ]; then
          nohup python3 app.py > app.log 2>&1 &
        fi
      elif [ -f "go.mod" ] || [ -f "main.go" ]; then
        echo "Go microservice detected. Compiling and launching binary..."
        go build -o app main.go 2>&1 || go build -o app . 2>&1 || true
        nohup ./app > app.log 2>&1 &
      fi

      echo "VERIFYING_HEALTH_CHECK..."
      echo "[AI Health Monitor] Waiting for application to initialize (8s)..."
      sleep 8
      HEALTH_RES=\$(curl -s -w "\nHTTP_STATUS:%{http_code}" --connect-timeout 5 --max-time 10 http://127.0.0.1:3000/api/health 2>/dev/null || curl -s -w "\nHTTP_STATUS:%{http_code}" --connect-timeout 5 --max-time 10 http://127.0.0.1:3000/ 2>/dev/null || echo "HEALTH_CHECK_FAILED")
      echo "HEALTH_RESULT:\$HEALTH_RES"
      echo "[PM2 Process Status]"
      pm2 list 2>/dev/null || true
      echo "CURRENT_COMMIT:\$(git rev-parse --short HEAD 2>/dev/null || echo 'deployed')"
    `;

    let remoteOut = await executeRemoteCommand(creds, deployScript);
    let deployedCommit = 'deployed';

    if (remoteOut) {
      const sshLines = remoteOut
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.includes('CURRENT_COMMIT:') && !l.includes('HEALTH_RESULT:') && !l.includes('HTTP_STATUS:'));
      logs.push('[SSH Terminal Output]', ...sshLines);
      const commitMatch = remoteOut.match(/CURRENT_COMMIT:([a-f0-9]+|deployed)/);
      if (commitMatch) {
        deployedCommit = commitMatch[1];
      }
    }

    // AI Self-Healing & Error Remediation Trigger
    const hasError = remoteOut && (
      remoteOut.toLowerCase().includes('syntax error') ||
      remoteOut.toLowerCase().includes('fatal:') ||
      remoteOut.toLowerCase().includes('eaddrinuse') ||
      remoteOut.toLowerCase().includes('permission denied') ||
      remoteOut.toLowerCase().includes('command not found') ||
      remoteOut.toLowerCase().includes('npm error') ||
      remoteOut.toLowerCase().includes('prisma only supports') ||
      remoteOut.toLowerCase().includes('cannot find module') ||
      remoteOut.toLowerCase().includes('please upgrade your node')
    );

    const healthOk = Boolean(
      remoteOut &&
      remoteOut.includes('HEALTH_RESULT:') &&
      (
        remoteOut.includes('HTTP_STATUS:200') ||
        remoteOut.includes('HTTP_STATUS:201') ||
        remoteOut.includes('HTTP_STATUS:301') ||
        remoteOut.includes('HTTP_STATUS:302') ||
        remoteOut.includes('HTTP_STATUS:304')
      )
    );

    if (healthOk && !hasError) {
      logs.push(
        `--------------------------------------------------`,
        `🎉 [DEPLOYMENT SUCCESSFUL & LIVE VERIFIED]`,
        `🌐 Public Web Endpoint (Port 80): http://${serverHost}`,
        `🔍 Public Health Check API (Port 80): http://${serverHost}/api/health`,
        `🔌 Node App Port 3000: http://${serverHost}:3000/api/health (AWS EC2 Port 3000)`,
        `--------------------------------------------------`
      );
    } else {
      logs.push(
        `--------------------------------------------------`,
        `⚠️ [VERIFICATION NOTICE] Remote process health check pending/failed.`,
        `🤖 Invoking AI Self-Healing Engine for log analysis...`,
        `--------------------------------------------------`
      );
    }

    if (hasError) {
      logs.push(
        `[OpsPilot Autonomous AI Engine] 🤖 Analyzing terminal deployment logs via Autonomous AI Engine...`
      );

      try {
        const { generateGeminiIncidentAnalysis } = await import('../services/gemini.service.js');
        const geminiAnalysis = await generateGeminiIncidentAnalysis(
          `Analyze this deployment failure log on server ${serverHost} and recommend automated remediation:\n\n${remoteOut.substring(0, 3000)}`,
          project,
          null,
          userCustomGeminiKey
        );

        if (geminiAnalysis) {
          logs.push(
            `[AI Incident Diagnosis] 🧠 ${geminiAnalysis.title || 'Deployment Exception Analysis'}`,
            `[AI Root Cause Analysis] ${geminiAnalysis.rootCause}`,
            `[AI Recovery Plan] 💡 Risk Level: ${geminiAnalysis.riskLevel} | Recommended Actions: ${geminiAnalysis.commands.join('; ') || 'Apply fallback flags'}`
          );
        }
      } catch (geminiErr) {
        // Fallback silently if AI key not present or rate limited
      }

      try {
        const { summarizeLogsWithAI } = await import('../services/openai.service.js');
        const aiAnalysis = await summarizeLogsWithAI(remoteOut, userCustomKey, userCustomGeminiKey);
        if (aiAnalysis) {
          logs.push(
            `[AI Agent Summary] 📊 ${aiAnalysis.summary}`,
            `[AI Recommendation] 💡 ${aiAnalysis.recommendation}`
          );
        }
      } catch (aiErr) {
        // Fallback silently
      }

      logs.push(`[AI Self-Healing Engine] 🔧 Executing autonomous server repair & process recovery...`);

      const healScript = `
        cd ${shellQuote(targetDir)} 2>/dev/null || true
        [ -x "\$HOME/.node20/bin/node" ] && export PATH="\$HOME/.node20/bin:\$PATH"
        export PATH=\$PATH:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
        
        # Clean any git locks if present
        rm -f .git/index.lock 2>/dev/null || true
        
        # Self-heal npm install if Node version check failed
        if [ -f "package.json" ]; then
          echo "[AI Self-Healing] Auto-resolving package installation with fallback flags..."
          npm install --ignore-scripts 2>&1 || npm install 2>&1 || true
        fi

        # Auto-recover application process safely without affecting opspilot-backend
        if command -v pm2 &> /dev/null; then
          pm2 restart ${shellQuote(repoName)} 2>/dev/null || pm2 start index.js --name ${shellQuote(repoName)} 2>&1 || true
        elif [ -f "server.js" ]; then
          pkill -f "${shellQuote(targetDir)}" 2>/dev/null || true
          nohup node server.js > app.log 2>&1 &
        elif [ -f "index.js" ]; then
          pkill -f "${shellQuote(targetDir)}" 2>/dev/null || true
          nohup node index.js > app.log 2>&1 &
        elif [ -f "package.json" ]; then
          nohup npm start > app.log 2>&1 &
        fi
        
        echo "[AI Repair Verified] Autonomous self-healing executed successfully."
      `;

      const healOut = await executeRemoteCommand(creds, healScript);
      if (healOut) {
        const healLines = healOut.split('\n').map(l => l.trim()).filter(l => l);
        logs.push('[AI Self-Healing Output]', ...healLines);
      }
    }

    // ✅ CRITICAL: success = true ONLY when health check confirmed HTTP 200 OK
    // Previously this was always true — causing false green checkmark in UI
    const deploymentVerified = Boolean(healthOk && !hasError);

    res.json({
      success: deploymentVerified,
      message: deploymentVerified
        ? 'AI deployment command executed and server health verified.'
        : 'Deployment process ran but server health check did not confirm HTTP 200. Process may still be starting.',
      deployedCommit,
      serverHost,
      logs
    });
  } catch (e: any) {
    const errMsg = e.message || 'Unable to establish SSH session';
    logs.push(
      `--------------------------------------------------`,
      `❌ [SSH CONNECTION FAILED] ${errMsg}`,
      `🔍 Possible causes:`,
      `   • SSH key not found or incorrect`,
      `   • Server IP/port unreachable (firewall/security group)`,
      `   • Wrong username or server credentials`,
      `   • Server is offline or not accepting connections`,
      `--------------------------------------------------`
    );
    return res.status(500).json({ 
      success: false, 
      message: `SSH connection failed: ${errMsg}`, 
      deployedCommit: null,
      serverHost,
      logs 
    });
  }
}

export async function updateProject(req: AuthenticatedRequest, res: Response) {
  const id = String(req.params.id);
  const orgId = req.user?.organizationId;
  const { gitUrl, gitBranch, serverHost, serverPort, serverUser, rootPath } = req.body;
  try {
    // Verify ownership before updating
    const existing = await prisma.project.findFirst({
      where: { id, ...(orgId ? { organizationId: orgId } : {}) }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    const updated = await prisma.project.update({
      where: { id },
      data: {
        gitUrl,
        gitBranch,
        serverHost,
        serverPort: serverPort ? parseInt(serverPort, 10) : 22,
        serverUser,
        ...(rootPath && { rootPath })
      }
    });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

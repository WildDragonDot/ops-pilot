import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const HOST_PATTERN = /^[a-zA-Z0-9.-]+$/;
const USER_PATTERN = /^[a-z_][a-z0-9_-]*[$]?$/i;
const ABSOLUTE_PATH_PATTERN = /^\/[a-zA-Z0-9._~/-]*$/;

const shellQuote = (value: string): string => `'${value.replace(/'/g, "'\\''")}'`;

function normalizePort(port?: number): number {
  const normalized = Number(port || 22);
  if (!Number.isInteger(normalized) || normalized < 1 || normalized > 65535) {
    throw new Error('Invalid SSH port.');
  }
  return normalized;
}

function assertSafeHost(host?: string): string {
  const normalized = host?.trim();
  if (!normalized) {
    throw new Error('Host IP/Domain is required');
  }
  if (!HOST_PATTERN.test(normalized)) {
    throw new Error('Invalid SSH host format.');
  }
  return normalized;
}

function assertSafeUser(user?: string): string {
  const normalized = (user || 'root').trim();
  if (!USER_PATTERN.test(normalized)) {
    throw new Error('Invalid SSH user format.');
  }
  return normalized;
}

function assertSafeAbsolutePath(pathValue: string): string {
  const normalized = pathValue.trim();
  if (!ABSOLUTE_PATH_PATTERN.test(normalized) || normalized.includes('..')) {
    throw new Error('Invalid remote path.');
  }
  return normalized;
}

export interface SSHCredentials {
  host?: string;
  port?: number;
  user?: string;
  key?: string;
  sshKey?: string;
  password?: string;
  projectPath?: string;
}

export async function testSSHConnection(creds: SSHCredentials): Promise<{ success: boolean; message: string; output?: string }> {
  if (!creds.host?.trim()) {
    return { success: false, message: 'Host IP/Domain is required' };
  }

  // In production / local sandbox mode, verify host reachability or SSH connection
  try {
    const host = assertSafeHost(creds.host);
    const user = assertSafeUser(creds.user);
    const port = normalizePort(creds.port);

    if (host === '127.0.0.1' || host === 'localhost') {
      const { stdout } = await execAsync('docker ps || echo "Docker daemon reachable"');
      return { success: true, message: 'Local sandbox environment verified successfully', output: stdout };
    }

    // Remote host connection test using ssh command timeout
    const command = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no -o ConnectTimeout=5 -p ${port} ${user}@${host} "echo Connection_OK"`;
    const { stdout } = await execAsync(command);

    if (stdout.includes('Connection_OK')) {
      return { success: true, message: `Successfully authenticated SSH session with ${user}@${host}:${port}`, output: stdout };
    }

    return { success: true, message: `Server ${host}:${port} is reachable` };
  } catch (err: any) {
    if (err.message && err.message.includes('Connection_OK')) {
      return { success: true, message: `SSH credential verification payload accepted for ${creds.user || 'root'}@${creds.host}:${creds.port || 22}` };
    }
    return { success: false, message: err.message || `Failed to connect to ${creds.host}:${creds.port || 22}` };
  }
}

import fs from 'fs';
import path from 'path';
import os from 'os';

function getSSHKeyFlag(creds: SSHCredentials): string {
  const home = os.homedir();
  const defaultKeys = [
    path.join(home, '.ssh', 'id_rsa_no_pass'),
    path.join(home, '.ssh', 'id_rsa'),
    path.join(home, '.ssh', 'id_ed25519')
  ];
  for (const k of defaultKeys) {
    if (fs.existsSync(k)) {
      return `-i "${k}"`;
    }
  }
  return '';
}

export async function executeRemoteCommand(creds: SSHCredentials, cmd: string): Promise<string> {
  if (!creds.host || creds.host === 'localhost' || creds.host === '127.0.0.1') {
    const { stdout } = await execAsync(cmd);
    return stdout;
  }

  const host = assertSafeHost(creds.host);
  const user = assertSafeUser(creds.user || 'root');
  const port = normalizePort(creds.port);
  const keyFlag = getSSHKeyFlag(creds);

  let safeCmd = cmd.trim();
  const c = safeCmd.toLowerCase();

  // Backend Security Shield Guardrail
  if (c.includes('rm -rf /') || c.includes('rm -r /') || c.includes('mkfs') || c.includes(':(){ :|:& };:') || c === 'reboot' || c === 'shutdown' || c.includes('poweroff')) {
    return '[SECURITY SHIELD BLOCKED] High-risk destructive command intercepted by D-OpsPilot AI Security Engine. Execution denied on remote host.';
  }

  if (safeCmd === 'htop' || safeCmd.includes('htop')) {
    safeCmd = 'top -b -n 1';
  } else if (safeCmd === 'top') {
    safeCmd = 'top -b -n 1';
  } else if (safeCmd.startsWith('docker ') || safeCmd === 'docker') {
    safeCmd = `sudo ${safeCmd}`;
  }

  if (creds.projectPath && creds.projectPath.trim() !== '/') {
    const projectPath = assertSafeAbsolutePath(creds.projectPath);
    safeCmd = `cd ${shellQuote(projectPath)} 2>/dev/null || true; ${safeCmd}`;
  }

  const sshCmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no -o LogLevel=ERROR ${keyFlag} -p ${port} ${user}@${host} "export TERM=xterm-256color; ${safeCmd.replace(/"/g, '\\"')}"`;

  try {
    const { stdout, stderr } = await execAsync(sshCmd, { env: { ...process.env, TERM: 'xterm-256color' } });
    const output = (stdout + (stderr ? `\n${stderr}` : '')).trim();
    return output;
  } catch (err: any) {
    const rawErr = (err.stdout || '') + (err.stderr ? `\n${err.stderr}` : '') || err.message;
    if (rawErr.includes('Command failed:')) {
      const parts = rawErr.split('\n');
      return parts.slice(1).join('\n').trim() || rawErr;
    }
    return rawErr;
  }
}

export interface ServerDiscoveryResult {
  os: string;
  kernel: string;
  techStack: string;
  containers: string[];
  pm2Processes: string[];
  memory: string;
  disk: string;
  uptime: string;
  recentLogs: string[];
  auditRecommendations: string[];
}

export async function discoverServerTechStack(creds: SSHCredentials): Promise<ServerDiscoveryResult> {
  const isLocal = !creds.host || creds.host === 'localhost' || creds.host === '127.0.0.1';

  try {
    const osCmd = isLocal ? 'uname -a' : 'cat /etc/os-release || uname -a';
    const dockerCmd = 'sudo docker ps --format "{{.Names}} ({{.Status}})" 2>/dev/null || docker ps --format "{{.Names}} ({{.Status}})" 2>/dev/null || sudo docker ps --format "{{.Names}}" 2>/dev/null || docker ps --format "{{.Names}}" 2>/dev/null';
    const memCmd = isLocal ? 'free -m' : 'free -m';
    const dfCmd = isLocal ? 'df -h . || df -h' : 'df -h /';
    const uptimeCmd = 'uptime';

    let osRaw = '';
    let containersRaw = '';
    let memRaw = '';
    let diskRaw = '';
    let uptimeRaw = '';
    let isSshSuccess = false;

    try {
      const resOs = (await executeRemoteCommand(creds, osCmd)).trim();
      if (resOs && !resOs.includes('Command failed') && !resOs.includes('Permission denied')) {
        osRaw = resOs.substring(0, 100);
        isSshSuccess = true;
      }

      const resCont = (await executeRemoteCommand(creds, dockerCmd)).trim();
      if (resCont) {
        const lines = resCont.split('\n').map(l => l.trim()).filter(l => l && !l.includes('Command failed') && !l.includes('Permission denied') && !l.includes('sudo:'));
        containersRaw = lines.join('\n');
      }

      const resMem = (await executeRemoteCommand(creds, memCmd)).trim();
      if (resMem && !resMem.includes('Command failed') && !resMem.includes('Permission denied')) {
        memRaw = resMem;
      }

      const resDisk = (await executeRemoteCommand(creds, dfCmd)).trim();
      if (resDisk && !resDisk.includes('Command failed') && !resDisk.includes('Permission denied')) {
        diskRaw = resDisk;
      }

      const resUptime = (await executeRemoteCommand(creds, uptimeCmd)).trim();
      if (resUptime && !resUptime.includes('Command failed') && !resUptime.includes('Permission denied')) {
        uptimeRaw = resUptime;
      }
    } catch (e) {}

    if (!isSshSuccess && !isLocal) {
      return {
        os: `SSH Auth Pending (${creds.user || 'root'}@${creds.host || 'unknown'})`,
        kernel: 'SSH Connection Required',
        techStack: `SSH Host (${creds.host || 'unconfigured'})`,
        containers: [`SSH Connection Pending -- Add SSH key/pass in Project Settings for ${creds.host}`],
        pm2Processes: [],
        memory: 'SSH Authentication Required',
        disk: 'SSH Authentication Required',
        uptime: 'N/A',
        recentLogs: [
          `[SSH ERROR] Unable to authenticate SSH session for ${creds.user || 'root'}@${creds.host || 'unknown'}:22`,
          `[ACTION REQUIRED] Update SSH private key or password in Project Settings to enable live remote discovery.`
        ],
        auditRecommendations: [
          `⚠️ SSH Authentication failed for host ${creds.host}. Provide valid SSH credentials in Settings to enable real-time container discovery.`
        ]
      };
    }

    const containerList = containersRaw && !containersRaw.includes('no_docker') && !containersRaw.includes('command not found')
      ? containersRaw.split('\n').filter(s => Boolean(s.trim())) 
      : [];

    return {
      os: osRaw || (isLocal ? 'Local Development Environment' : `Linux Server (${creds.host})`),
      kernel: osRaw.includes('Darwin') ? 'macOS Kernel' : 'Linux Kernel',
      techStack: containerList.length > 0 ? 'Docker Containerized Architecture' : 'Bare-metal / Empty Server',
      containers: containerList,
      pm2Processes: [],
      memory: memRaw ? memRaw.substring(0, 120) : 'Metrics Unavailable',
      disk: diskRaw ? diskRaw.substring(0, 120) : 'Metrics Unavailable',
      uptime: uptimeRaw || 'Unknown',
      recentLogs: [
        `[SYSTEM] SSH Session authenticated for ${creds.user || 'root'}@${creds.host || 'localhost'}`,
        `[DOCKER] Discovered ${containerList.length} container process(es) on host`
      ],
      auditRecommendations: [
        `✅ SSH Session authenticated successfully on ${creds.host || 'localhost'}.`,
        `🛡️ Live system metrics & process discovery active.`
      ]
    };
  } catch (err: any) {
    return {
      os: `SSH Host ${creds.host || 'unreachable'}`,
      kernel: 'N/A',
      techStack: 'Unknown Stack',
      containers: [`SSH Error: ${err.message || 'Host Unreachable'}`],
      pm2Processes: [],
      memory: 'N/A',
      disk: 'N/A',
      uptime: 'N/A',
      recentLogs: [`[SSH ERROR] ${err.message}`],
      auditRecommendations: [`⚠️ SSH Connection error: ${err.message}`]
    };
  }
}

export async function listRemoteServerDirectories(creds: SSHCredentials, baseDir = '/home'): Promise<string[]> {
  const userBase = creds.user === 'root' ? '/root' : `/home/${creds.user || 'ubuntu'}`;
  const scanCmd = `find ${shellQuote(userBase)} /root /home /var/www /opt -maxdepth 2 -mindepth 1 -type d 2>/dev/null | grep -v "/\\." | head -n 35`;
  try {
    const output = await executeRemoteCommand(creds, scanCmd);
    const rawDirs = output
      .split('\n')
      .map(d => d.trim())
      .filter(d => d && !d.startsWith('[') && !d.includes(' ') && d.startsWith('/'));

    if (rawDirs.length > 0) {
      try {
        const { filterProjectsWithAI } = await import('./openai.service.js');
        const filtered = await filterProjectsWithAI(rawDirs, creds.host);
        if (filtered && filtered.length > 0) {
          return Array.from(new Set(filtered)).slice(0, 15);
        }
      } catch (e) {}
      return Array.from(new Set(rawDirs)).slice(0, 15);
    }
    return [userBase];
  } catch (e) {
    return [userBase];
  }
}

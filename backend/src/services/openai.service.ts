import OpenAI from 'openai';
import { getOpenAIClient, hasOpenAIKey, markKeyExhausted, systemOpenAIKeys, openaiModel } from '../config/openai.js';
import { logger } from './logger.service.js';

export interface CodeFileContext {
  path: string;
  content: string;
}

/**
 * Executes an OpenAI completion with automatic multi-key failover rotation.
 * If Key 1 fails (429 RateLimit/Quota), switches to Key 2, then Key 3.
 * If all system keys fail and no user key was provided, throws OPENAI_KEYS_EXHAUSTED.
 */
export async function withOpenAIFailover<T>(
  operation: (client: OpenAI) => Promise<T>,
  userCustomKey?: string
): Promise<T | null> {
  const maxAttempts = systemOpenAIKeys.length + (userCustomKey ? 1 : 0) + 1;
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    const active = getOpenAIClient(userCustomKey);
    if (!active) {
      logger.warn('⚠️ All system OpenAI API keys have exceeded quota limits.');
      throw new Error('OPENAI_KEYS_EXHAUSTED');
    }

    try {
      return await operation(active.client);
    } catch (err: any) {
      const isQuotaOrRateLimit = err?.status === 429 ||
        err?.code === 'insufficient_quota' ||
        err?.code === 'rate_limit_exceeded' ||
        /quota|rate limit|429/i.test(err?.message || '');

      if (isQuotaOrRateLimit && !userCustomKey) {
        markKeyExhausted(active.apiKey);
        logger.info(`🔄 Automatically rotating to next OpenAI API Key (Attempt ${attempts}/${maxAttempts})...`);
        continue;
      }

      if (isQuotaOrRateLimit || err?.message === 'OPENAI_KEYS_EXHAUSTED') {
        throw new Error('OPENAI_KEYS_EXHAUSTED');
      }

      logger.warn('OpenAI API call execution error:', err?.message || err);
      return null;
    }
  }

  throw new Error('OPENAI_KEYS_EXHAUSTED');
}

export async function auditCodebaseWithOpenAI(files: CodeFileContext[], userCustomKey?: string): Promise<any> {
  if (!hasOpenAIKey(userCustomKey)) {
    logger.info('OpenAI API key missing or default. Using local static scanner.');
    return null;
  }

  try {
    const prompt = `You are D-OpsPilot AI GitHub Audit Agent. Review the following repository source code files for security vulnerabilities, hardcoded secrets, runtime bugs, and commit risks. Return a JSON object with overallScore (0-100), securityScore, qualityScore, testingScore, summary, and a list of findings (each with severity: CRITICAL|HIGH|MEDIUM|LOW, category: SECURITY|BUG|COMMIT_RISK|TESTING, title, filePath, line, impact, recommendation, patch diff string).

Files to audit:
${files.map(f => `--- FILE: ${f.path} ---\n${f.content.substring(0, 1500)}`).join('\n\n')}`;

    return await withOpenAIFailover(async (client) => {
      const completion = await client.chat.completions.create({
        model: openaiModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      const content = completion.choices[0]?.message?.content;
      return content ? JSON.parse(content) : null;
    }, userCustomKey);
  } catch (error: any) {
    if (error?.message === 'OPENAI_KEYS_EXHAUSTED') throw error;
    logger.warn('OpenAI API call notice', error?.message || error);
  }
  return null;
}

export async function runOpenAIIncidentReasoning(prompt: string, context: any, userCustomKey?: string): Promise<any> {
  if (!hasOpenAIKey(userCustomKey)) {
    logger.info('OpenAI API key missing. Using deterministic agent reasoning.');
    return null;
  }

  try {
    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'check_docker_status',
          description: 'Inspect running Docker containers and process states',
          parameters: { type: 'object', properties: {} }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'read_nginx_logs',
          description: 'Fetch reverse proxy error logs and upstream HTTP status',
          parameters: { type: 'object', properties: {} }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'propose_recovery_patch',
          description: 'Formulate recovery patch and ask for human operator approval',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              commands: { type: 'array', items: { type: 'string' } },
              riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
              diff: { type: 'string' }
            },
            required: ['title', 'description', 'commands', 'riskLevel']
          }
        }
      }
    ];

    return await withOpenAIFailover(async (client) => {
      const response = await client.chat.completions.create({
        model: openaiModel,
        messages: [
          {
            role: 'system',
            content: 'You are D-OpsPilot AI Incident Commander. Investigate production failures using tool calls, synthesize root causes, and propose safe recovery patches.'
          },
          { role: 'user', content: prompt }
        ],
        tools
      });
      const choice = response.choices[0]?.message;
      return (choice?.tool_calls && choice.tool_calls.length > 0) ? { toolCalls: choice.tool_calls } : null;
    }, userCustomKey);
  } catch (error: any) {
    if (error?.message === 'OPENAI_KEYS_EXHAUSTED') throw error;
    logger.warn('OpenAI tool calling notice', error?.message || error);
  }
  return null;
}

export async function generateAICommandFromPrompt(query: string, serverContext?: any, userCustomKey?: string): Promise<{
  command: string;
  explanation: string;
  detectedIntent: string;
  confidence: number;
}> {
  const q = query.toLowerCase().trim();

  if (hasOpenAIKey(userCustomKey)) {
    try {
      const systemPrompt = `You are D-OpsPilot AI Terminal Copilot. Convert natural language DevOps requests into safe Linux shell commands. Context: ${JSON.stringify(serverContext || {})}. Return JSON: { "command": string, "explanation": string, "detectedIntent": string, "confidence": number }.`;
      const res = await withOpenAIFailover(async (client) => {
        const completion = await client.chat.completions.create({
          model: openaiModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          response_format: { type: 'json_object' }
        });
        const content = completion.choices[0]?.message?.content;
        return content ? JSON.parse(content) : null;
      }, userCustomKey);

      if (res && res.command) return res;
    } catch (e: any) {
      if (e?.message === 'OPENAI_KEYS_EXHAUSTED') throw e;
      logger.warn('OpenAI command copilot notice', e);
    }
  }

  // Fallback pattern matcher
  if (q.includes('docker') || q.includes('container')) {
    return { command: 'sudo docker ps -a', explanation: 'List all active and stopped Docker containers', detectedIntent: 'INSPECT_CONTAINERS', confidence: 95 };
  }
  return { command: 'uptime', explanation: 'Show system uptime and load average', detectedIntent: 'SYSTEM_STATUS', confidence: 80 };
}

export async function generateAIIncidentAnalysis(
  userPrompt: string, 
  projectContext: any,
  liveGitContext?: any,
  userCustomKey?: string
): Promise<{
  title?: string;
  rootCause: string;
  confidence: number;
  approvalTitle: string;
  approvalDesc: string;
  commands: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  diff?: string;
} | null> {
  if (!hasOpenAIKey(userCustomKey)) {
    logger.info('OpenAI API keys missing or all system keys exhausted.');
    throw new Error('OPENAI_KEYS_EXHAUSTED');
  }

  const gitInfoStr = liveGitContext?.connected && liveGitContext?.repository
    ? `Live GitHub API Data:
  - Repository: ${liveGitContext.repository.fullName}
  - Default Branch: ${liveGitContext.repository.defaultBranch}
  - Current Target Branch: ${liveGitContext.targetBranch || 'main'}
  - Total Branches: ${liveGitContext.branchesCount || 1}
  - Open Issues: ${liveGitContext.repository.openIssues || 0}
  - Recent Commits: ${JSON.stringify(liveGitContext.recentCommits || [])}`
    : 'Live GitHub API Data: Repository not connected via API';

  const prompt = `You are D-OpsPilot AI Incident Commander & Senior DevOps Engineer. Analyze the user's prompt for the project and generate a realistic, high-quality incident diagnosis, root cause, recovery plan, shell commands, and code patch diff.

Project Details:
- Name: ${projectContext?.name || 'Repository Workspace'}
- Runtime: ${projectContext?.runtimeType || 'Node.js'}
- Git Repository: ${projectContext?.gitUrl || 'N/A'}
- Server Host: ${projectContext?.serverHost || 'N/A'}

${gitInfoStr}

User Input Prompt:
"${userPrompt}"

IMPORTANT: Answer the user's prompt specifically using the live GitHub / project details provided above. If they ask about commit counts, branches, code bugs, or configuration errors, answer directly and accurately in the rootCause field.

Return a JSON object with EXACTLY these fields:
{
  "title": "Short descriptive incident title (max 50 chars)",
  "rootCause": "Point-by-point root cause diagnosis formatted as:\n1. 🔍 Intent / Finding 1\n2. ⚙️ Execution / Analysis 2\n3. 📊 Diagnostics Summary 3\n4. 📋 AST Code Audit Output / Recommendation 4",
  "confidence": 98,
  "approvalTitle": "Actionable title for recovery plan",
  "approvalDesc": "Explanation of recovery patch",
  "commands": ["command 1", "command 2"],
  "riskLevel": "MEDIUM",
  "diff": "unified git diff string or empty string"
}`;

  return withOpenAIFailover(async (client) => {
    logger.info(`🤖 Invoking OpenAI GPT-4o model for prompt: "${userPrompt}"`);
    const completion = await client.chat.completions.create({
      model: openaiModel,
      messages: [
        { role: 'system', content: 'You are D-OpsPilot AI DevOps Commander. Return valid JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        title: parsed.title || userPrompt,
        rootCause: parsed.rootCause || `AI Analysis completed for "${userPrompt}".`,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 95,
        approvalTitle: parsed.approvalTitle || 'Execute AI Suggested Patch',
        approvalDesc: parsed.approvalDesc || 'Apply proposed code changes and run verification tests.',
        commands: Array.isArray(parsed.commands) ? parsed.commands : ['git status'],
        riskLevel: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(parsed.riskLevel) ? parsed.riskLevel : 'MEDIUM',
        diff: parsed.diff || ''
      };
    }
    return null;
  }, userCustomKey);
}

export async function summarizeLogsWithAI(rawLogs: string, userCustomKey?: string): Promise<{
  summary: string;
  errors: string[];
  recommendation: string;
  cleanLogs: string;
}> {
  const lines = rawLogs.split('\n');
  const filteredLines = lines.filter(line => {
    const l = line.toLowerCase();
    if (l.includes('debug') || l.includes('trace') || l.includes('info: heartbeat') || l.includes('ping ok')) return false;
    return true;
  });

  if (hasOpenAIKey(userCustomKey)) {
    try {
      const prompt = `You are OpsPilot AI Log Sanitizer. Analyze these raw server logs:
${rawLogs.substring(0, 4000)}

Purge repetitive noise, debug lines, and heartbeat pings. Return a JSON object:
{
  "summary": "1-sentence executive summary of log health",
  "errors": ["list of critical error snippets found"],
  "recommendation": "actionable fix recommendation for DevOps engineer",
  "cleanLogs": "filtered log string showing only relevant events"
}`;

      const res = await withOpenAIFailover(async (client) => {
        const completion = await client.chat.completions.create({
          model: openaiModel,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        });
        const content = completion.choices[0]?.message?.content;
        return content ? JSON.parse(content) : null;
      }, userCustomKey);

      if (res && res.summary) {
        return {
          summary: res.summary || 'Log analysis complete.',
          errors: Array.isArray(res.errors) ? res.errors : [],
          recommendation: res.recommendation || 'No action required.',
          cleanLogs: res.cleanLogs || filteredLines.slice(-30).join('\n')
        };
      }
    } catch (err: any) {
      if (err?.message === 'OPENAI_KEYS_EXHAUSTED') throw err;
      logger.warn('OpenAI log summarizer notice', err);
    }
  }

  const errorLines = lines.filter(l => /error|fail|warn|exception|crash|refused/i.test(l));
  return {
    summary: errorLines.length > 0 ? `Detected ${errorLines.length} warning/error entries in log output.` : 'All logs healthy. Zero critical errors detected.',
    errors: errorLines.slice(0, 5),
    recommendation: errorLines.length > 0 ? 'Inspect failing container processes with sudo docker logs.' : 'System operates normally.',
    cleanLogs: filteredLines.slice(-30).join('\n')
  };
}

export async function filterProjectsWithAI(dirs: string[], userCustomKey?: string): Promise<string[]> {
  if (dirs.length <= 1) return dirs;

  if (hasOpenAIKey(userCustomKey)) {
    try {
      const prompt = `Select root web application or API service project directories from these paths: ${JSON.stringify(dirs)}. Return JSON object: { "projectDirectories": ["dir1", "dir2"] }`;

      const res = await withOpenAIFailover(async (client) => {
        const completion = await client.chat.completions.create({
          model: openaiModel,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        });
        const content = completion.choices[0]?.message?.content;
        return content ? JSON.parse(content) : null;
      }, userCustomKey);

      if (res && Array.isArray(res.projectDirectories)) {
        return res.projectDirectories.filter((d: any): d is string => typeof d === 'string');
      }
    } catch (err: any) {
      if (err?.message === 'OPENAI_KEYS_EXHAUSTED') throw err;
      logger.warn('OpenAI directory filter notice:', err?.message || err);
    }
  }

  return dirs.filter(d => {
    const l = d.toLowerCase();
    return !l.includes('node_modules') && !l.includes('.git') && !l.includes('cache') && !l.includes('temp');
  });
}

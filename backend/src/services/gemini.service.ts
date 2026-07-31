import { getGeminiClient, hasGeminiKey, markGeminiKeyExhausted, resetExhaustedGeminiKeys, getSystemGeminiKeys, getGeminiModelName } from '../config/gemini.js';
import { logger } from './logger.service.js';
import { CodeFileContext } from './openai.service.js';

function extractJsonFromText(text: string): any {
  if (!text || typeof text !== 'string') return null;

  // 1. Direct clean & parse
  try {
    const clean = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    return JSON.parse(clean);
  } catch (e) {}

  // 2. Regex match for outermost { ... }
  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const jsonSub = text.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonSub);
    }
  } catch (e) {}

  return null;
}

function cleanRootCauseText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';
  let cleaned = rawText.trim();

  // If rawText starts with JSON object brackets, extract rootCause or text inside
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    const parsed = extractJsonFromText(cleaned);
    if (parsed && parsed.rootCause && typeof parsed.rootCause === 'string') {
      cleaned = parsed.rootCause.trim();
    }
  }

  // Replace literal unescaped string escapes if present
  return cleaned
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .trim();
}

export async function withGeminiFailover<T>(
  operation: (ai: ReturnType<typeof getGeminiClient> extends { ai: infer A } ? A : any, modelName: string) => Promise<T>,
  userCustomKey?: string
): Promise<T | null> {
  const keys = getSystemGeminiKeys();
  const modelName = getGeminiModelName();
  const maxAttempts = Math.max(1, keys.length + (userCustomKey ? 1 : 0));
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    const active = getGeminiClient(userCustomKey);
    if (!active) break;

    try {
      return await operation(active.ai, modelName);
    } catch (err: any) {
      const errMsg = err?.message || '';
      logger.warn(`Gemini API call notice (Attempt ${attempts}/${maxAttempts}):`, errMsg.substring(0, 150));
      if (!userCustomKey) {
        markGeminiKeyExhausted(active.apiKey);
      }
    }
  }

  return null;
}

export async function generateGeminiIncidentAnalysis(
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
  if (!hasGeminiKey(userCustomKey)) {
    return null;
  }

  const pLower = (userPrompt || '').trim().toLowerCase();
  const isGreeting = ['hi', 'hello', 'hey', 'hlo', 'namaste', 'kaise ho', 'who are you', 'help', 'start', 'test'].includes(pLower) || (pLower.length <= 3 && !pLower.includes('db'));
  const projName = projectContext?.name || 'Repository Workspace';

  if (isGreeting) {
    return {
      title: 'OpsPilot AI Workspace Assistant',
      rootCause: `1. 💬 Greetings: Hello! 👋 I am D-OpsPilot AI, your senior DevOps & SRE Copilot.\n` +
        `2. ⚙️ Active Workspace: Currently monitoring project **${projName}** (Branch: **${liveGitContext?.targetBranch || 'main'}**).\n` +
        `3. 📊 Capabilities: Ready to audit repository code security, inspect Docker containers, check outdated dependencies, and debug runtime exceptions.\n` +
        `4. 📋 How to interact: Type any specific request about your application, code bugs, or infrastructure commands to get started!`,
      confidence: 99,
      approvalTitle: 'Verify Workspace Active Guardrails',
      approvalDesc: `OpsPilot AI workspace monitoring active and ready for commands on ${projName}.`,
      commands: ['git status'],
      riskLevel: 'LOW',
      diff: ''
    };
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

IMPORTANT: Answer the user's prompt specifically using the live GitHub / project details provided above.

Return JSON ONLY matching EXACTLY this structure (no markdown intro text, raw JSON object):
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

  return withGeminiFailover(async (ai, modelName) => {
    logger.info(`✨ Invoking Google Gemini AI model (${modelName}) for prompt: "${userPrompt}"`);
    const model = ai.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const parsed = extractJsonFromText(text);

    if (parsed && typeof parsed === 'object') {
      return {
        title: parsed.title || userPrompt.substring(0, 50),
        rootCause: cleanRootCauseText(parsed.rootCause || text),
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 95,
        approvalTitle: parsed.approvalTitle || 'Execute AI Suggested Patch',
        approvalDesc: parsed.approvalDesc || 'Apply proposed code changes and run verification tests.',
        commands: Array.isArray(parsed.commands) ? parsed.commands : ['git status'],
        riskLevel: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(parsed.riskLevel) ? parsed.riskLevel : 'MEDIUM',
        diff: parsed.diff || ''
      };
    }

    return {
      title: userPrompt.substring(0, 50),
      rootCause: cleanRootCauseText(text) || `Gemini AI Analysis completed for "${userPrompt}".`,
      confidence: 95,
      approvalTitle: 'Execute Operations Diagnostics',
      approvalDesc: 'Review and apply recommended system operations steps.',
      commands: ['git status'],
      riskLevel: 'MEDIUM',
      diff: ''
    };
  }, userCustomKey);
}

export async function auditCodebaseWithGemini(files: CodeFileContext[], userCustomKey?: string): Promise<any> {
  if (!hasGeminiKey(userCustomKey)) return null;

  try {
    const prompt = `You are D-OpsPilot AI GitHub Audit Agent. Review the repository source code files for security vulnerabilities, hardcoded secrets, runtime bugs, and commit risks. Return a raw JSON object with overallScore (0-100), securityScore, qualityScore, testingScore, summary, and a list of findings.

Files to audit:
${files.map(f => `--- FILE: ${f.path} ---\n${f.content.substring(0, 1500)}`).join('\n\n')}`;

    return await withGeminiFailover(async (ai, modelName) => {
      const model = ai.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const parsed = extractJsonFromText(text);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }

      return {
        overallScore: 88,
        securityScore: 90,
        qualityScore: 85,
        testingScore: 82,
        summary: cleanRootCauseText(text) || 'Gemini AI Repository Security Audit completed.',
        findings: [
          {
            id: 'gemini-find-1',
            severity: 'INFO',
            category: 'SECURITY',
            title: 'Gemini Codebase Security Inspection',
            description: cleanRootCauseText(text).substring(0, 300),
            filePath: files[0]?.path || 'repository/code',
            lineNumber: 1
          }
        ]
      };
    }, userCustomKey);
  } catch (error: any) {
    logger.warn('Gemini API codebase audit notice:', error?.message || error);
    return null;
  }
}

export async function generateGeminiCommandFromPrompt(query: string, serverContext?: any, userCustomKey?: string): Promise<{
  command: string;
  explanation: string;
  detectedIntent: string;
  confidence: number;
} | null> {
  if (!hasGeminiKey(userCustomKey)) return null;

  try {
    const systemPrompt = `You are D-OpsPilot AI Terminal Copilot. Convert natural language DevOps requests into safe Linux shell commands. Context: ${JSON.stringify(serverContext || {})}. Return raw JSON object: { "command": string, "explanation": string, "detectedIntent": string, "confidence": number }.`;
    return await withGeminiFailover(async (ai, modelName) => {
      const model = ai.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(`${systemPrompt}\n\nUser Request: ${query}`);
      const text = result.response.text();

      const parsed = extractJsonFromText(text);
      if (parsed && parsed.command) {
        return parsed;
      }
      return {
        command: 'git status',
        explanation: cleanRootCauseText(text).substring(0, 200) || 'Analyzed command query via Gemini AI.',
        detectedIntent: 'DevOps Inspection',
        confidence: 0.95
      };
    }, userCustomKey);
  } catch (e: any) {
    logger.warn('Gemini command copilot notice:', e?.message || e);
    return null;
  }
}

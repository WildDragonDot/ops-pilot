import assert from 'node:assert';
import { 
  generateGeminiIncidentAnalysis, 
  extractJsonFromText, 
  generateGeminiCommandFromPrompt 
} from '../services/gemini.service.js';
import { summarizeLogsWithAI } from '../services/openai.service.js';
import { getSystemGeminiKeys } from '../config/gemini.js';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function testAISuite() {
  console.log('\n--- 3. AI INTELLIGENCE & ALL ACTIVITIES TEST SUITE ---');

  const testProject = {
    name: 'OpsPilot Production Infrastructure',
    runtimeType: 'Docker Compose (Node.js + PostgreSQL)',
    gitUrl: 'https://github.com/WildDragonDot/ops-pilot',
    serverHost: '192.168.1.100'
  };

  // Test Case 1: System API Keys & Failover Configuration
  const geminiKeys = getSystemGeminiKeys();
  assert.ok(geminiKeys.length > 0, 'At least 1 Gemini API Key must be configured');
  console.log(`  ✅ Test Case 1 Passed: System AI Keys Availability (${geminiKeys.length} Gemini keys active)`);

  // Test Case 2: LLM JSON Extraction & Sanitization
  const rawLLMOutput = '```json\n{\n  "title": "Database Timeout",\n  "confidence": 98,\n  "riskLevel": "HIGH"\n}\n```';
  const extracted = extractJsonFromText(rawLLMOutput);
  assert.strictEqual(extracted?.title, 'Database Timeout');
  assert.strictEqual(extracted?.confidence, 98);
  assert.strictEqual(extracted?.riskLevel, 'HIGH');
  console.log('  ✅ Test Case 2 Passed: LLM Markdown JSON Extraction & Sanitizer');

  // Test Case 3: [ACTIVITY TEST] AI Code Audit (SQLi, Route Params, JWT Secret Leak)
  console.log('  ⏳ Running Test Case 3: AI Code Audit Activity...');
  const codeAuditRes = await generateGeminiIncidentAnalysis(
    'Audit auth.controller.ts for SQL injection, unsanitized route parameters, and JWT secret leak',
    testProject
  );
  assert.ok(codeAuditRes, 'AI Code Audit response must not be null');
  assert.ok(codeAuditRes.rootCause.length > 20, 'Code audit must return detailed root cause analysis');
  assert.ok(Array.isArray(codeAuditRes.commands) && codeAuditRes.commands.length > 0, 'Code audit must return recovery commands');
  assert.ok(codeAuditRes.confidence >= 80, 'Confidence score must be >= 80%');
  console.log(`  ✅ Test Case 3 Passed: AI Code Audit Activity ("${codeAuditRes.title}", Confidence: ${codeAuditRes.confidence}%)`);

  await sleep(1500);

  // Test Case 4: [ACTIVITY TEST] AI Git Audit (Commit History, Branch Protection, Force-Pushes)
  console.log('  ⏳ Running Test Case 4: AI Git Audit Activity...');
  const gitAuditRes = await generateGeminiIncidentAnalysis(
    'Check recent git commit history, main branch protection rules, and unauthorized force-pushes',
    testProject
  );
  assert.ok(gitAuditRes, 'AI Git Audit response must not be null');
  assert.ok(gitAuditRes.rootCause, 'Git audit must return detailed branch/commit analysis');
  assert.ok(Array.isArray(gitAuditRes.commands), 'Git audit must return git commands');
  console.log(`  ✅ Test Case 4 Passed: AI Git Audit Activity ("${gitAuditRes.title}", Confidence: ${gitAuditRes.confidence}%)`);

  await sleep(1500);

  // Test Case 5: [ACTIVITY TEST] AI Server Deployment (Zero-Downtime Docker Compose, Health Checks)
  console.log('  ⏳ Running Test Case 5: AI Server Deployment Activity...');
  const deployRes = await generateGeminiIncidentAnalysis(
    'Generate zero-downtime deployment script for Docker Compose with health checks and rollback',
    testProject
  );
  assert.ok(deployRes, 'AI Server Deployment response must not be null');
  assert.ok(deployRes.approvalTitle, 'Deployment activity must supply actionable approval title');
  assert.ok(deployRes.commands.length > 0, 'Deployment activity must supply deployment shell commands');
  console.log(`  ✅ Test Case 5 Passed: AI Server Deployment Activity ("${deployRes.title}", Commands: ${deployRes.commands.length})`);

  await sleep(1500);

  // Test Case 6: [ACTIVITY TEST] AI Server Issue Detection (502 Bad Gateway, Postgres Timeout)
  console.log('  ⏳ Running Test Case 6: AI Server Issue & Outage Detection Activity...');
  const outageRes = await generateGeminiIncidentAnalysis(
    'Production server API returning 502 Bad Gateway with PostgreSQL connection error. Diagnose root cause and provide fix.',
    testProject
  );
  assert.ok(outageRes, 'AI Outage Detection response must not be null');
  assert.ok(outageRes.rootCause.length > 10, 'Analysis must reference issue symptoms');
  assert.ok(outageRes.commands.length > 0, 'Outage detection must return remediation commands');
  console.log(`  ✅ Test Case 6 Passed: AI Server Issue & Outage Detection Activity ("${outageRes.title}")`);

  await sleep(1500);

  // Test Case 7: [ACTIVITY TEST] AI Terminal Copilot (Natural Language -> Shell Command)
  console.log('  ⏳ Running Test Case 7: AI Terminal Copilot Activity...');
  const cmdRes = await generateGeminiCommandFromPrompt(
    'Check running docker containers and restart postgres database',
    testProject
  );
  assert.ok(cmdRes, 'Terminal Copilot response must not be null');
  assert.ok(cmdRes.command, 'Copilot response must return a shell command');
  console.log(`  ✅ Test Case 7 Passed: AI Terminal Copilot Activity (Command: "${cmdRes.command}")`);

  await sleep(1500);

  // Test Case 8: [ACTIVITY TEST] AI Log Analysis & Noise Filtering
  console.log('  ⏳ Running Test Case 8: AI Log Analysis Activity...');
  const mockRawLogs = `2026-08-01 07:00:00 [INFO] heartbeat ping ok
2026-08-01 07:00:01 [TRACE] debug memory check
2026-08-01 07:00:02 [ERROR] PrismaClientInitializationError: Can't reach database server at postgres:5432
2026-08-01 07:00:03 [FATAL] Process exited with code 1`;
  const logRes = await summarizeLogsWithAI(mockRawLogs);
  assert.ok(logRes, 'Log analysis response must not be null');
  assert.ok(logRes.summary, 'Log analysis must provide summary');
  console.log(`  ✅ Test Case 8 Passed: AI Log Analysis Activity (Summary: "${logRes.summary.substring(0, 60)}...")`);

  return true;
}

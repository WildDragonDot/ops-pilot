import { openai, hasOpenAIKey, openaiModel } from '../config/openai.js';
export async function auditCodebaseWithOpenAI(files) {
    if (!hasOpenAIKey() || !openai) {
        console.log('ℹ️ OpenAI API key missing or default. Using high-precision local AI static scanner.');
        return null; // Fallback to local scanner
    }
    try {
        const prompt = `You are OpsPilot AI GitHub Audit Agent. Review the following repository source code files for security vulnerabilities, hardcoded secrets, runtime bugs, and commit risks. Return a JSON object with overallScore (0-100), securityScore, qualityScore, testingScore, summary, and a list of findings (each with severity: CRITICAL|HIGH|MEDIUM|LOW, category: SECURITY|BUG|COMMIT_RISK|TESTING, title, filePath, line, impact, recommendation, patch diff string).

Files to audit:
${files.map(f => `--- FILE: ${f.path} ---\n${f.content.substring(0, 1500)}`).join('\n\n')}`;
        const completion = await openai.chat.completions.create({
            model: openaiModel,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
        });
        const content = completion.choices[0]?.message?.content;
        if (content) {
            return JSON.parse(content);
        }
    }
    catch (error) {
        console.error('⚠️ OpenAI API call notice:', error?.message || error);
        console.log('🔄 Utilizing high-precision local AI agent fallback.');
    }
    return null;
}
export async function runOpenAIIncidentReasoning(prompt, context) {
    if (!hasOpenAIKey() || !openai) {
        console.log('ℹ️ OpenAI API key missing. Using deterministic Agent Reasoning Orchestrator.');
        return null;
    }
    try {
        const tools = [
            {
                type: 'function',
                function: {
                    name: 'check_docker_status',
                    description: 'Inspect running Docker containers and process states',
                    parameters: { type: 'object', properties: {} }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'read_nginx_logs',
                    description: 'Fetch reverse proxy error logs and upstream HTTP status',
                    parameters: { type: 'object', properties: {} }
                }
            },
            {
                type: 'function',
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
        const response = await openai.chat.completions.create({
            model: openaiModel,
            messages: [
                {
                    role: 'system',
                    content: 'You are OpsPilot AI Incident Commander. Investigate production failures using tool calls, synthesize root causes, and propose safe recovery patches.'
                },
                { role: 'user', content: prompt }
            ],
            tools
        });
        return response.choices[0]?.message;
    }
    catch (error) {
        console.error('⚠️ OpenAI Tool Calling notice:', error?.message || error);
        console.log('🔄 Utilizing deterministic Agent Reasoning Orchestrator fallback.');
    }
    return null;
}

export interface GitHubAuditParams {
  gitUrl?: string;
  gitBranch?: string;
  githubToken?: string;
}

export function parseGitHubRepo(gitUrl?: string) {
  if (!gitUrl) return null;
  const match = gitUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?\/?$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

function githubHeaders(githubToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': 'OpsPilot-AI-Auditor',
    'Accept': 'application/vnd.github.v3+json'
  };

  if (githubToken) {
    headers['Authorization'] = `token ${githubToken}`;
  }

  return headers;
}

export async function fetchLiveGitHubAudit(params: GitHubAuditParams) {
  if (!params.gitUrl) {
    return {
      connected: false,
      message: 'No GitHub repository URL specified.'
    };
  }

  const targetBranch = params.gitBranch?.trim() || 'main';

  const parsed = parseGitHubRepo(params.gitUrl);
  if (!parsed) {
    return {
      connected: false,
      message: 'Invalid GitHub URL format. Use https://github.com/owner/repository'
    };
  }

  const { owner, repo } = parsed;
  const headers = githubHeaders(params.githubToken);

  try {
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoRes.ok) {
      return {
        connected: false,
        message: `GitHub API returned ${repoRes.status}: ${repoRes.statusText}`
      };
    }

    const repoData = await repoRes.json();

    // Verify specified target branch exists
    const branchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/${encodeURIComponent(targetBranch)}`, { headers });
    if (!branchRes.ok) {
      const errorMsg = branchRes.status === 404
        ? `Target branch "${targetBranch}" does not exist in ${owner}/${repo}`
        : `GitHub branch verification returned HTTP ${branchRes.status}`;
      return {
        connected: false,
        branchExists: false,
        message: errorMsg
      };
    }

    // Fetch branches
    const branchesRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, { headers });
    const branches = branchesRes.ok ? await branchesRes.json() : [];

    // Fetch recent commits
    const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?sha=${targetBranch}&per_page=5`, { headers });
    const commits = commitsRes.ok ? await commitsRes.json() : [];

    return {
      connected: true,
      branchExists: true,
      targetBranch,
      message: `Branch "${targetBranch}" verified & authenticated successfully`,
      repository: {
        name: repoData.name,
        fullName: repoData.full_name,
        private: repoData.private,
        defaultBranch: repoData.default_branch,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        updatedAt: repoData.updated_at
      },
      branchesCount: branches.length,
      recentCommits: commits.map((c: any) => ({
        sha: c.sha?.substring(0, 7),
        message: c.commit?.message,
        author: c.commit?.author?.name,
        date: c.commit?.author?.date
      }))
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Failed to connect to GitHub API: ${err.message}`
    };
  }
}

export async function fetchGitHubSourceFiles(params: GitHubAuditParams & { maxFiles?: number }) {
  const parsed = parseGitHubRepo(params.gitUrl);
  if (!parsed) return [];

  const branch = params.gitBranch?.trim() || 'main';
  const headers = githubHeaders(params.githubToken);
  const treeUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
  const treeRes = await fetch(treeUrl, { headers });
  if (!treeRes.ok) {
    throw new Error(`GitHub source tree request failed with HTTP ${treeRes.status}`);
  }

  const treeData = await treeRes.json();
  const sourceExtensions = /\.(ts|tsx|js|jsx|json|prisma|sql|yml|yaml|env\.example)$/i;
  const ignoredPath = /(^|\/)(node_modules|dist|build|coverage|\.git)\//;
  const candidates = (treeData.tree || [])
    .filter((entry: any) => entry.type === 'blob' && sourceExtensions.test(entry.path) && !ignoredPath.test(entry.path))
    .slice(0, params.maxFiles || 24);

  const files: { path: string; content: string }[] = [];

  // Fetch all candidate files in parallel instead of sequentially
  const results = await Promise.allSettled(
    candidates.map(async (entry: any) => {
      const fileRes = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/${encodeURIComponent(entry.path).replace(/%2F/g, '/')}?ref=${encodeURIComponent(branch)}`,
        { headers }
      );
      if (!fileRes.ok) return null;
      const fileData = await fileRes.json();
      if (fileData.encoding === 'base64' && fileData.content) {
        return { path: entry.path, content: Buffer.from(fileData.content, 'base64').toString('utf-8') };
      }
      return null;
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      files.push(result.value);
    }
  }

  return files;
}

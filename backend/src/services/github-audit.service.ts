export interface GitHubAuditParams {
  gitUrl?: string;
  gitBranch?: string;
  githubToken?: string;
}

export async function fetchLiveGitHubAudit(params: GitHubAuditParams) {
  if (!params.gitUrl) {
    return {
      connected: false,
      message: 'No GitHub repository URL specified.'
    };
  }

  const targetBranch = params.gitBranch?.trim() || 'main';

  // Parse owner/repo from URL
  const match = params.gitUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
  if (!match) {
    return {
      connected: false,
      message: 'Invalid GitHub URL format. Use https://github.com/owner/repository'
    };
  }

  const owner = match[1];
  const repo = match[2];
  const headers: Record<string, string> = {
    'User-Agent': 'OpsPilot-AI-Auditor',
    'Accept': 'application/vnd.github.v3+json'
  };

  if (params.githubToken) {
    headers['Authorization'] = `token ${params.githubToken}`;
  }

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

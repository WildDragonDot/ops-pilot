export async function fetchLiveGitHubAudit(params) {
    if (!params.gitUrl) {
        return {
            connected: false,
            message: 'No GitHub repository URL specified.'
        };
    }
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
    const headers = {
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
        // Fetch branches
        const branchesRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, { headers });
        const branches = branchesRes.ok ? await branchesRes.json() : [];
        // Fetch recent commits
        const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`, { headers });
        const commits = commitsRes.ok ? await commitsRes.json() : [];
        return {
            connected: true,
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
            recentCommits: commits.map((c) => ({
                sha: c.sha?.substring(0, 7),
                message: c.commit?.message,
                author: c.commit?.author?.name,
                date: c.commit?.author?.date
            }))
        };
    }
    catch (err) {
        return {
            connected: false,
            message: `Failed to connect to GitHub API: ${err.message}`
        };
    }
}

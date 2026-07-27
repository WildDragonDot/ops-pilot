const state = {
  activeIncident: null,
  activeApproval: null,
  stream: null
};

const els = {
  scenario: document.querySelector("#scenario"),
  resetDemo: document.querySelector("#resetDemo"),
  statusGrid: document.querySelector("#statusGrid"),
  repoUrl: document.querySelector("#repoUrl"),
  scanRepository: document.querySelector("#scanRepository"),
  scanSteps: document.querySelector("#scanSteps"),
  repoScore: document.querySelector("#repoScore"),
  scoreBreakdown: document.querySelector("#scoreBreakdown"),
  repoFindings: document.querySelector("#repoFindings"),
  repoCorrelation: document.querySelector("#repoCorrelation"),
  prompt: document.querySelector("#prompt"),
  startIncident: document.querySelector("#startIncident"),
  quickActions: document.querySelectorAll(".quick-actions button"),
  planList: document.querySelector("#planList"),
  incidentTitle: document.querySelector("#incidentTitle"),
  timeline: document.querySelector("#timeline"),
  evidenceList: document.querySelector("#evidenceList"),
  diagnosis: document.querySelector("#diagnosis"),
  approvalBox: document.querySelector("#approvalBox"),
  report: document.querySelector("#report"),
  approvalModal: document.querySelector("#approvalModal"),
  approvalDetails: document.querySelector("#approvalDetails"),
  approveApproval: document.querySelector("#approveApproval"),
  rejectApproval: document.querySelector("#rejectApproval")
};

const scenarioPrompts = {
  DATABASE_STOPPED: "Our production API is returning 502. Find the cause and recover it.",
  CONFIG_MISMATCH: "Investigate why the API cannot connect after configuration change.",
  CODE_BUG: "Find why the user lookup route fails for valid numeric IDs."
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function loadHealth() {
  const health = await api("/api/projects/demo-commerce-api/health");
  const entries = [
    ["Repository Health", `${health.repositoryHealth}/100`],
    ["Critical Code Issues", health.criticalCodeIssues],
    ["Risky PRs", health.riskyPrs],
    ["Application", health.application],
    ["Database", health.database],
    ["Proxy", health.proxy]
  ];
  els.statusGrid.innerHTML = entries
    .map(([label, value]) => {
      const className = String(value).toLowerCase();
      return `<article class="status-card ${className}">
        <span class="eyebrow">${label}</span>
        <strong>${value}</strong>
      </article>`;
    })
    .join("");
}

async function scanRepository() {
  els.scanRepository.disabled = true;
  els.scanSteps.innerHTML = `<div class="event"><span>Scan started</span><strong>Reading repository signals...</strong></div>`;
  const scan = await api("/api/repositories/scan", {
    method: "POST",
    body: { url: els.repoUrl.value }
  });
  renderRepositoryScan(scan);
  await loadHealth();
  els.scanRepository.disabled = false;
}

function renderRepositoryScan(scan) {
  els.repoScore.textContent = `${scan.score.overall}/100`;
  const scores = [
    ["Security", `${scan.score.security}/25`],
    ["Code quality", `${scan.score.quality}/20`],
    ["Testing", `${scan.score.testing}/20`],
    ["Reliability", `${scan.score.reliability}/15`],
    ["Documentation", `${scan.score.documentation}/10`],
    ["Maintainability", `${scan.score.maintainability}/10`]
  ];
  els.scoreBreakdown.innerHTML = scores
    .map(
      ([label, value]) => `<article class="score-card">
        <span>${label}</span>
        <strong>${value}</strong>
      </article>`
    )
    .join("");
  els.scanSteps.innerHTML = scan.steps
    .map((step) => `<div class="event"><span>Complete</span><strong>✓ ${step}</strong></div>`)
    .join("");
  els.repoFindings.innerHTML = scan.findings
    .map(
      (finding) => `<article class="evidence-card finding ${finding.severity.toLowerCase()}">
        <span>${finding.severity} · ${finding.category}</span>
        <strong>${finding.title}</strong>
        <p>${finding.filePath}${finding.line ? `:${finding.line}` : ""}</p>
        <p>${finding.impact}</p>
        <p>${finding.recommendation}</p>
        ${finding.patch ? `<pre class="diff">${finding.patch}</pre>` : ""}
      </article>`
    )
    .join("");
  els.repoCorrelation.innerHTML = `
    <article class="evidence-card">
      <span>Incident correlation</span>
      <strong>${scan.incidentCorrelation.commit} linked to ${scan.incidentCorrelation.incident}</strong>
      <p>${scan.incidentCorrelation.explanation}</p>
    </article>
    ${scan.recentCommits
      .map(
        (commit) => `<article class="evidence-card">
          <span>${commit.risk} commit risk · ${commit.sha}</span>
          <strong>${commit.message}</strong>
          <p>${commit.reason}</p>
        </article>`
      )
      .join("")}
    <article class="evidence-card">
      <span>${scan.prReview.risk} PR risk · #${scan.prReview.number}</span>
      <strong>${scan.prReview.title}</strong>
      <p>${scan.prReview.reason}</p>
      <p>${scan.prReview.recommendation}</p>
    </article>`;
}

async function setScenario(scenario) {
  await api("/api/demo/inject-failure", {
    method: "POST",
    body: { scenario }
  });
  els.prompt.value = scenarioPrompts[scenario];
  await loadHealth();
}

async function resetDemo() {
  await api("/api/demo/reset", { method: "POST" });
  state.activeIncident = null;
  state.activeApproval = null;
  if (state.stream) state.stream.close();
  els.scenario.value = "DATABASE_STOPPED";
  els.prompt.value = scenarioPrompts.DATABASE_STOPPED;
  els.planList.innerHTML = "";
  els.incidentTitle.textContent = "No active incident";
  els.timeline.className = "timeline empty";
  els.timeline.textContent = "Start an investigation to stream tool calls and evidence.";
  els.evidenceList.innerHTML = "";
  els.diagnosis.textContent = "OpsPilot has not produced a diagnosis yet.";
  els.approvalBox.textContent = "No pending approval.";
  els.report.textContent = "Report appears after recovery verification.";
  els.repoFindings.innerHTML = "";
  els.repoCorrelation.innerHTML = "";
  els.scanSteps.innerHTML = "";
  els.repoScore.textContent = "78/100";
  await loadHealth();
}

async function startIncident() {
  els.startIncident.disabled = true;
  const incident = await api("/api/incidents", {
    method: "POST",
    body: { projectId: "demo-commerce-api", prompt: els.prompt.value }
  });
  state.activeIncident = incident;
  state.activeApproval = null;
  renderIncident(incident);
  openStream(incident.id);
  els.startIncident.disabled = false;
}

function openStream(incidentId) {
  if (state.stream) state.stream.close();
  state.stream = new EventSource(`/api/incidents/${incidentId}/stream`);
  const eventTypes = [
    "plan",
    "tool_call",
    "evidence",
    "diagnosis",
    "approval_request",
    "execution",
    "verification",
    "incident_resolved",
    "error"
  ];
  for (const type of eventTypes) {
    state.stream.addEventListener(type, async (event) => {
      const item = JSON.parse(event.data);
      appendEvent(item);
      const latest = await api(`/api/incidents/${incidentId}`);
      state.activeIncident = latest;
      renderIncident(latest);
    });
  }
}

function renderIncident(incident) {
  els.incidentTitle.textContent = `${incident.id} · ${incident.title}`;
  els.planList.innerHTML = incident.plan
    .map((step, index) => `<li>${index < incident.evidence.length + 1 ? "✓" : "○"} ${step}</li>`)
    .join("");
  els.evidenceList.innerHTML = incident.evidence.length
    ? incident.evidence
        .map(
          (item) => `<article class="evidence-card">
          <span>${item.id} · ${item.title}</span>
          <strong>${item.detail}</strong>
        </article>`
        )
        .join("")
    : `<div class="evidence-card"><span>Waiting</span><strong>No evidence collected yet.</strong></div>`;

  if (incident.rootCause) {
    els.diagnosis.innerHTML = `<p>${incident.rootCause}</p>
      <p><span class="badge">${incident.severity}</span> <span class="badge">${incident.confidence}% confidence</span> <span class="badge">${incident.affectedService}</span></p>`;
  }

  if (incident.approval?.status === "PENDING") {
    state.activeApproval = incident.approval;
    els.approvalBox.innerHTML = `<div class="action-card">
      <span>${incident.approval.riskLevel} risk</span>
      <strong>${incident.approval.payload.actions.length} actions need approval</strong>
      <p>${incident.approval.payload.expectedOutcome}</p>
    </div>`;
    showApproval(incident.approval);
  } else if (incident.status === "RESOLVED") {
    els.approvalBox.innerHTML = `<div class="verification-card"><strong>System recovered</strong><p>Verification completed and report generated.</p></div>`;
  }

  if (incident.report) els.report.textContent = incident.report;
}

function appendEvent(event) {
  if (els.timeline.classList.contains("empty")) {
    els.timeline.className = "timeline";
    els.timeline.innerHTML = "";
  }
  const node = document.createElement("article");
  node.className = "event";
  node.innerHTML = `<span>${event.type} · ${new Date(event.createdAt).toLocaleTimeString()}</span><strong>${event.title}</strong>${renderEventDetails(event.details)}`;
  els.timeline.prepend(node);
}

function renderEventDetails(details = {}) {
  if (details.command) return `<p><code>${details.command}</code></p>`;
  if (details.rootCause) return `<p>${details.rootCause}</p>`;
  if (details.result) return `<p>${details.result}</p>`;
  return "";
}

function showApproval(approval) {
  const actions = approval.payload.actions
    .map(
      (action) => `<article class="action-card">
        <span>${action.risk} risk · approval required</span>
        <strong>${action.label}</strong>
        <p><code>${action.command}</code></p>
        ${action.diff ? `<pre class="diff">${action.diff}</pre>` : ""}
      </article>`
    )
    .join("");
  els.approvalDetails.innerHTML = `
    <p>OpsPilot wants to execute a controlled recovery plan. Blocked destructive actions remain unavailable.</p>
    ${actions}
    <article class="action-card">
      <span>Rollback</span>
      <strong>${approval.payload.rollbackPlan}</strong>
    </article>`;
  els.approvalModal.classList.remove("hidden");
}

async function approveApproval() {
  if (!state.activeApproval) return;
  els.approvalModal.classList.add("hidden");
  await api(`/api/approvals/${state.activeApproval.id}/approve`, { method: "POST" });
}

async function rejectApproval() {
  if (!state.activeApproval) return;
  els.approvalModal.classList.add("hidden");
  await api(`/api/approvals/${state.activeApproval.id}/reject`, { method: "POST" });
}

els.scenario.addEventListener("change", () => setScenario(els.scenario.value));
els.resetDemo.addEventListener("click", resetDemo);
els.scanRepository.addEventListener("click", scanRepository);
els.startIncident.addEventListener("click", startIncident);
els.approveApproval.addEventListener("click", approveApproval);
els.rejectApproval.addEventListener("click", rejectApproval);

for (const button of els.quickActions) {
  button.addEventListener("click", () => {
    els.prompt.value = button.dataset.prompt;
  });
}

loadHealth();
scanRepository();

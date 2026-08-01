export interface Project {
  id: string;
  name: string;
  rootPath: string;
  runtimeType: string;
  healthCheckUrl?: string;
  composeFile?: string;
  testCommand?: string;
  restartCommand?: string;
  gitUrl?: string | null;
  gitBranch?: string | null;
  serverHost?: string | null;
  serverPort?: number | null;
  serverUser?: string | null;
  projectPath?: string | null;
  environmentType?: string;
  createdAt?: string;
  updatedAt?: string;
  environmentStatus?: {
    overall: 'HEALTHY' | 'DEGRADED' | 'DOWN';
    postgres: 'RUNNING' | 'STOPPED' | 'ERROR';
    redis: 'RUNNING' | 'STOPPED' | 'ERROR';
    api: 'RUNNING' | 'CRASHED' | 'STOPPED';
    nginx: 'UPSTREAM_502' | 'HEALTHY';
    dynamicNodes?: any[];
  };
}

export interface Finding {
  id: string;
  scanId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'SECURITY' | 'BUG' | 'CODE_QUALITY' | 'TESTING' | 'COMMIT_RISK';
  title: string;
  filePath?: string;
  line?: number;
  impact: string;
  recommendation: string;
  patch?: string;
}

export interface Scan {
  id: string;
  repositoryId: string;
  status: 'SCANNING' | 'COMPLETED' | 'FAILED';
  overallScore: number;
  securityScore: number;
  qualityScore: number;
  testingScore: number;
  reliabilityScore: number;
  documentationScore: number;
  maintainabilityScore: number;
  summary: string;
  startedAt: string;
  completedAt?: string;
  findings: Finding[];
}

export interface IncidentEvent {
  id: string;
  incidentId: string;
  type: 'PLAN' | 'TOOL_CALL' | 'EVIDENCE' | 'DIAGNOSIS' | 'APPROVAL_REQUEST' | 'EXECUTION' | 'VERIFICATION' | 'REPORT';
  title: string;
  details: Record<string, unknown>;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'WARNING' | 'FAILED';
  createdAt: string;
}

export interface Approval {
  id: string;
  incidentId: string;
  actionType: string;
  title: string;
  description: string;
  commands: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  diff?: string;
  rollbackPlan: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  projectId: string;
  title: string;
  userPrompt: string;
  scenarioKey?: string;
  status: 'INVESTIGATING' | 'AWAITING_APPROVAL' | 'EXECUTING_FIX' | 'VERIFYING' | 'RESOLVED' | 'REJECTED';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  affectedService: string;
  confidence: number;
  rootCause?: string;
  report?: string;
  startedAt: string;
  resolvedAt?: string;
  events: IncidentEvent[];
  activeApproval?: Approval;
}

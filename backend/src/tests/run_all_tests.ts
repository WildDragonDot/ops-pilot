import dotenv from 'dotenv';
import { testAuthSuite } from './auth.api.test.js';
import { testProjectSuite } from './project.api.test.js';
import { testAISuite } from './ai.api.test.js';
import { testRepoAuditorSuite } from './repo_auditor.api.test.js';
import { testIncidentsAndApprovalsSuite } from './incidents_approvals.api.test.js';

dotenv.config();

async function runMasterTestSuite() {
  console.log('================================================================');
  console.log('🧪 D-OPSPILOT AI - MASTER SYSTEM & API END-TO-END TEST RUNNER');
  console.log('================================================================');
  
  const startTime = Date.now();
  let passedCount = 0;
  let failedCount = 0;

  const suites = [
    { name: '1. Authentication & RBAC Suite', fn: testAuthSuite },
    { name: '2. Project & Server Discovery Suite', fn: testProjectSuite },
    { name: '3. AI Intelligence & Failover Suite', fn: testAISuite },
    { name: '4. Repository Auditor & AST Scan Suite', fn: testRepoAuditorSuite },
    { name: '5. Incidents & Approval Queue Suite', fn: testIncidentsAndApprovalsSuite },
  ];

  for (const suite of suites) {
    try {
      await suite.fn();
      passedCount++;
    } catch (err: any) {
      failedCount++;
      console.error(`\n❌ FAILED SUITE [${suite.name}]:`, err?.message || err);
    }
  }

  const durationMs = Date.now() - startTime;

  console.log('\n================================================================');
  console.log('📊 FINAL END-TO-END TEST EXECUTION SUMMARY REPORT');
  console.log('================================================================');
  console.log(`  • Total Test Suites Run : ${suites.length}`);
  console.log(`  • Successful Test Suites: ${passedCount} ✅`);
  console.log(`  • Failed Test Suites    : ${failedCount} ${failedCount === 0 ? '' : '❌'}`);
  console.log(`  • Total Execution Time  : ${durationMs}ms`);
  console.log('================================================================\n');

  if (failedCount === 0) {
    console.log('🎉 ALL API ACTIONS & SYSTEM ACTIVITIES PASSED 100% SUCCESSFULLY!');
  } else {
    process.exit(1);
  }

  process.exit(0);
}

runMasterTestSuite();

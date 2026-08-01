import assert from 'node:assert';
import { activeScenarios, injectFailureScenario, resetEnvironmentState } from '../services/incident-agent.service.js';

export async function testIncidentsAndApprovalsSuite() {
  console.log('\n--- 5. INCIDENTS, APPROVAL QUEUE & ENVIRONMENT SUITE ---');

  // Test 1: Active Scenario Presets
  const dbScenario = activeScenarios['DATABASE_STOPPED'];
  assert.ok(dbScenario, 'DATABASE_STOPPED scenario must exist');
  assert.strictEqual(dbScenario.severity, 'CRITICAL');
  assert.ok(dbScenario.approval.commands.length > 0, 'Approval must have commands');
  console.log('  ✅ Incident scenario templates passed');

  // Test 2: Failure Injection Simulation
  const injectedState = injectFailureScenario('DATABASE_STOPPED');
  assert.strictEqual(injectedState.environmentStatus.overall, 'DOWN');
  assert.strictEqual(injectedState.environmentStatus.postgres, 'STOPPED');
  console.log('  ✅ Failure injection state transition passed');

  // Test 3: Environment Reset Simulation
  const resetState = resetEnvironmentState();
  assert.strictEqual(resetState.environmentStatus.overall, 'HEALTHY');
  assert.strictEqual(resetState.environmentStatus.postgres, 'RUNNING');
  console.log('  ✅ Environment reset state restoration passed');

  return true;
}

import { pageActTool } from '../tools/page-act-tool';
import { pageExtractTool } from '../tools/page-extract-tool';
import { pageNavigateTool } from '../tools/page-navigate-tool';
import { pageObserveTool } from '../tools/page-observe-tool';
import type { TestCase, TestStep, TestStepTool } from './test-case';

export type StepStatus = 'pass' | 'fail' | 'blocked';

export type StepResult = {
  stepId: string;
  description: string;
  tool: TestStepTool;
  status: StepStatus;
  durationMs: number;
  startedAt: string;
  endedAt: string;
  output?: unknown;
  error?: string;
  evidenceRefs: string[];
};

export type TestCaseResult = {
  testCaseId: string;
  description: string;
  status: StepStatus;
  durationMs: number;
  startedAt: string;
  endedAt: string;
  steps: StepResult[];
  evidenceRefs: string[];
};

export type EvidenceRecord = {
  ref: string;
  stepId: string;
  data: unknown;
};

export type TestRunSummary = {
  status: StepStatus;
  durationMs: number;
  startedAt: string;
  endedAt: string;
  testCaseResults: TestCaseResult[];
  evidence: EvidenceRecord[];
};

export type TestSuite = {
  id: string;
  description?: string;
  testCases: TestCase[];
};

const toolMap: Record<TestStepTool, { execute: (input: Record<string, unknown>) => Promise<unknown> }> = {
  'web-act': pageActTool,
  'web-extract': pageExtractTool,
  'web-navigate': pageNavigateTool,
  'web-observe': pageObserveTool,
};

const testSuiteRegistry = new Map<string, TestSuite>();

export const registerTestSuite = (suite: TestSuite) => {
  testSuiteRegistry.set(suite.id, suite);
};

export const getTestSuite = (suiteId: string) => testSuiteRegistry.get(suiteId);

export const runTestSuite = async ({
  suiteId,
  testCases,
}: {
  suiteId?: string;
  testCases?: TestCase[];
}): Promise<TestRunSummary> => {
  const resolvedTestCases = resolveTestCases(suiteId, testCases);
  const startedAt = new Date();
  const testCaseResults: TestCaseResult[] = [];
  const evidence: EvidenceRecord[] = [];

  for (const testCase of resolvedTestCases) {
    const result = await runTestCase(testCase);
    testCaseResults.push(result.result);
    evidence.push(...result.evidence);
  }

  const endedAt = new Date();
  const durationMs = endedAt.getTime() - startedAt.getTime();
  const status = aggregateStatus(testCaseResults.map(result => result.status));

  return {
    status,
    durationMs,
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    testCaseResults,
    evidence,
  };
};

const resolveTestCases = (suiteId?: string, testCases?: TestCase[]) => {
  if (testCases && testCases.length > 0) {
    return testCases;
  }

  if (!suiteId) {
    throw new Error('Either suiteId or testCases must be provided.');
  }

  const suite = testSuiteRegistry.get(suiteId);
  if (!suite) {
    throw new Error(`Unknown test suite: ${suiteId}`);
  }

  return suite.testCases;
};

const runTestCase = async (testCase: TestCase) => {
  const startedAt = new Date();
  const steps: StepResult[] = [];
  const evidence: EvidenceRecord[] = [];
  let caseStatus: StepStatus = 'pass';

  for (const step of testCase.steps) {
    const stepResult = await runStep(step);
    steps.push(stepResult.result);
    evidence.push(...stepResult.evidence);

    if (stepResult.result.status !== 'pass') {
      caseStatus = stepResult.result.status;
      const blockedSteps = createBlockedSteps(
        testCase.steps.slice(steps.length),
        `Blocked because step ${step.id} did not pass.`,
      );
      steps.push(...blockedSteps);
      break;
    }
  }

  if (steps.length === 0) {
    caseStatus = 'blocked';
  }

  const endedAt = new Date();
  const durationMs = endedAt.getTime() - startedAt.getTime();

  return {
    result: {
      testCaseId: testCase.id,
      description: testCase.description,
      status: caseStatus,
      durationMs,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      steps,
      evidenceRefs: collectEvidenceRefs(steps),
    },
    evidence,
  };
};

const runStep = async (step: TestStep) => {
  const startedAt = new Date();
  const stepEvidence: EvidenceRecord[] = [];

  try {
    const tool = toolMap[step.tool];
    if (!tool) {
      const blockedResult = buildStepResult(step, 'blocked', startedAt, undefined, 'Unsupported tool.');
      return { result: blockedResult, evidence: stepEvidence };
    }

    const output = await tool.execute(step.input);

    const status = resolveStepStatus(output);
    const result = buildStepResult(step, status, startedAt, output);
    if (output !== undefined) {
      const ref = `step:${step.id}`;
      stepEvidence.push({ ref, stepId: step.id, data: output });
      result.evidenceRefs.push(ref);
    }

    return { result, evidence: stepEvidence };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const result = buildStepResult(step, 'fail', startedAt, undefined, errorMessage);
    return { result, evidence: stepEvidence };
  }
};

const resolveStepStatus = (output: unknown): StepStatus => {
  if (output && typeof output === 'object' && 'success' in output) {
    return (output as { success?: boolean }).success === false ? 'fail' : 'pass';
  }

  return 'pass';
};

const buildStepResult = (
  step: TestStep,
  status: StepStatus,
  startedAt: Date,
  output?: unknown,
  error?: string,
): StepResult => {
  const endedAt = new Date();
  return {
    stepId: step.id,
    description: step.description,
    tool: step.tool,
    status,
    durationMs: endedAt.getTime() - startedAt.getTime(),
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    output,
    error,
    evidenceRefs: [],
  };
};

const createBlockedSteps = (steps: TestStep[], reason: string): StepResult[] => {
  return steps.map(step => {
    const startedAt = new Date();
    return {
      stepId: step.id,
      description: step.description,
      tool: step.tool,
      status: 'blocked',
      durationMs: 0,
      startedAt: startedAt.toISOString(),
      endedAt: startedAt.toISOString(),
      error: reason,
      evidenceRefs: [],
    };
  });
};

const collectEvidenceRefs = (steps: StepResult[]) => {
  const refs = new Set<string>();
  steps.forEach(step => step.evidenceRefs.forEach(ref => refs.add(ref)));
  return Array.from(refs);
};

const aggregateStatus = (statuses: StepStatus[]): StepStatus => {
  if (statuses.includes('fail')) {
    return 'fail';
  }

  if (statuses.includes('blocked')) {
    return 'blocked';
  }

  return 'pass';
};

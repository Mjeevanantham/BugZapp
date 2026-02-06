import type { BugReport } from '../bug-report';
import type { EvidenceRecord, TestCaseResult, TestRunSummary } from '../test-runner';

type JUnitReportInput = {
  summary: TestRunSummary;
  suiteId?: string;
  suiteName?: string;
  bugReports?: BugReport[];
};

const LOCATION_KEYS = [
  'path',
  'url',
  'href',
  'link',
  'uri',
  'artifactPath',
  'screenshotPath',
  'logPath',
  'tracePath',
];

export const renderJUnitReport = ({
  summary,
  suiteId,
  suiteName,
  bugReports = [],
}: JUnitReportInput): string => {
  const tests = summary.testCaseResults.length;
  const failures = summary.testCaseResults.filter(result => result.status === 'fail').length;
  const skipped = summary.testCaseResults.filter(result => result.status === 'blocked').length;
  const time = formatSeconds(summary.durationMs);
  const suiteLabel = suiteName ?? suiteId ?? 'qa-suite';
  const evidenceMap = new Map(summary.evidence.map(record => [record.ref, record]));

  const testCasesXml = summary.testCaseResults.map(result =>
    renderTestCase(result, suiteId ?? suiteLabel, evidenceMap),
  );

  const suiteSystemOut = renderSuiteSystemOut(summary.evidence, bugReports);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<testsuite name="${xmlEscape(suiteLabel)}" tests="${tests}" failures="${failures}" skipped="${skipped}" errors="0" time="${time}">`,
    ...testCasesXml,
    suiteSystemOut ? `  <system-out><![CDATA[${suiteSystemOut}]]></system-out>` : null,
    '</testsuite>',
  ]
    .filter(Boolean)
    .join('\n');
};

const renderTestCase = (
  testCase: TestCaseResult,
  className: string,
  evidenceMap: Map<string, EvidenceRecord>,
) => {
  const time = formatSeconds(testCase.durationMs);
  const lines: string[] = [];
  lines.push(
    `  <testcase classname="${xmlEscape(className)}" name="${xmlEscape(testCase.testCaseId)}" time="${time}">`,
  );

  if (testCase.status === 'fail') {
    const failureMessage = buildFailureMessage(testCase);
    lines.push(`    <failure message="${xmlEscape(failureMessage)}"><![CDATA[${failureMessage}]]></failure>`);
  }

  if (testCase.status === 'blocked') {
    const blockedMessage = buildBlockedMessage(testCase);
    lines.push(`    <skipped message="${xmlEscape(blockedMessage)}" />`);
  }

  const systemOut = renderTestCaseSystemOut(testCase, evidenceMap);
  if (systemOut) {
    lines.push(`    <system-out><![CDATA[${systemOut}]]></system-out>`);
  }

  lines.push('  </testcase>');
  return lines.join('\n');
};

const renderTestCaseSystemOut = (testCase: TestCaseResult, evidenceMap: Map<string, EvidenceRecord>) => {
  const evidenceLines = testCase.evidenceRefs
    .map(ref => evidenceMap.get(ref))
    .filter((record): record is EvidenceRecord => Boolean(record))
    .map(record => {
      const locations = Array.from(collectLocations(record.data));
      const locationText = locations.length > 0 ? locations.join(', ') : 'No paths recorded';
      return `Evidence ${record.ref} (step ${record.stepId}): ${locationText}`;
    });

  const stepFailures = testCase.steps
    .filter(step => step.status === 'fail')
    .map(step => `Step ${step.stepId} failed: ${step.error ?? 'Unknown error'}`);

  const stepBlocks = testCase.steps
    .filter(step => step.status === 'blocked')
    .map(step => `Step ${step.stepId} blocked: ${step.error ?? 'Blocked'}`);

  const payload = {
    status: testCase.status,
    startedAt: testCase.startedAt,
    endedAt: testCase.endedAt,
    evidence: evidenceLines,
    failures: stepFailures,
    blocked: stepBlocks,
  };

  return JSON.stringify(payload, null, 2);
};

const renderSuiteSystemOut = (evidence: EvidenceRecord[], bugReports: BugReport[]) => {
  if (evidence.length === 0 && bugReports.length === 0) {
    return '';
  }

  const evidencePayload = evidence.map(record => ({
    ref: record.ref,
    stepId: record.stepId,
    locations: Array.from(collectLocations(record.data)),
  }));

  return JSON.stringify(
    {
      evidence: evidencePayload,
      bugReports,
    },
    null,
    2,
  );
};

const buildFailureMessage = (testCase: TestCaseResult) => {
  const failingStep = testCase.steps.find(step => step.status === 'fail');
  if (!failingStep) {
    return 'Test failed.';
  }
  return `Step ${failingStep.stepId} failed: ${failingStep.error ?? 'Unknown error'}`;
};

const buildBlockedMessage = (testCase: TestCaseResult) => {
  const blockedStep = testCase.steps.find(step => step.status === 'blocked');
  if (!blockedStep) {
    return 'Test blocked.';
  }
  return `Step ${blockedStep.stepId} blocked: ${blockedStep.error ?? 'Blocked'}`;
};

const formatSeconds = (durationMs: number) => (durationMs / 1000).toFixed(3);

const xmlEscape = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const collectLocations = (data: unknown, depth = 0, locations = new Set<string>()) => {
  if (depth > 3 || data === null || data === undefined) {
    return locations;
  }

  if (typeof data === 'string') {
    if (looksLikeLocation(data)) {
      locations.add(data);
    }
    return locations;
  }

  if (Array.isArray(data)) {
    data.forEach(item => collectLocations(item, depth + 1, locations));
    return locations;
  }

  if (typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && LOCATION_KEYS.includes(key)) {
        locations.add(value);
      }
      collectLocations(value, depth + 1, locations);
    }
  }

  return locations;
};

const looksLikeLocation = (value: string) =>
  value.startsWith('http://') ||
  value.startsWith('https://') ||
  value.startsWith('file://') ||
  value.startsWith('/') ||
  value.includes('\\');

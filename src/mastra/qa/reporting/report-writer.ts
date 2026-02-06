import type { BugReport } from '../bug-report';
import type { EvidenceRecord, TestCaseResult, TestRunSummary } from '../test-runner';

type EvidenceLink = {
  ref: string;
  stepId: string;
  locations: string[];
  data: unknown;
};

export type RunReportInput = {
  summary: TestRunSummary;
  suiteId?: string;
  suiteDescription?: string;
  bugReports?: BugReport[];
};

export type RunReportPayload = {
  suiteId?: string;
  suiteDescription?: string;
  summary: TestRunSummary;
  evidenceLinks: EvidenceLink[];
  bugReports: BugReport[];
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

const buildEvidenceLinks = (evidence: EvidenceRecord[]): EvidenceLink[] =>
  evidence.map(record => ({
    ref: record.ref,
    stepId: record.stepId,
    locations: Array.from(collectLocations(record.data)),
    data: record.data,
  }));

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

export const buildRunReportPayload = ({
  summary,
  suiteId,
  suiteDescription,
  bugReports = [],
}: RunReportInput): RunReportPayload => ({
  suiteId,
  suiteDescription,
  summary,
  evidenceLinks: buildEvidenceLinks(summary.evidence),
  bugReports,
});

export const renderRunSummaryJson = (input: RunReportInput): string =>
  JSON.stringify(buildRunReportPayload(input), null, 2);

export const renderRunSummaryMarkdown = (input: RunReportInput): string => {
  const payload = buildRunReportPayload(input);
  const lines: string[] = [];

  lines.push('# QA Run Summary');
  if (payload.suiteId) {
    lines.push(`- Suite ID: ${payload.suiteId}`);
  }
  if (payload.suiteDescription) {
    lines.push(`- Suite Description: ${payload.suiteDescription}`);
  }
  lines.push(`- Status: ${payload.summary.status}`);
  lines.push(`- Duration: ${payload.summary.durationMs}ms`);
  lines.push(`- Started: ${payload.summary.startedAt}`);
  lines.push(`- Ended: ${payload.summary.endedAt}`);
  lines.push('');

  lines.push('## Test Cases');
  payload.summary.testCaseResults.forEach(testCase => {
    lines.push(formatTestCaseMarkdown(testCase));
  });

  lines.push('');
  lines.push('## Evidence');
  if (payload.evidenceLinks.length === 0) {
    lines.push('- No evidence collected.');
  } else {
    payload.evidenceLinks.forEach(link => {
      const locationText = link.locations.length > 0 ? link.locations.join(', ') : 'No paths recorded';
      lines.push(`- ${link.ref} (step ${link.stepId}): ${locationText}`);
    });
  }

  lines.push('');
  lines.push('## Bug Reports');
  if (payload.bugReports.length === 0) {
    lines.push('- No bug reports submitted.');
  } else {
    payload.bugReports.forEach((report, index) => {
      lines.push(`### ${index + 1}. ${report.title} (${report.severity})`);
      lines.push(`- Observed: ${report.timestamps.observedAt}`);
      lines.push(`- Reported: ${report.timestamps.reportedAt}`);
      lines.push(`- Expected: ${report.expected}`);
      lines.push(`- Actual: ${report.actual}`);
      lines.push(`- Steps: ${report.steps.join(' | ')}`);
      if (report.urls && report.urls.length > 0) {
        lines.push(`- URLs: ${report.urls.join(', ')}`);
      }
      if (report.domSelectors && report.domSelectors.length > 0) {
        lines.push(`- Selectors: ${report.domSelectors.join(', ')}`);
      }
      if (report.evidence && report.evidence.length > 0) {
        lines.push('- Evidence:');
        report.evidence.forEach(artifact => {
          lines.push(`  - ${artifact.type}: ${artifact.path}${artifact.mimeType ? ` (${artifact.mimeType})` : ''}`);
        });
      }
      lines.push('');
      lines.push('```json');
      lines.push(JSON.stringify(report, null, 2));
      lines.push('```');
    });
  }

  return lines.join('\n');
};

const formatTestCaseMarkdown = (testCase: TestCaseResult) => {
  const lines: string[] = [];
  lines.push(`### ${testCase.testCaseId} (${testCase.status})`);
  lines.push(`- Description: ${testCase.description}`);
  lines.push(`- Duration: ${testCase.durationMs}ms`);
  lines.push(`- Started: ${testCase.startedAt}`);
  lines.push(`- Ended: ${testCase.endedAt}`);
  if (testCase.evidenceRefs.length > 0) {
    lines.push(`- Evidence Refs: ${testCase.evidenceRefs.join(', ')}`);
  }
  lines.push('');
  lines.push('#### Steps');
  testCase.steps.forEach(step => {
    lines.push(`- ${step.stepId} (${step.status}) [${step.tool}] ${step.description}`);
    if (step.error) {
      lines.push(`  - Error: ${step.error}`);
    }
    if (step.evidenceRefs.length > 0) {
      lines.push(`  - Evidence: ${step.evidenceRefs.join(', ')}`);
    }
  });
  lines.push('');
  return lines.join('\n');
};

import type { BugReport } from '../bug-report';
import type { TestRunSummary } from '../test-runner';
export type BugSeverity = BugReport['severity'];

export type QaRecordMetadata = {
  tags?: string[];
  url?: string;
  severity?: BugSeverity;
  startedAt?: string;
  endedAt?: string;
  observedAt?: string;
  reportedAt?: string;
  browserbaseSessionId?: string;
  browserbaseSessionUrl?: string;
};

export type QaSearchQuery = {
  tags?: string[];
  url?: string;
  severity?: BugSeverity;
  from?: string;
  to?: string;
};

export type TestRunStorageInput = {
  summary: TestRunSummary;
  suiteId?: string;
  suiteDescription?: string;
  metadata?: QaRecordMetadata;
};

export type BugReportStorageInput = {
  report: BugReport;
  metadata?: QaRecordMetadata;
};

export type TestRunRecord = {
  id: string;
  suiteId?: string;
  suiteDescription?: string;
  summary: TestRunSummary;
  metadata: QaRecordMetadata;
  createdAt: string;
};

export type BugReportRecord = {
  id: string;
  report: BugReport;
  metadata: QaRecordMetadata;
  createdAt: string;
};

export interface QaStorage {
  saveTestRun(input: TestRunStorageInput): Promise<TestRunRecord>;
  saveBugReport(input: BugReportStorageInput): Promise<BugReportRecord>;
  updateBugReport(record: BugReportRecord): Promise<BugReportRecord>;
  searchTestRuns(query?: QaSearchQuery): Promise<TestRunRecord[]>;
  searchBugReports(query?: QaSearchQuery): Promise<BugReportRecord[]>;
}

export const normalizeTags = (tags?: string[]) =>
  tags?.map(tag => tag.trim()).filter(tag => tag.length > 0) ?? [];

export const buildTestRunMetadata = (summary: TestRunSummary, metadata?: QaRecordMetadata): QaRecordMetadata => ({
  tags: normalizeTags(metadata?.tags),
  url: metadata?.url,
  startedAt: summary.startedAt,
  endedAt: summary.endedAt,
  browserbaseSessionId: metadata?.browserbaseSessionId,
  browserbaseSessionUrl: metadata?.browserbaseSessionUrl,
});

export const buildBugReportMetadata = (report: BugReport, metadata?: QaRecordMetadata): QaRecordMetadata => ({
  tags: normalizeTags(metadata?.tags),
  url: metadata?.url ?? report.urls?.[0],
  severity: report.severity,
  observedAt: report.timestamps.observedAt,
  reportedAt: report.timestamps.reportedAt,
});

export const resolveRecordDate = (metadata: QaRecordMetadata, createdAt: string) =>
  metadata.startedAt ?? metadata.observedAt ?? metadata.reportedAt ?? createdAt;

export const matchesQuery = (metadata: QaRecordMetadata, createdAt: string, query?: QaSearchQuery) => {
  if (!query) {
    return true;
  }

  if (query.tags && query.tags.length > 0) {
    const tags = metadata.tags ?? [];
    const hasAllTags = query.tags.every(tag => tags.includes(tag));
    if (!hasAllTags) {
      return false;
    }
  }

  if (query.url && metadata.url !== query.url) {
    return false;
  }

  if (query.severity && metadata.severity !== query.severity) {
    return false;
  }

  const recordDate = resolveRecordDate(metadata, createdAt);
  if (query.from && recordDate < query.from) {
    return false;
  }

  if (query.to && recordDate > query.to) {
    return false;
  }

  return true;
};

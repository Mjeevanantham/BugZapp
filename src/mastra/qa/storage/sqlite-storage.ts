import path from 'path';
import { randomUUID } from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import type {
  BugReportRecord,
  BugReportStorageInput,
  QaSearchQuery,
  QaStorage,
  TestRunRecord,
  TestRunStorageInput,
} from './storage';
import { buildBugReportMetadata, buildTestRunMetadata, matchesQuery, normalizeTags } from './storage';

const DEFAULT_SQLITE_PATH = path.join(process.cwd(), 'qa-storage.sqlite');

type SqliteStorageConfig = {
  sqlitePath?: string;
};

export class SqliteQaStorage implements QaStorage {
  private db: DatabaseSync;

  constructor(config: SqliteStorageConfig = {}) {
    const sqlitePath = config.sqlitePath ?? DEFAULT_SQLITE_PATH;
    this.db = new DatabaseSync(sqlitePath);
    this.setup();
  }

  async saveTestRun(input: TestRunStorageInput): Promise<TestRunRecord> {
    const record: TestRunRecord = {
      id: randomUUID(),
      suiteId: input.suiteId,
      suiteDescription: input.suiteDescription,
      summary: input.summary,
      metadata: buildTestRunMetadata(input.summary, input.metadata),
      createdAt: new Date().toISOString(),
    };

    const tags = normalizeTags(record.metadata.tags);
    this.db
      .prepare(
        `INSERT INTO test_runs
        (id, suite_id, suite_description, summary, tags, url, started_at, ended_at, browserbase_session_id, browserbase_session_url, created_at)
        VALUES ($id, $suiteId, $suiteDescription, $summary, $tags, $url, $startedAt, $endedAt, $browserbaseSessionId, $browserbaseSessionUrl, $createdAt)`,
      )
      .run({
        $id: record.id,
        $suiteId: record.suiteId ?? null,
        $suiteDescription: record.suiteDescription ?? null,
        $summary: JSON.stringify(record.summary),
        $tags: JSON.stringify(tags),
        $url: record.metadata.url ?? null,
        $startedAt: record.metadata.startedAt ?? null,
        $endedAt: record.metadata.endedAt ?? null,
        $browserbaseSessionId: record.metadata.browserbaseSessionId ?? null,
        $browserbaseSessionUrl: record.metadata.browserbaseSessionUrl ?? null,
        $createdAt: record.createdAt,
      });

    return record;
  }

  async saveBugReport(input: BugReportStorageInput): Promise<BugReportRecord> {
    const record: BugReportRecord = {
      id: randomUUID(),
      report: input.report,
      metadata: buildBugReportMetadata(input.report, input.metadata),
      createdAt: new Date().toISOString(),
    };

    const tags = normalizeTags(record.metadata.tags);
    this.db
      .prepare(
        `INSERT INTO bug_reports
        (id, report, tags, url, severity, observed_at, reported_at, created_at)
        VALUES ($id, $report, $tags, $url, $severity, $observedAt, $reportedAt, $createdAt)`,
      )
      .run({
        $id: record.id,
        $report: JSON.stringify(record.report),
        $tags: JSON.stringify(tags),
        $url: record.metadata.url ?? null,
        $severity: record.metadata.severity ?? null,
        $observedAt: record.metadata.observedAt ?? null,
        $reportedAt: record.metadata.reportedAt ?? null,
        $createdAt: record.createdAt,
      });

    return record;
  }

  async updateBugReport(record: BugReportRecord): Promise<BugReportRecord> {
    const tags = normalizeTags(record.metadata.tags);
    this.db
      .prepare(
        `UPDATE bug_reports
        SET report = $report, tags = $tags, url = $url, severity = $severity, observed_at = $observedAt, reported_at = $reportedAt
        WHERE id = $id`,
      )
      .run({
        $id: record.id,
        $report: JSON.stringify(record.report),
        $tags: JSON.stringify(tags),
        $url: record.metadata.url ?? null,
        $severity: record.metadata.severity ?? null,
        $observedAt: record.metadata.observedAt ?? null,
        $reportedAt: record.metadata.reportedAt ?? null,
      });

    return record;
  }

  async searchTestRuns(query?: QaSearchQuery): Promise<TestRunRecord[]> {
    const { sql, params } = this.buildTestRunQuery(query);
    const rows = this.db.prepare(sql).all(params) as SqliteTestRunRow[];
    const records = rows.map(row => this.mapTestRunRow(row));
    return this.filterByTags(records, query);
  }

  async searchBugReports(query?: QaSearchQuery): Promise<BugReportRecord[]> {
    const { sql, params } = this.buildBugReportQuery(query);
    const rows = this.db.prepare(sql).all(params) as SqliteBugReportRow[];
    const records = rows.map(row => this.mapBugReportRow(row));
    return this.filterByTags(records, query);
  }

  private setup() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS test_runs (
        id TEXT PRIMARY KEY,
        suite_id TEXT,
        suite_description TEXT,
        summary TEXT NOT NULL,
        tags TEXT,
        url TEXT,
        started_at TEXT,
        ended_at TEXT,
        browserbase_session_id TEXT,
        browserbase_session_url TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS bug_reports (
        id TEXT PRIMARY KEY,
        report TEXT NOT NULL,
        tags TEXT,
        url TEXT,
        severity TEXT,
        observed_at TEXT,
        reported_at TEXT,
        created_at TEXT NOT NULL
      );
    `);

    this.ensureColumn('test_runs', 'browserbase_session_id', 'TEXT');
    this.ensureColumn('test_runs', 'browserbase_session_url', 'TEXT');
  }

  private buildTestRunQuery(query?: QaSearchQuery) {
    const clauses: string[] = [];
    const params: Record<string, string> = {};

    if (query?.url) {
      clauses.push('url = $url');
      params.$url = query.url;
    }

    if (query?.from) {
      clauses.push('started_at >= $from');
      params.$from = query.from;
    }

    if (query?.to) {
      clauses.push('started_at <= $to');
      params.$to = query.to;
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    return {
      sql: `SELECT * FROM test_runs ${where} ORDER BY started_at DESC`,
      params,
    };
  }

  private buildBugReportQuery(query?: QaSearchQuery) {
    const clauses: string[] = [];
    const params: Record<string, string> = {};

    if (query?.url) {
      clauses.push('url = $url');
      params.$url = query.url;
    }

    if (query?.severity) {
      clauses.push('severity = $severity');
      params.$severity = query.severity;
    }

    if (query?.from) {
      clauses.push('observed_at >= $from');
      params.$from = query.from;
    }

    if (query?.to) {
      clauses.push('observed_at <= $to');
      params.$to = query.to;
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    return {
      sql: `SELECT * FROM bug_reports ${where} ORDER BY observed_at DESC`,
      params,
    };
  }

  private filterByTags<T extends { metadata: { tags?: string[] }; createdAt: string }>(
    records: T[],
    query?: QaSearchQuery,
  ) {
    if (!query?.tags || query.tags.length === 0) {
      return records;
    }
    return records.filter(record => matchesQuery(record.metadata, record.createdAt, query));
  }

  private mapTestRunRow(row: SqliteTestRunRow): TestRunRecord {
    return {
      id: row.id,
      suiteId: row.suite_id ?? undefined,
      suiteDescription: row.suite_description ?? undefined,
      summary: JSON.parse(row.summary) as TestRunRecord['summary'],
      metadata: {
        tags: row.tags ? (JSON.parse(row.tags) as string[]) : [],
        url: row.url ?? undefined,
        startedAt: row.started_at ?? undefined,
        endedAt: row.ended_at ?? undefined,
        browserbaseSessionId: row.browserbase_session_id ?? undefined,
        browserbaseSessionUrl: row.browserbase_session_url ?? undefined,
      },
      createdAt: row.created_at,
    };
  }

  private mapBugReportRow(row: SqliteBugReportRow): BugReportRecord {
    return {
      id: row.id,
      report: JSON.parse(row.report) as BugReportRecord['report'],
      metadata: {
        tags: row.tags ? (JSON.parse(row.tags) as string[]) : [],
        url: row.url ?? undefined,
        severity: row.severity ?? undefined,
        observedAt: row.observed_at ?? undefined,
        reportedAt: row.reported_at ?? undefined,
      },
      createdAt: row.created_at,
    };
  }

  private ensureColumn(table: string, column: string, definition: string) {
    try {
      const columns = this.db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
      const hasColumn = columns.some(entry => entry.name === column);
      if (!hasColumn) {
        this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      }
    } catch (error) {
      console.error(`Failed to ensure column ${column} on ${table}:`, error);
    }
  }
}

type SqliteTestRunRow = {
  id: string;
  suite_id: string | null;
  suite_description: string | null;
  summary: string;
  tags: string | null;
  url: string | null;
  started_at: string | null;
  ended_at: string | null;
  browserbase_session_id: string | null;
  browserbase_session_url: string | null;
  created_at: string;
};

type SqliteBugReportRow = {
  id: string;
  report: string;
  tags: string | null;
  url: string | null;
  severity: string | null;
  observed_at: string | null;
  reported_at: string | null;
  created_at: string;
};

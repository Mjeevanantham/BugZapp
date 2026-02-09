import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type {
  BugReportRecord,
  BugReportStorageInput,
  QaSearchQuery,
  QaStorage,
  TestRunRecord,
  TestRunStorageInput,
} from './storage';
import { buildBugReportMetadata, buildTestRunMetadata, matchesQuery } from './storage';

const DEFAULT_STORAGE_DIR = path.join(process.cwd(), 'qa-storage');

type LocalJsonStorageConfig = {
  baseDir?: string;
};

export class LocalJsonQaStorage implements QaStorage {
  private baseDir: string;

  constructor(config: LocalJsonStorageConfig = {}) {
    this.baseDir = config.baseDir ?? DEFAULT_STORAGE_DIR;
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

    await this.ensureDir(this.testRunDir());
    await fs.writeFile(this.recordPath(this.testRunDir(), record.id), JSON.stringify(record, null, 2), 'utf8');

    return record;
  }

  async saveBugReport(input: BugReportStorageInput): Promise<BugReportRecord> {
    const record: BugReportRecord = {
      id: randomUUID(),
      report: input.report,
      metadata: buildBugReportMetadata(input.report, input.metadata),
      createdAt: new Date().toISOString(),
    };

    await this.ensureDir(this.bugReportDir());
    await fs.writeFile(this.recordPath(this.bugReportDir(), record.id), JSON.stringify(record, null, 2), 'utf8');

    return record;
  }

  async updateBugReport(record: BugReportRecord): Promise<BugReportRecord> {
    await this.ensureDir(this.bugReportDir());
    await fs.writeFile(this.recordPath(this.bugReportDir(), record.id), JSON.stringify(record, null, 2), 'utf8');
    return record;
  }

  async searchTestRuns(query?: QaSearchQuery): Promise<TestRunRecord[]> {
    const records = await this.readRecords<TestRunRecord>(this.testRunDir());
    return records.filter(record => matchesQuery(record.metadata, record.createdAt, query));
  }

  async searchBugReports(query?: QaSearchQuery): Promise<BugReportRecord[]> {
    const records = await this.readRecords<BugReportRecord>(this.bugReportDir());
    return records.filter(record => matchesQuery(record.metadata, record.createdAt, query));
  }

  private testRunDir() {
    return path.join(this.baseDir, 'test-runs');
  }

  private bugReportDir() {
    return path.join(this.baseDir, 'bug-reports');
  }

  private recordPath(dir: string, id: string) {
    return path.join(dir, `${id}.json`);
  }

  private async ensureDir(dir: string) {
    await fs.mkdir(dir, { recursive: true });
  }

  private async readRecords<T>(dir: string): Promise<T[]> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const records: T[] = [];
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.json')) {
          continue;
        }
        const payload = await fs.readFile(path.join(dir, entry.name), 'utf8');
        records.push(JSON.parse(payload) as T);
      }
      return records;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }
}

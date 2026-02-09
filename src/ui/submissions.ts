import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { QaStorage, TestRunRecord } from '../mastra/qa/storage/storage';
import type { TestCase } from '../mastra/qa/test-case';
import { runTestSuite } from '../mastra/qa/test-runner';

export type SubmissionStatus = 'queued' | 'running' | 'completed' | 'failed';

export type SubmissionRecord = {
  id: string;
  url: string;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
  runId?: string;
  runStatus?: string;
  error?: string;
  targets?: string[];
  discovery?: {
    source: 'sitemap' | 'crawl';
    seedUrl: string;
  };
};

type SubmissionStore = {
  submissions: SubmissionRecord[];
};

const DEFAULT_STORAGE_PATH = path.join(process.cwd(), 'qa-storage', 'submissions.json');

export class SubmissionQueue {
  private submissions = new Map<string, SubmissionRecord>();
  private queue: string[] = [];
  private isProcessing = false;
  private storagePath: string;
  private qaStorage: QaStorage;

  constructor({ storagePath = DEFAULT_STORAGE_PATH, qaStorage }: { storagePath?: string; qaStorage: QaStorage }) {
    this.storagePath = storagePath;
    this.qaStorage = qaStorage;
  }

  async initialize() {
    const records = await this.load();
    records.forEach(record => {
      const normalized =
        record.status === 'running'
          ? { ...record, status: 'queued', updatedAt: new Date().toISOString() }
          : record;
      this.submissions.set(normalized.id, normalized);
      if (normalized.status === 'queued') {
        this.queue.push(normalized.id);
      }
    });
    await this.persist();
    this.processQueue().catch(error => {
      console.error('Submission queue initialization error:', error);
    });
  }

  list() {
    return Array.from(this.submissions.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(id: string) {
    return this.submissions.get(id);
  }

  async create(url: string) {
    const now = new Date().toISOString();
    const record: SubmissionRecord = {
      id: randomUUID(),
      url,
      status: 'queued',
      createdAt: now,
      updatedAt: now,
    };
    this.submissions.set(record.id, record);
    this.queue.push(record.id);
    await this.persist();
    this.processQueue().catch(error => {
      console.error('Submission queue processing error:', error);
    });
    return record;
  }

  async retry(id: string) {
    const record = this.submissions.get(id);
    if (!record) {
      return undefined;
    }

    const updated: SubmissionRecord = {
      ...record,
      status: 'queued',
      updatedAt: new Date().toISOString(),
      error: undefined,
    };
    this.submissions.set(id, updated);
    this.queue.push(id);
    await this.persist();
    this.processQueue().catch(error => {
      console.error('Submission queue processing error:', error);
    });
    return updated;
  }

  private async processQueue() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    while (this.queue.length > 0) {
      const id = this.queue.shift();
      if (!id) {
        continue;
      }
      await this.processSubmission(id);
    }
    this.isProcessing = false;
  }

  private async processSubmission(id: string) {
    const record = this.submissions.get(id);
    if (!record) {
      return;
    }

    const running = this.updateRecord(id, { status: 'running', error: undefined });
    await this.persist();

    try {
      const discovery = await discoverSiteTargets(running.url);
      const targets = discovery.targets.length > 0 ? discovery.targets : [running.url];
      this.updateRecord(id, {
        targets,
        discovery: { source: discovery.source, seedUrl: running.url },
      });
      await this.persist();

      const testCases = buildSubmissionTestCases(targets);
      await runTestSuite({
        testCases,
        metadata: {
          url: running.url,
          tags: [`submission:${running.id}`],
        },
        storage: this.qaStorage,
      });

      const runRecord = await findSubmissionRun(this.qaStorage, running.id);
      this.updateRecord(id, {
        status: 'completed',
        runId: runRecord?.id,
        runStatus: runRecord?.summary.status,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.updateRecord(id, { status: 'failed', error: message });
    }

    await this.persist();
  }

  private updateRecord(id: string, updates: Partial<SubmissionRecord>) {
    const existing = this.submissions.get(id);
    if (!existing) {
      throw new Error(`Submission ${id} not found`);
    }
    const updated: SubmissionRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.submissions.set(id, updated);
    return updated;
  }

  private async load() {
    try {
      const payload = await fs.readFile(this.storagePath, 'utf8');
      const data = JSON.parse(payload) as SubmissionStore;
      return Array.isArray(data.submissions) ? data.submissions : [];
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  private async persist() {
    await fs.mkdir(path.dirname(this.storagePath), { recursive: true });
    const payload: SubmissionStore = { submissions: this.list() };
    await fs.writeFile(this.storagePath, JSON.stringify(payload, null, 2), 'utf8');
  }
}

const buildSubmissionTestCases = (targets: string[]): TestCase[] =>
  targets.map((url, index) => ({
    id: `submission-smoke-${index + 1}`,
    description: `Run a navigation and content smoke test for ${url}.`,
    preconditions: ['A valid URL is provided.'],
    steps: [
      {
        id: 'navigate',
        description: 'Navigate to the submitted URL.',
        tool: 'web-navigate',
        input: { url },
      },
      {
        id: 'observe-navigation',
        description: 'Observe primary navigation or key call-to-action elements.',
        tool: 'web-observe',
        input: {
          instruction: 'Identify the primary navigation links or main call-to-action buttons on the page.',
        },
      },
      {
        id: 'extract-summary',
        description: 'Extract the main heading and summary content.',
        tool: 'web-extract',
        input: {
          instruction: 'Extract the main page heading and a short summary of the page content.',
        },
      },
    ],
    assertions: ['Page should load without fatal errors.', 'Primary content should be present.'],
    tags: ['submission', 'smoke'],
    priority: 'high',
  }));

const findSubmissionRun = async (qaStorage: QaStorage, submissionId: string): Promise<TestRunRecord | undefined> => {
  const records = await qaStorage.searchTestRuns({ tags: [`submission:${submissionId}`] });
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
};

const discoverSiteTargets = async (url: string) => {
  const maxPages = Number.parseInt(process.env.QA_SUBMISSION_MAX_PAGES ?? '10', 10);
  const maxDepth = Number.parseInt(process.env.QA_SUBMISSION_MAX_DEPTH ?? '2', 10);
  const normalizedUrl = normalizeUrl(url);

  const sitemapTargets = await fetchSitemapTargets(normalizedUrl, maxPages);
  if (sitemapTargets.length > 0) {
    return { source: 'sitemap' as const, targets: sitemapTargets };
  }

  const crawlTargets = await crawlSiteTargets(normalizedUrl, maxPages, maxDepth);
  return { source: 'crawl' as const, targets: crawlTargets };
};

const fetchSitemapTargets = async (url: string, maxPages: number) => {
  try {
    const sitemapUrl = new URL('/sitemap.xml', url);
    const response = await fetch(sitemapUrl);
    if (!response.ok) {
      return [];
    }
    const xml = await response.text();
    const locations = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/gi)).map(match => match[1].trim());
    const origin = new URL(url).origin;
    const filtered = locations.filter(location => location.startsWith(origin));
    return dedupeUrls(filtered).slice(0, maxPages);
  } catch {
    return [];
  }
};

const crawlSiteTargets = async (url: string, maxPages: number, maxDepth: number) => {
  const origin = new URL(url).origin;
  const queue: Array<{ url: string; depth: number }> = [{ url, depth: 0 }];
  const visited = new Set<string>();
  const results: string[] = [];

  while (queue.length > 0 && results.length < maxPages) {
    const current = queue.shift();
    if (!current) {
      break;
    }
    const normalized = normalizeUrl(current.url);
    if (!normalized || visited.has(normalized)) {
      continue;
    }
    visited.add(normalized);
    results.push(normalized);

    if (current.depth >= maxDepth) {
      continue;
    }

    try {
      const response = await fetch(normalized, { headers: { 'User-Agent': 'BugZappCrawler/1.0' } });
      if (!response.ok) {
        continue;
      }
      const html = await response.text();
      const links = extractLinks(html, normalized)
        .filter(link => link.startsWith(origin))
        .filter(link => !visited.has(link));
      links.forEach(link => queue.push({ url: link, depth: current.depth + 1 }));
    } catch {
      continue;
    }
  }

  return results.slice(0, maxPages);
};

const extractLinks = (html: string, baseUrl: string) => {
  const links: string[] = [];
  const regex = /href=["']([^"'#]+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const raw = match[1].trim();
    if (!raw || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('javascript:')) {
      continue;
    }
    try {
      const resolved = new URL(raw, baseUrl).toString();
      links.push(resolved);
    } catch {
      continue;
    }
  }
  return links;
};

const normalizeUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '') || parsed.toString();
  } catch {
    return value;
  }
};

const dedupeUrls = (urls: string[]) => Array.from(new Set(urls));

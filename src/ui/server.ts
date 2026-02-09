import { createServer } from 'node:http';
import type { ServerResponse } from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDefaultQaStorage } from '../mastra/qa/storage';
import { renderJUnitReport } from '../mastra/qa/reporting/junit-writer';
import type { BugReportRecord, TestRunRecord } from '../mastra/qa/storage/storage';
import { SubmissionQueue } from './submissions';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');
const storage = getDefaultQaStorage();
const submissionQueue = new SubmissionQueue({ qaStorage: storage });
submissionQueue.initialize().catch(error => {
  console.error('Failed to initialize submission queue:', error);
});

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');

    if (url.pathname.startsWith('/api/')) {
      await handleApiRequest(req, url, res);
      return;
    }

    await handleStaticRequest(url.pathname, res);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: (error as Error).message }));
  }
});

const handleApiRequest = async (req: import('node:http').IncomingMessage, url: URL, res: ServerResponse) => {
  if (url.pathname === '/api/test-runs') {
    const status = url.searchParams.get('status');
    const records = await storage.searchTestRuns();
    const filtered = status ? records.filter(record => record.summary.status === status) : records;
    respondJson(res, filtered.sort(sortByCreatedDesc));
    return;
  }

  if (url.pathname === '/api/bug-reports') {
    const severity = url.searchParams.get('severity');
    const records = await storage.searchBugReports();
    const filtered = severity ? records.filter(record => record.report.severity === severity) : records;
    respondJson(res, filtered.sort(sortByCreatedDesc));
    return;
  }

  if (url.pathname.startsWith('/api/test-runs/')) {
    const [, , , id, action] = url.pathname.split('/');
    const record = await findTestRun(id);
    if (!record) {
      respondNotFound(res);
      return;
    }

    if (action === 'export') {
      const format = url.searchParams.get('format') ?? 'json';
      if (format === 'junit') {
        const junit = renderJUnitReport({
          summary: record.summary,
          suiteId: record.suiteId,
          suiteName: record.suiteDescription,
        });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename=run-${record.id}.xml`);
        res.end(junit);
        return;
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=run-${record.id}.json`);
      res.end(JSON.stringify(record, null, 2));
      return;
    }

    respondJson(res, record);
    return;
  }

  if (url.pathname.startsWith('/api/bug-reports/')) {
    const [, , , id] = url.pathname.split('/');
    const record = await findBugReport(id);
    if (!record) {
      respondNotFound(res);
      return;
    }
    respondJson(res, record);
    return;
  }

  if (url.pathname === '/api/evidence') {
    const evidencePath = url.searchParams.get('path');
    if (!evidencePath) {
      respondBadRequest(res, 'Missing path parameter.');
      return;
    }

    const resolved = path.resolve(evidencePath);
    const cwd = process.cwd();
    if (!resolved.startsWith(cwd)) {
      respondBadRequest(res, 'Evidence path is outside allowed directory.');
      return;
    }

    const payload = await fs.readFile(resolved);
    res.statusCode = 200;
    res.setHeader('Content-Type', resolveContentType(resolved));
    res.end(payload);
    return;
  }

  if (url.pathname === '/api/submissions') {
    if (req.method === 'GET') {
      respondJson(res, submissionQueue.list());
      return;
    }

    if (req.method === 'POST') {
      let payload: Record<string, unknown> | undefined;
      try {
        payload = await parseJsonBody(req);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid request payload.';
        respondBadRequest(res, message);
        return;
      }
      const urlValue = typeof payload?.url === 'string' ? payload.url.trim() : '';
      if (!urlValue) {
        respondBadRequest(res, 'Missing url.');
        return;
      }

      if (!isValidHttpUrl(urlValue)) {
        respondBadRequest(res, 'URL must start with http:// or https://');
        return;
      }

      const created = await submissionQueue.create(urlValue);
      respondJson(res, created);
      return;
    }
  }

  if (url.pathname.startsWith('/api/submissions/')) {
    const [, , , id, action] = url.pathname.split('/');
    const record = submissionQueue.get(id);
    if (!record) {
      respondNotFound(res);
      return;
    }

    if (action === 'retry' && req.method === 'POST') {
      const updated = await submissionQueue.retry(id);
      if (!updated) {
        respondNotFound(res);
        return;
      }
      respondJson(res, updated);
      return;
    }

    respondJson(res, record);
    return;
  }

  respondNotFound(res);
};

const handleStaticRequest = async (pathname: string, res: ServerResponse) => {
  const resolvedPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(publicDir, resolvedPath);

  try {
    const fileContents = await fs.readFile(filePath);
    res.statusCode = 200;
    res.setHeader('Content-Type', resolveContentType(filePath));
    res.end(fileContents);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      respondNotFound(res);
      return;
    }
    throw error;
  }
};

const readRequestBody = async (req: import('node:http').IncomingMessage) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
};

const parseJsonBody = async (req: import('node:http').IncomingMessage) => {
  const body = await readRequestBody(req);
  if (!body) {
    return undefined;
  }
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch (error) {
    throw new Error('Invalid JSON payload.');
  }
};

const isValidHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const resolveContentType = (filePath: string) => {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case '.html':
      return 'text/html';
    case '.js':
      return 'application/javascript';
    case '.css':
      return 'text/css';
    case '.json':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
};

const respondJson = (res: ServerResponse, payload: unknown) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload, null, 2));
};

const respondNotFound = (res: ServerResponse) => {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not found' }));
};

const respondBadRequest = (res: ServerResponse, message: string) => {
  res.statusCode = 400;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: message }));
};

const sortByCreatedDesc = (a: { createdAt: string }, b: { createdAt: string }) =>
  b.createdAt.localeCompare(a.createdAt);

const findTestRun = async (id: string): Promise<TestRunRecord | undefined> => {
  const records = await storage.searchTestRuns();
  return records.find(record => record.id === id);
};

const findBugReport = async (id: string): Promise<BugReportRecord | undefined> => {
  const records = await storage.searchBugReports();
  return records.find(record => record.id === id);
};

const port = Number.parseInt(process.env.QA_UI_PORT ?? '5050', 10);
server.listen(port, () => {
  console.log(`QA UI listening on http://localhost:${port}`);
});

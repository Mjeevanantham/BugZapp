import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import type { Page } from '@browserbasehq/stagehand';
import type { EvidenceArtifact } from '../mastra/qa/bug-report';

type ConsoleLogEntry = {
  type: string;
  text: string;
  location?: {
    url?: string;
    lineNumber?: number;
    columnNumber?: number;
  };
  timestamp: string;
};

type NetworkErrorEntry = {
  url: string;
  method: string;
  failure?: string;
  timestamp: string;
};

type EvidenceCollector = {
  consoleLogs: ConsoleLogEntry[];
  networkErrors: NetworkErrorEntry[];
  detach: () => void;
};

const ensureDir = async (dirPath: string) => {
  await fs.mkdir(dirPath, { recursive: true });
};

export const createEvidenceCollector = (page: Page): EvidenceCollector => {
  const consoleLogs: ConsoleLogEntry[] = [];
  const networkErrors: NetworkErrorEntry[] = [];

  const onConsole = (msg: any) => {
    consoleLogs.push({
      type: msg.type?.() ?? 'log',
      text: msg.text?.() ?? '',
      location: msg.location?.(),
      timestamp: new Date().toISOString(),
    });
  };

  const onRequestFailed = (request: any) => {
    networkErrors.push({
      url: request.url?.() ?? '',
      method: request.method?.() ?? 'GET',
      failure: request.failure?.()?.errorText,
      timestamp: new Date().toISOString(),
    });
  };

  page.on('console', onConsole);
  page.on('requestfailed', onRequestFailed);

  return {
    consoleLogs,
    networkErrors,
    detach: () => {
      page.off('console', onConsole);
      page.off('requestfailed', onRequestFailed);
    },
  };
};

type CaptureEvidenceOptions = {
  page: Page;
  outputDir?: string;
  consoleLogs?: ConsoleLogEntry[];
  networkErrors?: NetworkErrorEntry[];
  label?: string;
};

export const captureEvidence = async ({
  page,
  outputDir,
  consoleLogs = [],
  networkErrors = [],
  label,
}: CaptureEvidenceOptions): Promise<{ evidence: EvidenceArtifact[]; directory: string }> => {
  const runId = randomUUID();
  const baseDir = outputDir ?? path.join(process.cwd(), 'evidence');
  const directory = path.join(baseDir, label ? `${label}-${runId}` : runId);

  await ensureDir(directory);

  const evidence: EvidenceArtifact[] = [];
  const timestamp = new Date().toISOString();

  const screenshotPath = path.join(directory, 'screenshot.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  evidence.push({
    type: 'screenshot',
    path: screenshotPath,
    mimeType: 'image/png',
    createdAt: timestamp,
  });

  const htmlPath = path.join(directory, 'page.html');
  const htmlContent = await page.content();
  await fs.writeFile(htmlPath, htmlContent, 'utf8');
  evidence.push({
    type: 'html',
    path: htmlPath,
    mimeType: 'text/html',
    createdAt: timestamp,
  });

  const consolePath = path.join(directory, 'console-logs.json');
  await fs.writeFile(consolePath, JSON.stringify(consoleLogs, null, 2), 'utf8');
  evidence.push({
    type: 'console-log',
    path: consolePath,
    mimeType: 'application/json',
    createdAt: timestamp,
  });

  const networkPath = path.join(directory, 'network-errors.json');
  await fs.writeFile(networkPath, JSON.stringify(networkErrors, null, 2), 'utf8');
  evidence.push({
    type: 'network-error',
    path: networkPath,
    mimeType: 'application/json',
    createdAt: timestamp,
  });

  return { evidence, directory };
};

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { sessionManager } from '../../lib/stage-hand';
import { bugReportSchema } from '../qa/bug-report';
import { captureEvidence, createEvidenceCollector } from '../../lib/evidence-capture';
import { promises as fs } from 'fs';
import path from 'path';
import { getDefaultQaStorage } from '../qa/storage';

const assertionResultSchema = z.object({
  passed: z.boolean(),
  details: z.string().optional(),
  actual: z.string().optional(),
});

export const qaAssertTool = createTool({
  id: 'qa-assert',
  description: 'Run a QA assertion against a page and capture evidence on failure',
  inputSchema: z.object({
    url: z.string().optional().describe('URL to navigate to (optional if already on a page)'),
    title: z.string().describe('Short bug title if the assertion fails'),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('Bug severity'),
    steps: z.array(z.string()).describe('Reproduction steps'),
    assertion: z
      .string()
      .describe('Assertion instruction to evaluate (e.g., "check login button is visible")'),
    expected: z.string().describe('Expected result'),
    actual: z.string().optional().describe('Actual result (optional, captured on failure if omitted)'),
    domSelectors: z.array(z.string()).optional().describe('Relevant DOM selectors'),
    tags: z.array(z.string().min(1)).optional().describe('Tags for metadata and storage'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    bugReportPath: z.string().optional(),
    evidenceDirectory: z.string().optional(),
    bugReportId: z.string().optional(),
  }),
  execute: async input => {
    return await performQaAssertion(input);
  },
});

const performQaAssertion = async (input: {
  url?: string;
  title: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  steps: string[];
  assertion: string;
  expected: string;
  actual?: string;
  domSelectors?: string[];
  tags?: string[];
}) => {
  const stagehand = await sessionManager.ensureStagehand();
  const page = stagehand.page;
  const collector = createEvidenceCollector(page);

  try {
    if (input.url) {
      await page.goto(input.url);
    }

    const result = await page.extract({
      instruction: input.assertion,
      schema: assertionResultSchema,
    });

    if (result.passed) {
      collector.detach();
      return {
        success: true,
        message: result.details ?? 'Assertion passed',
      };
    }

    const { evidence, directory } = await captureEvidence({
      page,
      consoleLogs: collector.consoleLogs,
      networkErrors: collector.networkErrors,
      label: 'qa-assert',
    });

    const observedAt = new Date().toISOString();
    const environment = {
      userAgent: await page.evaluate(() => navigator.userAgent).catch(() => undefined),
      viewport: page.viewportSize() ?? undefined,
      locale: await page.evaluate(() => navigator.language).catch(() => undefined),
      timezone: await page
        .evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone)
        .catch(() => undefined),
      browser: 'Stagehand',
      os: await page.evaluate(() => navigator.platform).catch(() => undefined),
    };

    const bugReport = bugReportSchema.parse({
      title: input.title,
      severity: input.severity ?? 'medium',
      steps: input.steps,
      expected: input.expected,
      actual: input.actual ?? result.actual ?? result.details ?? 'Assertion failed',
      environment,
      timestamps: {
        observedAt,
        reportedAt: new Date().toISOString(),
      },
      urls: [page.url()],
      domSelectors: input.domSelectors,
      evidence,
    });

    const reportPath = path.join(directory, 'bug-report.json');
    await fs.writeFile(reportPath, JSON.stringify(bugReport, null, 2), 'utf8');

    const qaStorage = getDefaultQaStorage();
    const stored = await qaStorage.saveBugReport({
      report: bugReport,
      metadata: {
        tags: input.tags,
        url: page.url(),
      },
    });

    collector.detach();

    return {
      success: false,
      message: 'Assertion failed. Bug report captured.',
      bugReportPath: reportPath,
      evidenceDirectory: directory,
      bugReportId: stored.id,
    };
  } catch (error: any) {
    collector.detach();
    throw new Error(`QA assertion failed: ${error.message}`);
  }
};

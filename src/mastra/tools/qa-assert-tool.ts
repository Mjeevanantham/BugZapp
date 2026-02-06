import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { sessionManager } from '../../lib/stage-hand';
import { bugReportSchema } from '../qa/bug-report';
import { inferBugTriageDefaults } from '../qa/triage';
import { captureEvidence, createEvidenceCollector } from '../../lib/evidence-capture';
import { promises as fs } from 'fs';
import path from 'path';
import { getDefaultQaStorage } from '../qa/storage';

const assertionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('selector_visible'),
    selector: z.string().min(1),
    description: z.string().optional(),
  }),
  z.object({
    type: z.literal('text_equals'),
    selector: z.string().min(1),
    expected: z.string(),
    normalizeWhitespace: z.boolean().optional(),
    description: z.string().optional(),
  }),
  z.object({
    type: z.literal('url_matches'),
    expected: z.string(),
    matchType: z.enum(['equals', 'contains', 'regex']).optional(),
    description: z.string().optional(),
  }),
  z.object({
    type: z.literal('element_count'),
    selector: z.string().min(1),
    expected: z.number().int().nonnegative(),
    comparison: z.enum(['equals', 'gte', 'lte']).optional(),
    description: z.string().optional(),
  }),
]);

type AssertionInput = z.infer<typeof assertionSchema>;

type AssertionFailure = {
  type: AssertionInput['type'];
  selector?: string;
  expected?: string;
  actual?: string;
  message: string;
};

export const qaAssertTool = createTool({
  id: 'qa-assert',
  description: 'Run structured QA assertions against a page and capture evidence on failure',
  inputSchema: z.object({
    url: z.string().optional().describe('URL to navigate to (optional if already on a page)'),
    title: z.string().describe('Short bug title if the assertion fails'),
    severity: z.enum(['blocker', 'critical', 'major', 'minor']).optional().describe('Bug severity'),
    priority: z.enum(['p0', 'p1', 'p2', 'p3']).optional().describe('Bug priority'),
    reproducibility: z.enum(['always', 'sometimes', 'rare', 'unable']).optional().describe('Bug reproducibility'),
    component: z.string().optional().describe('Owning component'),
    environmentName: z.string().optional().describe('Environment name (e.g. staging, prod)'),
    environmentUrl: z.string().optional().describe('Environment base URL'),
    steps: z.array(z.string()).describe('Reproduction steps'),
    assertions: z.array(assertionSchema).min(1).describe('Assertions to evaluate'),
    expected: z.string().optional().describe('Legacy expected result (optional)'),
    actual: z.string().optional().describe('Legacy actual result (optional)'),
    domSelectors: z.array(z.string()).optional().describe('Relevant DOM selectors'),
    tags: z.array(z.string().min(1)).optional().describe('Tags for metadata and storage'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    failures: z.array(
      z.object({
        type: z.string(),
        selector: z.string().optional(),
        expected: z.string().optional(),
        actual: z.string().optional(),
        message: z.string(),
      })
    ),
    bugReportPath: z.string().optional(),
    evidenceDirectory: z.string().optional(),
    bugReportId: z.string().optional(),
  }),
  execute: async input => {
    return await performQaAssertion(input);
  },
});

const normalizeText = (text: string, shouldNormalize?: boolean) => {
  if (!shouldNormalize) {
    return text;
  }
  return text.replace(/\s+/g, ' ').trim();
};

const formatAssertionExpectation = (assertion: AssertionInput) => {
  switch (assertion.type) {
    case 'selector_visible':
      return `Selector ${assertion.selector} is visible`;
    case 'text_equals':
      return `Text of ${assertion.selector} equals "${assertion.expected}"`;
    case 'url_matches': {
      const matchType = assertion.matchType ?? 'equals';
      return `URL ${matchType} "${assertion.expected}"`;
    }
    case 'element_count': {
      const comparison = assertion.comparison ?? 'equals';
      return `Count of ${assertion.selector} ${comparison} ${assertion.expected}`;
    }
  }
};

const collectAssertionFailure = (
  assertion: AssertionInput,
  details: Omit<AssertionFailure, 'type'>
): AssertionFailure => ({
  type: assertion.type,
  ...details,
});

const evaluateAssertion = async (page: any, assertion: AssertionInput): Promise<AssertionFailure | null> => {
  switch (assertion.type) {
    case 'selector_visible': {
      const locator = page.locator(assertion.selector);
      const isVisible = await locator.isVisible().catch(() => false);
      if (isVisible) {
        return null;
      }
      return collectAssertionFailure(assertion, {
        selector: assertion.selector,
        expected: 'visible',
        actual: 'not visible',
        message: assertion.description ?? `Expected ${assertion.selector} to be visible`,
      });
    }
    case 'text_equals': {
      const locator = page.locator(assertion.selector);
      const rawText = await locator.first().textContent().catch(() => null);
      const actualText = rawText === null ? '' : normalizeText(rawText, assertion.normalizeWhitespace);
      const expectedText = normalizeText(assertion.expected, assertion.normalizeWhitespace);
      if (actualText === expectedText) {
        return null;
      }
      return collectAssertionFailure(assertion, {
        selector: assertion.selector,
        expected: expectedText,
        actual: actualText || '(empty)',
        message: assertion.description ?? `Expected text for ${assertion.selector} to equal "${expectedText}"`,
      });
    }
    case 'url_matches': {
      const currentUrl = page.url();
      const matchType = assertion.matchType ?? 'equals';
      let matches = false;
      if (matchType === 'equals') {
        matches = currentUrl === assertion.expected;
      } else if (matchType === 'contains') {
        matches = currentUrl.includes(assertion.expected);
      } else {
        const regex = new RegExp(assertion.expected);
        matches = regex.test(currentUrl);
      }
      if (matches) {
        return null;
      }
      return collectAssertionFailure(assertion, {
        expected: `${matchType} ${assertion.expected}`,
        actual: currentUrl,
        message: assertion.description ?? `Expected URL to ${matchType} "${assertion.expected}"`,
      });
    }
    case 'element_count': {
      const locator = page.locator(assertion.selector);
      const count = await locator.count();
      const comparison = assertion.comparison ?? 'equals';
      let matches = false;
      if (comparison === 'equals') {
        matches = count === assertion.expected;
      } else if (comparison === 'gte') {
        matches = count >= assertion.expected;
      } else {
        matches = count <= assertion.expected;
      }
      if (matches) {
        return null;
      }
      return collectAssertionFailure(assertion, {
        selector: assertion.selector,
        expected: `${comparison} ${assertion.expected}`,
        actual: count.toString(),
        message: assertion.description ?? `Expected ${assertion.selector} count to be ${comparison} ${assertion.expected}`,
      });
    }
  }
};

const performQaAssertion = async (input: {
  url?: string;
  title: string;
  severity?: 'blocker' | 'critical' | 'major' | 'minor';
  priority?: 'p0' | 'p1' | 'p2' | 'p3';
  reproducibility?: 'always' | 'sometimes' | 'rare' | 'unable';
  component?: string;
  environmentName?: string;
  environmentUrl?: string;
  steps: string[];
  assertions: AssertionInput[];
  expected?: string;
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

    const failures: AssertionFailure[] = [];

    for (const assertion of input.assertions) {
      const failure = await evaluateAssertion(page, assertion);
      if (failure) {
        failures.push(failure);
      }
    }

    if (failures.length === 0) {
      collector.detach();
      return {
        success: true,
        message: 'All assertions passed',
        failures: [],
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
      name: input.environmentName,
      url: input.environmentUrl,
      userAgent: await page.evaluate(() => navigator.userAgent).catch(() => undefined),
      viewport: page.viewportSize() ?? undefined,
      locale: await page.evaluate(() => navigator.language).catch(() => undefined),
      timezone: await page
        .evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone)
        .catch(() => undefined),
      browser: 'Stagehand',
      os: await page.evaluate(() => navigator.platform).catch(() => undefined),
    };

    const expectedSummary = input.expected ?? input.assertions.map(formatAssertionExpectation).join('; ');
    const actualSummary = input.actual ?? failures.map(failure => failure.message).join('; ');
    const triageDefaults = inferBugTriageDefaults(failures);

    const bugReport = bugReportSchema.parse({
      title: input.title,
      severity: input.severity ?? triageDefaults.severity,
      priority: input.priority ?? triageDefaults.priority,
      reproducibility: input.reproducibility ?? triageDefaults.reproducibility,
      component: input.component ?? triageDefaults.component,
      steps: input.steps,
      expected: expectedSummary,
      actual: actualSummary,
      environment,
      browser: {
        name: 'Stagehand',
        userAgent: environment.userAgent,
      },
      device: {
        type: environment.viewport?.width ? (environment.viewport.width < 768 ? 'mobile' : 'desktop') : undefined,
        os: environment.os,
        viewport: environment.viewport,
      },
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
      failures,
      bugReportPath: reportPath,
      evidenceDirectory: directory,
      bugReportId: stored.id,
    };
  } catch (error: any) {
    collector.detach();
    throw new Error(`QA assertion failed: ${error.message}`);
  }
};

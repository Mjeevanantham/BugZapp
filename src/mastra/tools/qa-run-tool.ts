import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { runTestSuite } from '../qa/test-runner';
import { testCaseSchema } from '../qa/test-case';

export const qaRunTool = createTool({
  id: 'qa-run-tool',
  description: 'Execute QA test suites or ad-hoc test cases using page tools.',
  inputSchema: z
    .object({
      suiteId: z.string().optional(),
      testCases: z.array(testCaseSchema).optional(),
    })
    .refine(value => value.suiteId || (value.testCases && value.testCases.length > 0), {
      message: 'Provide either suiteId or a non-empty list of testCases.',
    }),
  outputSchema: z.object({
    status: z.enum(['pass', 'fail', 'blocked']),
    durationMs: z.number(),
    startedAt: z.string(),
    endedAt: z.string(),
    testCaseResults: z.array(z.any()),
    evidence: z.array(z.any()),
    evidenceRefs: z.array(z.string()),
  }),
  execute: async input => {
    return await runTestSuite({
      suiteId: input.suiteId,
      testCases: input.testCases,
    });
  },
});

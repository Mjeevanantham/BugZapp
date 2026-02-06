import { z } from 'zod';

export type TestPriority = 'low' | 'medium' | 'high' | 'critical';

export type TestStepTool = 'web-navigate' | 'web-observe' | 'web-act' | 'web-extract';

export type TestStep = {
  id: string;
  description: string;
  tool: TestStepTool;
  input: Record<string, unknown>;
};

export type TestCase = {
  id: string;
  description: string;
  preconditions: string[];
  steps: TestStep[];
  assertions: string[];
  tags: string[];
  priority: TestPriority;
};

export const testStepSchema = z.object({
  id: z.string(),
  description: z.string(),
  tool: z.enum(['web-navigate', 'web-observe', 'web-act', 'web-extract']),
  input: z.record(z.unknown()),
});

export const testCaseSchema = z.object({
  id: z.string(),
  description: z.string(),
  preconditions: z.array(z.string()),
  steps: z.array(testStepSchema),
  assertions: z.array(z.string()),
  tags: z.array(z.string()),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

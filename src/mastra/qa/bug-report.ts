import { z } from 'zod';

export const evidenceArtifactSchema = z.object({
  type: z.enum(['screenshot', 'html', 'console-log', 'network-error', 'artifact']),
  path: z.string().min(1),
  mimeType: z.string().optional(),
  createdAt: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
});

export const bugReportSchema = z.object({
  title: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  steps: z.array(z.string().min(1)).min(1),
  expected: z.string().min(1),
  actual: z.string().min(1),
  environment: z.object({
    userAgent: z.string().optional(),
    viewport: z
      .object({
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      })
      .optional(),
    locale: z.string().optional(),
    timezone: z.string().optional(),
    browser: z.string().optional(),
    os: z.string().optional(),
  }),
  timestamps: z.object({
    observedAt: z.string().datetime(),
    reportedAt: z.string().datetime(),
  }),
  urls: z.array(z.string().url()).optional(),
  domSelectors: z.array(z.string().min(1)).optional(),
  evidence: z.array(evidenceArtifactSchema).optional(),
});

export type BugReport = z.infer<typeof bugReportSchema>;
export type EvidenceArtifact = z.infer<typeof evidenceArtifactSchema>;

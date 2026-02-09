import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getDefaultQaStorage } from '../qa/storage';
import { publishIssue } from '../qa/publishers/issue-publisher';

export const qaPublishIssueTool = createTool({
  id: 'qa-publish-issue',
  description: 'Publish a stored bug report to GitHub Issues or Jira.',
  inputSchema: z.object({
    bugReportId: z.string().min(1).describe('Stored bug report record ID'),
    provider: z.enum(['github', 'jira']).describe('Issue tracker to publish to'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    issueUrl: z.string().optional(),
    provider: z.enum(['github', 'jira']).optional(),
  }),
  execute: async input => {
    try {
      const storage = getDefaultQaStorage();
      const records = await storage.searchBugReports();
      const record = records.find(item => item.id === input.bugReportId);
      if (!record) {
        return { success: false, message: 'Bug report not found.' };
      }

      const issue = await publishIssue({ provider: input.provider, report: record.report });
      const updatedReport = {
        ...record.report,
        externalIssues: [
          ...(record.report.externalIssues ?? []),
          {
            provider: issue.provider,
            url: issue.url,
            key: issue.key,
            id: issue.id,
            createdAt: new Date().toISOString(),
          },
        ],
      };

      const updatedRecord = {
        ...record,
        report: updatedReport,
      };
      await storage.updateBugReport(updatedRecord);

      return {
        success: true,
        provider: issue.provider,
        issueUrl: issue.url,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message };
    }
  },
});

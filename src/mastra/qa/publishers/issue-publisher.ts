import type { BugReport } from '../bug-report';

export type PublishProvider = 'github' | 'jira';

export type PublishResult = {
  provider: PublishProvider;
  url: string;
  key?: string;
  id?: string;
};

type PublishPayload = {
  provider: PublishProvider;
  report: BugReport;
};

export const publishIssue = async ({ provider, report }: PublishPayload): Promise<PublishResult> => {
  if (provider === 'github') {
    return publishToGitHub(report);
  }
  return publishToJira(report);
};

const publishToGitHub = async (report: BugReport): Promise<PublishResult> => {
  const apiUrl = process.env.QA_GITHUB_API_URL ?? 'https://api.github.com';
  const repo = process.env.QA_GITHUB_REPO;
  const token = process.env.QA_GITHUB_TOKEN;

  if (!repo || !token) {
    throw new Error('GitHub publishing requires QA_GITHUB_REPO and QA_GITHUB_TOKEN.');
  }

  const response = await fetch(`${apiUrl}/repos/${repo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: report.title,
      body: buildMarkdownBody(report),
      labels: buildLabels(report),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub issue creation failed: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as { html_url: string; number: number };
  return {
    provider: 'github',
    url: payload.html_url,
    id: String(payload.number),
  };
};

const publishToJira = async (report: BugReport): Promise<PublishResult> => {
  const baseUrl = process.env.QA_JIRA_BASE_URL;
  const email = process.env.QA_JIRA_EMAIL;
  const token = process.env.QA_JIRA_API_TOKEN;
  const projectKey = process.env.QA_JIRA_PROJECT_KEY;
  const issueType = process.env.QA_JIRA_ISSUE_TYPE ?? 'Bug';

  if (!baseUrl || !email || !token || !projectKey) {
    throw new Error(
      'Jira publishing requires QA_JIRA_BASE_URL, QA_JIRA_EMAIL, QA_JIRA_API_TOKEN, and QA_JIRA_PROJECT_KEY.',
    );
  }

  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        project: { key: projectKey },
        summary: report.title,
        issuetype: { name: issueType },
        description: buildAdfBody(report),
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jira issue creation failed: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as { key: string; id: string };
  return {
    provider: 'jira',
    url: `${baseUrl}/browse/${payload.key}`,
    key: payload.key,
    id: payload.id,
  };
};

const buildLabels = (report: BugReport) => {
  const labels = [report.severity, report.priority, report.component].filter(Boolean);
  return Array.from(new Set(labels));
};

const buildMarkdownBody = (report: BugReport) => {
  const lines = [
    `**Severity:** ${report.severity}`,
    `**Priority:** ${report.priority}`,
    `**Component:** ${report.component}`,
    `**Reproducibility:** ${report.reproducibility}`,
    '',
    '## Steps to Reproduce',
    ...report.steps.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## Expected',
    report.expected,
    '',
    '## Actual',
    report.actual,
  ];

  if (report.urls?.length) {
    lines.push('', '## URLs', ...report.urls.map(url => `- ${url}`));
  }

  if (report.evidence?.length) {
    lines.push('', '## Evidence', ...report.evidence.map(artifact => `- ${artifact.type}: ${artifact.path}`));
  }

  return lines.join('\n');
};

const buildAdfBody = (report: BugReport) => {
  const paragraphs = buildMarkdownBody(report)
    .split('\n')
    .map(line => ({
      type: 'paragraph',
      content: line
        ? [
            {
              type: 'text',
              text: line,
            },
          ]
        : [],
    }));

  return {
    type: 'doc',
    version: 1,
    content: paragraphs,
  };
};

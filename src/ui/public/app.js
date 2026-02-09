const statusFilter = document.getElementById('statusFilter');
const severityFilter = document.getElementById('severityFilter');
const submissionForm = document.getElementById('submissionForm');
const submissionUrl = document.getElementById('submissionUrl');
const submissionList = document.getElementById('submissionList');
const summaryStats = document.getElementById('summaryStats');
const runList = document.getElementById('runList');
const bugList = document.getElementById('bugList');
const detailPane = document.getElementById('detailPane');

const state = {
  runs: [],
  bugs: [],
  submissions: [],
};

const fetchJson = async url => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
};

const postJson = async (url, payload) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
};

const formatDate = value => new Date(value).toLocaleString();

const renderBadge = (value, type) => {
  const badge = document.createElement('span');
  badge.className = `badge ${value}`;
  badge.textContent = value;
  if (type === 'severity') {
    badge.title = 'Bug severity';
  } else if (type === 'priority') {
    badge.title = 'Bug priority';
  }
  return badge;
};

const loadRuns = async () => {
  const status = statusFilter.value;
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  state.runs = await fetchJson(`/api/test-runs${query}`);
  renderRunList();
  renderSummaryStats();
};

const loadBugs = async () => {
  const severity = severityFilter.value;
  const query = severity ? `?severity=${encodeURIComponent(severity)}` : '';
  state.bugs = await fetchJson(`/api/bug-reports${query}`);
  renderBugList();
  renderSummaryStats();
};

const loadSubmissions = async () => {
  state.submissions = await fetchJson('/api/submissions');
  renderSubmissionList();
  renderSummaryStats();
};

const renderSubmissionList = () => {
  submissionList.innerHTML = '';
  if (state.submissions.length === 0) {
    submissionList.innerHTML = '<div class="note">No submissions yet.</div>';
    return;
  }

  state.submissions.forEach(submission => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${submission.url}</h3>
      <div class="meta">
        <span>${formatDate(submission.createdAt)}</span>
        <span>${submission.runStatus ?? 'Pending run'}</span>
        <span>${submission.targets?.length ?? 0} pages</span>
      </div>
    `;
    card.querySelector('.meta').appendChild(renderBadge(submission.status, 'status'));
    card.addEventListener('click', () => renderSubmissionDetail(submission));
    submissionList.appendChild(card);
  });
};

const renderSummaryStats = () => {
  if (!summaryStats) {
    return;
  }

  const totalRuns = state.runs.length;
  const passedRuns = state.runs.filter(run => run.summary.status === 'pass').length;
  const totalBugs = state.bugs.length;
  const queued = state.submissions.filter(submission => submission.status === 'queued').length;
  const running = state.submissions.filter(submission => submission.status === 'running').length;
  const failed = state.submissions.filter(submission => submission.status === 'failed').length;
  const completed = state.submissions.filter(submission => submission.status === 'completed').length;
  const passRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 0;

  summaryStats.innerHTML = `
    <div class="stat-card">
      <strong>${totalRuns}</strong>
      <span>Total runs</span>
    </div>
    <div class="stat-card">
      <strong>${passRate}%</strong>
      <span>Run pass rate</span>
    </div>
    <div class="stat-card">
      <strong>${totalBugs}</strong>
      <span>Bug reports</span>
    </div>
    <div class="stat-card">
      <strong>${queued + running + completed + failed}</strong>
      <span>Submissions</span>
    </div>
  `;
};

const renderRunList = () => {
  runList.innerHTML = '';
  if (state.runs.length === 0) {
    runList.innerHTML = '<div class="note">No test runs available.</div>';
    return;
  }

  state.runs.forEach(run => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${run.suiteDescription ?? run.suiteId ?? 'Untitled suite'}</h3>
      <div class="meta">
        <span>${formatDate(run.createdAt)}</span>
        <span>${Math.round(run.summary.durationMs / 1000)}s</span>
      </div>
    `;
    card.querySelector('.meta').appendChild(renderBadge(run.summary.status, 'status'));
    card.addEventListener('click', () => renderRunDetail(run));
    runList.appendChild(card);
  });
};

const renderBugList = () => {
  bugList.innerHTML = '';
  if (state.bugs.length === 0) {
    bugList.innerHTML = '<div class="note">No bug reports available.</div>';
    return;
  }

  state.bugs.forEach(bug => {
    const card = document.createElement('div');
    const severity = bug.report.severity ?? 'minor';
    const priority = bug.report.priority ?? 'p3';
    card.className = 'card';
    card.innerHTML = `
      <h3>${bug.report.title}</h3>
      <div class="meta">
        <span>${formatDate(bug.createdAt)}</span>
        <span>${bug.report.urls?.[0] ?? 'No URL'}</span>
      </div>
    `;
    card.querySelector('.meta').appendChild(renderBadge(severity, 'severity'));
    card.querySelector('.meta').appendChild(renderBadge(priority, 'priority'));
    card.addEventListener('click', () => renderBugDetail(bug));
    bugList.appendChild(card);
  });
};

const renderRunDetail = run => {
  detailPane.innerHTML = '';
  const wrapper = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'section';
  header.innerHTML = `
    <h2>Test Run Details</h2>
    <div class="key-value">
      <strong>Suite</strong><span>${run.suiteDescription ?? run.suiteId ?? 'Untitled suite'}</span>
      <strong>Status</strong><span>${run.summary.status}</span>
      <strong>Started</strong><span>${formatDate(run.summary.startedAt)}</span>
      <strong>Ended</strong><span>${formatDate(run.summary.endedAt)}</span>
      <strong>Duration</strong><span>${Math.round(run.summary.durationMs / 1000)}s</span>
      <strong>Browserbase</strong><span>${
        run.metadata?.browserbaseSessionUrl
          ? `<a href="${run.metadata.browserbaseSessionUrl}" target="_blank">View session</a>`
          : 'Not available'
      }</span>
    </div>
    <div class="actions">
      <a class="button primary" href="/api/test-runs/${run.id}/export?format=json">Export JSON</a>
      <a class="button" href="/api/test-runs/${run.id}/export?format=junit">Export JUnit</a>
    </div>
  `;

  const casesSection = document.createElement('div');
  casesSection.className = 'section';
  casesSection.innerHTML = '<h3>Test Case Steps</h3>';

  const stepsContainer = document.createElement('div');
  stepsContainer.className = 'steps';

  run.summary.testCaseResults.forEach(testCase => {
    const caseBlock = document.createElement('div');
    caseBlock.className = 'step';
    caseBlock.innerHTML = `
      <header>
        <h4>${testCase.description ?? testCase.testCaseId}</h4>
        <span class="badge ${testCase.status}">${testCase.status}</span>
      </header>
    `;

    const stepList = document.createElement('div');
    stepList.className = 'steps';

    testCase.steps.forEach(step => {
      const stepItem = document.createElement('div');
      stepItem.className = 'step';
      stepItem.innerHTML = `
        <header>
          <h4>${step.stepId}: ${step.description}</h4>
          <span class="badge ${step.status}">${step.status}</span>
        </header>
        <div class="note">Tool: ${step.tool} • ${Math.round(step.durationMs)}ms</div>
      `;

      if (step.error) {
        const errorBlock = document.createElement('pre');
        errorBlock.className = 'code-block';
        errorBlock.textContent = step.error;
        stepItem.appendChild(errorBlock);
      }

      if (step.output) {
        const outputBlock = document.createElement('pre');
        outputBlock.className = 'code-block';
        outputBlock.textContent = JSON.stringify(step.output, null, 2);
        stepItem.appendChild(outputBlock);
      }

      stepList.appendChild(stepItem);
    });

    caseBlock.appendChild(stepList);
    stepsContainer.appendChild(caseBlock);
  });

  casesSection.appendChild(stepsContainer);

  const evidenceSection = document.createElement('div');
  evidenceSection.className = 'section';
  evidenceSection.innerHTML = '<h3>Evidence</h3>';
  evidenceSection.appendChild(renderEvidenceList(run.summary.evidence));

  wrapper.appendChild(header);
  wrapper.appendChild(casesSection);
  wrapper.appendChild(evidenceSection);
  detailPane.appendChild(wrapper);
};

const renderBugDetail = bug => {
  detailPane.innerHTML = '';
  const wrapper = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'section';
  header.innerHTML = `
    <h2>Bug Report</h2>
    <div class="key-value">
      <strong>Title</strong><span>${bug.report.title}</span>
      <strong>Severity</strong><span>${bug.report.severity ?? 'N/A'}</span>
      <strong>Priority</strong><span>${bug.report.priority ?? 'N/A'}</span>
      <strong>Reproducibility</strong><span>${bug.report.reproducibility ?? 'N/A'}</span>
      <strong>Component</strong><span>${bug.report.component ?? 'N/A'}</span>
      <strong>Observed</strong><span>${formatDate(bug.report.timestamps.observedAt)}</span>
      <strong>Reported</strong><span>${formatDate(bug.report.timestamps.reportedAt)}</span>
    </div>
  `;

  const stepsSection = document.createElement('div');
  stepsSection.className = 'section';
  stepsSection.innerHTML = '<h3>Steps, Expected, Actual</h3>';

  const stepsList = document.createElement('ol');
  stepsList.className = 'steps';
  bug.report.steps.forEach(step => {
    const stepItem = document.createElement('li');
    stepItem.className = 'step';
    stepItem.textContent = step;
    stepsList.appendChild(stepItem);
  });

  const expectedBlock = document.createElement('div');
  expectedBlock.className = 'code-block';
  expectedBlock.textContent = `Expected: ${bug.report.expected}`;

  const actualBlock = document.createElement('div');
  actualBlock.className = 'code-block';
  actualBlock.textContent = `Actual: ${bug.report.actual}`;

  stepsSection.appendChild(stepsList);
  stepsSection.appendChild(expectedBlock);
  stepsSection.appendChild(actualBlock);

  const evidenceSection = document.createElement('div');
  evidenceSection.className = 'section';
  evidenceSection.innerHTML = '<h3>Evidence</h3>';
  evidenceSection.appendChild(renderBugEvidence(bug.report.evidence ?? []));

  const publishingSection = document.createElement('div');
  publishingSection.className = 'section';
  publishingSection.innerHTML = '<h3>Issue publishing</h3>';
  publishingSection.appendChild(renderPublishedIssues(bug.report.externalIssues ?? []));

  const publishActions = document.createElement('div');
  publishActions.className = 'actions';
  const githubButton = document.createElement('button');
  githubButton.className = 'button';
  githubButton.textContent = 'Publish to GitHub';
  githubButton.addEventListener('click', async () => {
    await publishIssue(bug.id, 'github');
  });
  const jiraButton = document.createElement('button');
  jiraButton.className = 'button';
  jiraButton.textContent = 'Publish to Jira';
  jiraButton.addEventListener('click', async () => {
    await publishIssue(bug.id, 'jira');
  });
  publishActions.appendChild(githubButton);
  publishActions.appendChild(jiraButton);
  publishingSection.appendChild(publishActions);

  const environmentSection = document.createElement('div');
  environmentSection.className = 'section';
  environmentSection.innerHTML = `
    <h3>Environment</h3>
    <div class="key-value">
      <strong>Name</strong><span>${bug.report.environment?.name ?? 'N/A'}</span>
      <strong>URL</strong><span>${bug.report.environment?.url ?? 'N/A'}</span>
      <strong>Locale</strong><span>${bug.report.environment?.locale ?? 'N/A'}</span>
      <strong>Timezone</strong><span>${bug.report.environment?.timezone ?? 'N/A'}</span>
    </div>
    <h4>Browser</h4>
    <div class="key-value">
      <strong>Name</strong><span>${bug.report.browser?.name ?? 'N/A'}</span>
      <strong>Version</strong><span>${bug.report.browser?.version ?? 'N/A'}</span>
      <strong>User Agent</strong><span>${bug.report.browser?.userAgent ?? 'N/A'}</span>
    </div>
    <h4>Device</h4>
    <div class="key-value">
      <strong>Type</strong><span>${bug.report.device?.type ?? 'N/A'}</span>
      <strong>Model</strong><span>${bug.report.device?.model ?? 'N/A'}</span>
      <strong>OS</strong><span>${bug.report.device?.os ?? 'N/A'}</span>
      <strong>OS Version</strong><span>${bug.report.device?.osVersion ?? 'N/A'}</span>
      <strong>Viewport</strong><span>${
        bug.report.device?.viewport ? `${bug.report.device.viewport.width}x${bug.report.device.viewport.height}` : 'N/A'
      }</span>
    </div>
  `;

  wrapper.appendChild(header);
  wrapper.appendChild(stepsSection);
  wrapper.appendChild(environmentSection);
  wrapper.appendChild(publishingSection);
  wrapper.appendChild(evidenceSection);
  detailPane.appendChild(wrapper);
};

const renderSubmissionDetail = submission => {
  detailPane.innerHTML = '';
  const wrapper = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'section';
  header.innerHTML = `
    <h2>Submission</h2>
    <div class="key-value">
      <strong>URL</strong><span>${submission.url}</span>
      <strong>Status</strong><span>${submission.status}</span>
      <strong>Created</strong><span>${formatDate(submission.createdAt)}</span>
      <strong>Updated</strong><span>${formatDate(submission.updatedAt)}</span>
      <strong>Run Status</strong><span>${submission.runStatus ?? 'Pending'}</span>
      <strong>Discovery</strong><span>${submission.discovery?.source ?? 'Pending'}</span>
      <strong>Pages</strong><span>${submission.targets?.length ?? 0}</span>
    </div>
  `;

  const actions = document.createElement('div');
  actions.className = 'actions';
  if (submission.runId) {
    const link = document.createElement('a');
    link.className = 'button primary';
    link.href = '#';
    link.textContent = 'View run details';
    link.addEventListener('click', event => {
      event.preventDefault();
      const run = state.runs.find(item => item.id === submission.runId);
      if (run) {
        renderRunDetail(run);
      }
    });
    actions.appendChild(link);
  }

  if (submission.status === 'failed') {
    const retryButton = document.createElement('button');
    retryButton.className = 'button';
    retryButton.textContent = 'Retry submission';
    retryButton.addEventListener('click', async () => {
      await postJson(`/api/submissions/${submission.id}/retry`, {});
      await loadSubmissions();
    });
    actions.appendChild(retryButton);
  }

  if (actions.children.length > 0) {
    header.appendChild(actions);
  }

  wrapper.appendChild(header);

  if (submission.targets?.length) {
    const targetSection = document.createElement('div');
    targetSection.className = 'section';
    targetSection.innerHTML = '<h3>Discovered pages</h3>';
    const list = document.createElement('ul');
    list.className = 'target-list';
    submission.targets.forEach(target => {
      const item = document.createElement('li');
      item.innerHTML = `<a href="${target}" target="_blank">${target}</a>`;
      list.appendChild(item);
    });
    targetSection.appendChild(list);
    wrapper.appendChild(targetSection);
  }

  if (submission.error) {
    const errorBlock = document.createElement('pre');
    errorBlock.className = 'code-block';
    errorBlock.textContent = submission.error;
    wrapper.appendChild(errorBlock);
  }
  detailPane.appendChild(wrapper);
};

const renderEvidenceList = evidenceRecords => {
  if (!evidenceRecords || evidenceRecords.length === 0) {
    return buildNote('No evidence captured for this run.');
  }

  const grid = document.createElement('div');
  grid.className = 'evidence-grid';

  evidenceRecords.forEach(record => {
    const card = document.createElement('div');
    card.className = 'evidence-item';

    const title = document.createElement('strong');
    title.textContent = `Ref ${record.ref}`;
    card.appendChild(title);

    const locations = Array.from(collectLocations(record.data));
    if (locations.length === 0) {
      card.appendChild(buildNote('No file or URL locations found.'));
    } else {
      locations.forEach(location => {
        const link = buildEvidenceLink(location);
        card.appendChild(link);
      });
    }

    if (record.data) {
      const payload = document.createElement('pre');
      payload.className = 'code-block';
      payload.textContent = JSON.stringify(record.data, null, 2);
      card.appendChild(payload);
    }

    grid.appendChild(card);
  });

  return grid;
};

const renderPublishedIssues = issues => {
  if (!issues || issues.length === 0) {
    return buildNote('No published issues yet.');
  }
  const list = document.createElement('ul');
  list.className = 'issue-list';
  issues.forEach(issue => {
    const item = document.createElement('li');
    item.innerHTML = `<strong>${issue.provider.toUpperCase()}</strong>: <a href="${issue.url}" target="_blank">${issue.url}</a>`;
    list.appendChild(item);
  });
  return list;
};

const publishIssue = async (bugId, provider) => {
  try {
    await postJson(`/api/bug-reports/${bugId}/publish`, { provider });
    await loadBugs();
  } catch (error) {
    console.error(error);
    alert('Failed to publish issue. Check configuration and try again.');
  }
};

const renderBugEvidence = artifacts => {
  if (artifacts.length === 0) {
    return buildNote('No evidence attached to this bug report.');
  }

  const grid = document.createElement('div');
  grid.className = 'evidence-grid';

  artifacts.forEach(artifact => {
    const card = document.createElement('div');
    card.className = 'evidence-item';
    card.innerHTML = `
      <strong>${artifact.type}</strong>
      <span class="note">${artifact.path}</span>
    `;

    if (artifact.type === 'screenshot') {
      const img = document.createElement('img');
      img.alt = artifact.path;
      img.src = buildEvidenceUrl(artifact.path);
      card.appendChild(img);
    }

    const link = document.createElement('a');
    link.className = 'button';
    link.href = buildEvidenceUrl(artifact.path);
    link.textContent = 'Open artifact';
    card.appendChild(link);

    grid.appendChild(card);
  });

  return grid;
};

const buildNote = text => {
  const note = document.createElement('div');
  note.className = 'note';
  note.textContent = text;
  return note;
};

const buildEvidenceUrl = pathValue => `/api/evidence?path=${encodeURIComponent(pathValue)}`;

const buildEvidenceLink = location => {
  const link = document.createElement('a');
  link.className = 'button';
  link.target = '_blank';

  if (location.startsWith('http')) {
    link.href = location;
    link.textContent = `Open ${location}`;
  } else if (location.startsWith('/')) {
    link.href = buildEvidenceUrl(location);
    link.textContent = 'Open file artifact';
  } else {
    link.href = buildEvidenceUrl(location);
    link.textContent = location;
  }

  return link;
};

const LOCATION_KEYS = new Set([
  'path',
  'url',
  'href',
  'link',
  'uri',
  'artifactPath',
  'screenshotPath',
  'logPath',
  'tracePath',
]);

const collectLocations = (data, depth = 0, locations = new Set()) => {
  if (depth > 3 || data === null || data === undefined) {
    return locations;
  }

  if (typeof data === 'string') {
    if (looksLikeLocation(data)) {
      locations.add(data);
    }
    return locations;
  }

  if (Array.isArray(data)) {
    data.forEach(item => collectLocations(item, depth + 1, locations));
    return locations;
  }

  if (typeof data === 'object') {
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string' && LOCATION_KEYS.has(key)) {
        locations.add(value);
      }
      collectLocations(value, depth + 1, locations);
    });
  }

  return locations;
};

const looksLikeLocation = value =>
  value.startsWith('http://') ||
  value.startsWith('https://') ||
  value.startsWith('file://') ||
  value.startsWith('/') ||
  value.includes('\\');

statusFilter.addEventListener('change', () => {
  loadRuns().catch(console.error);
});

severityFilter.addEventListener('change', () => {
  loadBugs().catch(console.error);
});

submissionForm.addEventListener('submit', async event => {
  event.preventDefault();
  const urlValue = submissionUrl.value.trim();
  if (!urlValue) {
    return;
  }
  try {
    await postJson('/api/submissions', { url: urlValue });
    submissionUrl.value = '';
    await loadSubmissions();
  } catch (error) {
    console.error(error);
    alert('Failed to queue submission. Please check the URL and try again.');
  }
});

const init = () => {
  Promise.all([loadRuns(), loadBugs(), loadSubmissions()]).catch(console.error);
};

init();

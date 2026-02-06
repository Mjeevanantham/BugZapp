const statusFilter = document.getElementById('statusFilter');
const severityFilter = document.getElementById('severityFilter');
const runList = document.getElementById('runList');
const bugList = document.getElementById('bugList');
const detailPane = document.getElementById('detailPane');

const state = {
  runs: [],
  bugs: [],
};

const fetchJson = async url => {
  const response = await fetch(url);
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
  }
  return badge;
};

const loadRuns = async () => {
  const status = statusFilter.value;
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  state.runs = await fetchJson(`/api/test-runs${query}`);
  renderRunList();
};

const loadBugs = async () => {
  const severity = severityFilter.value;
  const query = severity ? `?severity=${encodeURIComponent(severity)}` : '';
  state.bugs = await fetchJson(`/api/bug-reports${query}`);
  renderBugList();
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
    card.className = 'card';
    card.innerHTML = `
      <h3>${bug.report.title}</h3>
      <div class="meta">
        <span>${formatDate(bug.createdAt)}</span>
        <span>${bug.report.urls?.[0] ?? 'No URL'}</span>
      </div>
    `;
    card.querySelector('.meta').appendChild(renderBadge(bug.report.severity, 'severity'));
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
      <strong>Severity</strong><span>${bug.report.severity}</span>
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

  wrapper.appendChild(header);
  wrapper.appendChild(stepsSection);
  wrapper.appendChild(evidenceSection);
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

const init = () => {
  Promise.all([loadRuns(), loadBugs()]).catch(console.error);
};

init();

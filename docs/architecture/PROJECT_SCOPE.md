# 📋 BugZapp Project Scope & Architecture

## 🎯 Project Overview

**BugZapp** is an **AI-assisted QA automation platform** that combines:
- **Browserbase's Stagehand** - Cloud browser automation
- **Mastra Framework** - AI agent orchestration
- **QA Testing Infrastructure** - Bug discovery, evidence capture, and reporting

---

## 🏗️ Core Architecture

### **System Flow**
```
User Query → Mastra Agent → Stagehand Tools → Browser Interaction 
    ↓
Evidence Capture → QA Storage → Bug Reports
    ↓
(Optional) Issue Publishing → GitHub/Jira
    ↓
QA Dashboard → Review & Export
```

---

## 🎯 Primary Use Cases

### **1. AI-Powered Web Testing**
- AI agent navigates and interacts with websites
- Performs actions like clicking, typing, form filling
- Extracts structured data from pages
- Observes and validates UI elements

### **2. Automated QA & Bug Discovery**
- Runs assertions on web pages
- Automatically captures evidence when tests fail
- Stores comprehensive bug reports
- Links bugs to external trackers (GitHub/Jira)

### **3. Test Suite Management**
- Define test suites with multiple test cases
- Each test case has multiple steps
- Sequential execution with failure handling
- Evidence collection at each step

### **4. QA Dashboard & Reporting**
- Review test runs and results
- Browse bug reports with evidence
- Export reports in various formats
- Publish bugs to external systems

---

## 🔧 Core Components

### **1. Stagehand Session Manager**
**Location**: `src/mastra/lib/stagehand-session.ts`

**Purpose**: Manages cloud browser sessions via Browserbase

**Features**:
- Browser session initialization
- Automatic session timeouts
- Error recovery and reconnection
- Session cleanup

**Key Capabilities**:
- Runs browsers in the cloud (no local browser needed)
- Records full video of every session
- Captures screenshots and logs
- Provides stable, scalable environment

---

### **2. Mastra Tools** (6 Tools)

**Location**: `src/mastra/tools/`

#### **a) pageNavigateTool**
- Navigate to URLs
- Handle page loads
- Manage navigation state

#### **b) pageObserveTool**
- Find elements on pages
- Inspect DOM structure
- Locate interactive elements

#### **c) pageActTool**
- Click buttons
- Fill forms
- Type text
- Perform interactions

#### **d) pageExtractTool**
- Extract structured data
- Parse page content
- Collect information

#### **e) qaAssertTool**
- Run assertions
- Validate expectations
- Capture evidence on failure
- Create bug reports

#### **f) qaRunTool**
- Execute test suites
- Run test cases
- Manage test execution
- Collect results

---

### **3. QA Testing Infrastructure**

**Location**: `src/mastra/qa/`

#### **a) Test Runner** (`test-runner.ts`)
**Purpose**: Orchestrates test execution

**Features**:
- Test suite registration
- Test case execution
- Step-by-step execution
- Evidence collection
- Result aggregation

**Flow**:
```
Test Suite → Test Cases → Test Steps → Tool Execution → Results
```

**Status Types**:
- `pass` - Test passed
- `fail` - Test failed
- `blocked` - Test blocked by previous failure

#### **b) Test Case Definition** (`test-case.ts`)
**Purpose**: Define test structure

**Structure**:
```typescript
TestSuite {
  id: string
  description: string
  testCases: TestCase[]
}

TestCase {
  id: string
  description: string
  steps: TestStep[]
}

TestStep {
  id: string
  description: string
  tool: 'web-navigate' | 'web-observe' | 'web-act' | 'web-extract'
  input: Record<string, unknown>
}
```

#### **c) Bug Report System** (`bug-report.ts`)
**Purpose**: Structure and store bug information

**Bug Report Structure**:
```typescript
{
  id: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  evidence: {
    screenshots: string[]
    htmlSnapshots: string[]
    consoleLogs: string[]
    networkErrors: string[]
  }
  metadata: {
    url: string
    timestamp: string
    userAgent: string
    tags: string[]
  }
  externalIssues: {
    github?: { issueNumber: number, url: string }
    jira?: { issueKey: string, url: string }
  }
}
```

#### **d) Triage System** (`triage.ts`)
**Purpose**: Categorize and prioritize bugs

**Features**:
- Automatic severity assessment
- Bug categorization
- Priority assignment
- Deduplication logic

---

### **4. QA Storage Layer**

**Location**: `src/mastra/qa/storage/`

#### **a) Storage Interface** (`storage.ts`)
**Purpose**: Abstract storage operations

**Operations**:
- `saveBugReport(report)` - Store bug reports
- `saveTestRun(run)` - Store test runs
- `getBugReport(id)` - Retrieve bug report
- `listBugReports()` - List all reports
- `listTestRuns()` - List all test runs
- `updateBugReport(id, updates)` - Update report

#### **b) Local JSON Storage** (`local-json-storage.ts`)
**Purpose**: File-based storage

**Features**:
- Stores bug reports as JSON files
- Stores test runs as JSON files
- Stores evidence (screenshots, HTML, logs)
- Simple file-based organization

**Directory Structure**:
```
./qa-storage/
  ├── bug-reports/
  │   ├── bug-001.json
  │   └── bug-002.json
  ├── test-runs/
  │   ├── run-001.json
  │   └── run-002.json
  └── evidence/
      ├── screenshot-001.png
      ├── page-001.html
      └── console-001.log
```

#### **c) SQLite Storage** (`sqlite-storage.ts`)
**Purpose**: Database-based storage

**Features**:
- Stores bug reports in SQLite
- Stores test runs in SQLite
- Queryable data
- Better for large datasets

**Tables**:
- `bug_reports` - Bug report data
- `test_runs` - Test run data
- `evidence` - Evidence metadata

---

### **5. Reporting System**

**Location**: `src/mastra/qa/reporting/`

#### **a) Report Writer** (`report-writer.ts`)
**Purpose**: Generate human-readable reports

**Formats**:
- HTML reports
- Markdown reports
- JSON exports
- CSV exports

#### **b) JUnit Writer** (`junit-writer.ts`)
**Purpose**: Generate JUnit XML reports

**Features**:
- CI/CD integration
- Standard test result format
- Compatible with Jenkins, GitLab CI, etc.

---

### **6. Issue Publishing Integrations**

**Location**: `src/mastra/qa/` (integrated in tools)

#### **a) GitHub Issues**
**Purpose**: Publish bugs to GitHub

**Features**:
- Create GitHub issues from bug reports
- Link issue URL back to bug report
- Update issue status
- Add labels and assignees

**Configuration**:
```env
QA_GITHUB_TOKEN=your_token
QA_GITHUB_REPO=owner/repo
QA_GITHUB_API_URL=https://api.github.com
```

#### **b) Jira Integration**
**Purpose**: Publish bugs to Jira

**Features**:
- Create Jira tickets from bug reports
- Link ticket key back to bug report
- Update ticket status
- Set priority and assignee

**Configuration**:
```env
QA_JIRA_BASE_URL=https://your-domain.atlassian.net
QA_JIRA_EMAIL=you@example.com
QA_JIRA_API_TOKEN=your_token
QA_JIRA_PROJECT_KEY=PROJ
QA_JIRA_ISSUE_TYPE=Bug
```

---

### **7. QA Dashboard UI**

**Location**: `src/ui/`

#### **Server** (`server.ts`)
**Purpose**: Serve QA dashboard

**Features**:
- Lists test runs
- Displays bug reports
- Shows evidence artifacts
- Export functionality
- Publishing interface

**Endpoints**:
- `/api/test-runs` - List test runs
- `/api/bug-reports` - List bug reports
- `/api/evidence/:id` - Get evidence
- `/api/export` - Export reports
- `/api/publish` - Publish to GitHub/Jira

#### **Public Assets** (`public/`)
**Purpose**: Static UI files

**Contents**:
- HTML templates
- CSS stylesheets
- JavaScript for interactivity
- Evidence files (screenshots, HTML snapshots)

---

### **8. Mastra Agent**

**Location**: `src/mastra/agents/web-agent.ts`

**Purpose**: AI agent that orchestrates testing

**Capabilities**:
- Natural language understanding
- Tool selection and execution
- Context management
- Memory and conversation history

**Instructions**:
```
You are a helpful web assistant that can navigate websites 
and extract information.

Your primary functions are:
- Navigate to websites
- Observe elements on webpages
- Perform actions like clicking buttons or filling forms
- Extract data from webpages

Use the pageActTool to perform actions on webpages.
Use the pageObserveTool to find elements on webpages.
Use the pageExtractTool to extract data from webpages.
Use the pageNavigateTool to navigate to a URL.
Use the qaAssertTool to validate expectations and capture 
bug reports when checks fail.
```

---

## 🎯 Key Features

### **1. Evidence Capture**
When tests fail, BugZapp automatically captures:
- 📸 **Screenshots** - Visual evidence of the issue
- 📄 **HTML Snapshots** - Full page HTML at failure point
- 📝 **Console Logs** - JavaScript errors and warnings
- 🌐 **Network Errors** - Failed requests and responses
- ⏱️ **Timing Data** - Performance metrics
- 🔍 **DOM State** - Element states and attributes

### **2. Test Suite Management**
- **Register Test Suites** - Define reusable test suites
- **Run Test Cases** - Execute individual or multiple test cases
- **Sequential Execution** - Steps run in order
- **Failure Handling** - Subsequent steps blocked on failure
- **Evidence Collection** - Automatic evidence gathering

### **3. Bug Report Workflow**
```
Test Failure → Evidence Capture → Bug Report Creation 
    → Storage (JSON/SQLite) → (Optional) Publish to GitHub/Jira
    → Dashboard Review → Export/Share
```

### **4. Flexible Storage**
- **JSON Storage** - Simple file-based storage
- **SQLite Storage** - Database for complex queries
- **Configurable** - Switch via environment variable

### **5. External Integration**
- **GitHub Issues** - Automatic issue creation
- **Jira Tickets** - Automatic ticket creation
- **Bidirectional Linking** - Link external issues back to reports

### **6. Analytics (Optional)**
- **PostHog Integration** - Track dashboard usage
- **User Analytics** - Understand QA workflow
- **Privacy-Focused** - Optional feature

---

## 🔄 Complete Workflow Example

### **Scenario: Testing a Login Flow**

#### **Step 1: Define Test Suite**
```typescript
const loginTestSuite = {
  id: 'login-flow-test',
  description: 'Test user login functionality',
  testCases: [
    {
      id: 'valid-login',
      description: 'User can login with valid credentials',
      steps: [
        {
          id: 'navigate-to-login',
          description: 'Navigate to login page',
          tool: 'web-navigate',
          input: { url: 'https://example.com/login' }
        },
        {
          id: 'fill-email',
          description: 'Fill email field',
          tool: 'web-act',
          input: { action: 'type', selector: '#email', text: 'user@example.com' }
        },
        {
          id: 'fill-password',
          description: 'Fill password field',
          tool: 'web-act',
          input: { action: 'type', selector: '#password', text: 'password123' }
        },
        {
          id: 'click-login',
          description: 'Click login button',
          tool: 'web-act',
          input: { action: 'click', selector: '#login-btn' }
        },
        {
          id: 'verify-dashboard',
          description: 'Verify redirect to dashboard',
          tool: 'web-observe',
          input: { selector: '#dashboard', assertion: 'exists' }
        }
      ]
    }
  ]
};
```

#### **Step 2: Register and Run**
```typescript
registerTestSuite(loginTestSuite);
const results = await runTestSuite({ suiteId: 'login-flow-test' });
```

#### **Step 3: Results**
- If all steps pass: `status: 'pass'`
- If any step fails:
  - `status: 'fail'`
  - Evidence captured (screenshot, HTML, logs)
  - Bug report created
  - Subsequent steps marked as `'blocked'`

#### **Step 4: Review**
- View results in QA Dashboard
- See evidence artifacts
- Export report
- Publish to GitHub/Jira

---

## 📊 Data Models

### **Test Run**
```typescript
{
  id: string
  suiteId?: string
  suiteDescription?: string
  status: 'pass' | 'fail' | 'blocked'
  durationMs: number
  startedAt: string
  endedAt: string
  testCaseResults: TestCaseResult[]
  evidence: EvidenceRecord[]
  evidenceRefs: string[]
  metadata?: {
    tags?: string[]
    url?: string
  }
}
```

### **Bug Report**
```typescript
{
  id: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  createdAt: string
  updatedAt: string
  evidence: {
    screenshots: string[]
    htmlSnapshots: string[]
    consoleLogs: string[]
    networkErrors: string[]
  }
  testRunId?: string
  testCaseId?: string
  stepId?: string
  metadata: {
    url: string
    userAgent: string
    tags: string[]
  }
  externalIssues?: {
    github?: { issueNumber: number, url: string }
    jira?: { issueKey: string, url: string }
  }
}
```

---

## 🎯 Project Scope Summary

### **What BugZapp IS:**
✅ AI-powered QA automation platform
✅ Browser automation via Stagehand/Browserbase
✅ Test suite management system
✅ Bug discovery and reporting tool
✅ Evidence capture system
✅ Integration with GitHub/Jira
✅ QA dashboard for review and export

### **What BugZapp is NOT:**
❌ Unit testing framework (like Jest/Mocha)
❌ Load testing tool
❌ Security testing platform
❌ API testing tool (focused on web UI)
❌ Manual testing replacement (AI-assisted, not fully autonomous)

---

## 🚀 Current Capabilities

### **✅ Implemented**
- Web navigation and interaction
- Element observation and extraction
- QA assertions with evidence capture
- Bug report storage (JSON/SQLite)
- Test suite execution
- GitHub/Jira integration
- QA dashboard UI
- Browserbase session recording
- JUnit report generation

### **🔄 Extensible**
- Custom test suites
- Custom evidence types
- Custom storage backends
- Custom report formats
- Custom integrations

---

## 📚 Technology Stack

### **Core**
- **TypeScript** - Type-safe development
- **Node.js 22+** - Runtime environment
- **Mastra** - AI agent framework
- **Stagehand** - Browser automation
- **Browserbase** - Cloud browser infrastructure

### **Storage**
- **JSON** - File-based storage
- **SQLite** - Database storage
- **Zod** - Schema validation

### **Integrations**
- **GitHub API** - Issue publishing
- **Jira REST API** - Ticket publishing
- **PostHog** - Analytics (optional)

### **AI Models** (via Mastra)
- OpenAI (GPT-4o, GPT-4o-mini)
- Anthropic (Claude Sonnet, Haiku)
- Google (Gemini)
- Groq (Llama)
- Cerebras
- Mistral

---

## 🎯 Use Case Summary

**BugZapp is designed for:**
1. **QA Engineers** - Automate repetitive testing tasks
2. **Development Teams** - Continuous QA in CI/CD
3. **Product Teams** - Validate user flows
4. **Agencies** - Test client websites
5. **Solo Developers** - Comprehensive website testing

**Best suited for:**
- E-commerce checkout flows
- User registration/login flows
- Form submissions
- Navigation testing
- UI consistency checks
- Accessibility audits
- Responsive design validation

---

**🎯 This is the complete scope of BugZapp!**

It's an **AI-assisted QA automation platform** that combines browser automation, AI agents, and comprehensive bug reporting to help teams discover, document, and fix bugs efficiently.

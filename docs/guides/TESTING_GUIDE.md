# BugZapp Testing Guide

## 🎯 Application Overview

**BugZapp** is an AI-assisted QA automation platform that combines:
- **Browserbase's Stagehand** for browser automation
- **Mastra Framework** for AI agent orchestration
- **QA Tools** for bug discovery, evidence capture, and issue tracking

## 🌐 Access Points

Your application is currently running at:
- **Mastra Studio Dashboard**: http://localhost:4111
- **API Endpoint**: http://localhost:4111/api
- **Swagger Documentation**: http://localhost:4111/swagger-ui

## 📋 Main Use Cases

### 1. **Web Navigation & Interaction**
The primary use case is to use an AI agent to:
- Navigate to websites
- Observe and identify elements on web pages
- Perform actions (clicking, form filling, etc.)
- Extract structured data from pages

### 2. **QA Automation & Bug Discovery**
- Run automated assertions on web pages
- Capture evidence when tests fail (screenshots, HTML, logs)
- Store bug reports in local storage (JSON or SQLite)
- Optionally publish bugs to GitHub Issues or Jira

## 🧪 Testing Workflow

### **Step 1: Access the Mastra Studio**
1. Open your browser
2. Navigate to: **http://localhost:4111**
3. You should see the Mastra Studio interface

### **Step 2: Test the Web Agent**
The application has a `webAgent` with the following tools:

| Tool | Purpose |
|------|---------|
| `pageNavigateTool` | Navigate to a URL |
| `pageObserveTool` | Find elements on a webpage |
| `pageActTool` | Perform actions (click, type, etc.) |
| `pageExtractTool` | Extract structured data |
| `qaAssertTool` | Run assertions and capture bugs |
| `qaRunTool` | Execute QA test runs |

### **Step 3: Example Test Scenarios**

#### **Scenario A: Simple Navigation & Extraction**
**Goal**: Navigate to a website and extract information

**Test Steps**:
1. In Mastra Studio, select the `webAgent`
2. Send a message: "Navigate to https://example.com and extract the main heading"
3. The agent should:
   - Use `pageNavigateTool` to navigate
   - Use `pageObserveTool` to find the heading
   - Use `pageExtractTool` to extract the text
   - Return the heading text

**Expected Result**: Agent returns "Example Domain" or similar heading

#### **Scenario B: Form Interaction**
**Goal**: Test form filling and submission

**Test Steps**:
1. Send: "Go to https://www.google.com and search for 'Mastra AI'"
2. The agent should:
   - Navigate to Google
   - Observe the search input field
   - Use `pageActTool` to type the query
   - Click the search button
   - Extract search results

**Expected Result**: Agent successfully performs the search and returns results

#### **Scenario C: QA Assertion Testing**
**Goal**: Test the QA assertion and bug capture functionality

**Test Steps**:
1. Send: "Navigate to https://example.com and assert that the page title is 'Example Domain'"
2. The agent should:
   - Navigate to the page
   - Use `qaAssertTool` to check the title
   - If assertion passes: report success
   - If assertion fails: capture evidence and create a bug report

**Expected Result**: 
- Assertion passes (or fails if title doesn't match)
- If failed, check `./qa-storage` directory for bug report

### **Step 4: Verify QA Storage**

After running QA assertions, check the storage:

```bash
# Check if qa-storage directory was created
ls -la ./qa-storage

# View bug reports (if any)
cat ./qa-storage/bug-reports/*.json

# View test runs
cat ./qa-storage/test-runs/*.json
```

### **Step 5: API Testing**

You can also test via API calls:

```bash
# List all agents
curl http://localhost:4111/api/agents

# Get webAgent details
curl http://localhost:4111/api/agents/web-agent

# Execute a tool directly
curl -X POST http://localhost:4111/api/tools/pageNavigateTool/execute \
  -H "Content-Type: application/json" \
  -d '{"data": {"url": "https://example.com"}}'
```

## 🔍 What to Check

### **✅ Success Indicators**

1. **Agent Responds**: The webAgent successfully processes your requests
2. **Browser Automation Works**: Stagehand successfully controls the browser
3. **Tools Execute**: All page tools (navigate, observe, act, extract) work
4. **QA Assertions Run**: qaAssertTool captures evidence on failures
5. **Storage Created**: `./qa-storage` directory is created with reports
6. **No Errors**: No errors in terminal or browser console

### **❌ Common Issues**

1. **Browserbase Connection Errors**
   - Check `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID` in `.env`
   - Verify Browserbase account is active

2. **OpenAI API Errors**
   - Check `OPENAI_API_KEY` in `.env`
   - Verify API key is valid and has credits

3. **Storage Errors**
   - Check write permissions for `./qa-storage` directory
   - Verify `QA_STORAGE_TYPE` is set correctly

4. **Tool Execution Failures**
   - Check terminal logs for detailed error messages
   - Verify the target website is accessible

## 📊 Monitoring & Logs

### **Terminal Logs**
Watch your terminal where `pnpm run dev` is running for:
- Agent execution logs
- Tool calls
- Browser automation events
- Error messages

### **Browser Console**
Press F12 in your browser and check:
- **Console tab**: JavaScript errors
- **Network tab**: API calls to Mastra
- **Application tab**: Local storage/cookies

### **Mastra Studio**
The Studio interface provides:
- Agent execution history
- Tool call logs
- Memory/thread management
- Workflow visualization

## 🚀 Advanced Testing

### **Test with GitHub Integration**
If you want to test bug publishing to GitHub:

1. Add to `.env`:
```env
QA_GITHUB_TOKEN=your_github_token
QA_GITHUB_REPO=your_org/your_repo
QA_GITHUB_API_URL=https://api.github.com
```

2. Run a failing assertion
3. Use `qaPublishIssueTool` to publish the bug to GitHub

### **Test with Jira Integration**
For Jira integration:

1. Add to `.env`:
```env
QA_JIRA_BASE_URL=https://your-domain.atlassian.net
QA_JIRA_EMAIL=you@example.com
QA_JIRA_API_TOKEN=your_jira_token
QA_JIRA_PROJECT_KEY=PROJ
QA_JIRA_ISSUE_TYPE=Bug
```

2. Run a failing assertion
3. Publish the bug to Jira

## 📝 Sample Test Script

Here's a complete test you can run:

```javascript
// Test 1: Basic Navigation
"Navigate to https://www.wikipedia.org"

// Test 2: Element Observation
"Find the search box on Wikipedia"

// Test 3: Data Extraction
"Extract the main heading from the Wikipedia homepage"

// Test 4: Action Execution
"Search for 'Artificial Intelligence' on Wikipedia"

// Test 5: QA Assertion (should pass)
"Navigate to https://example.com and assert that the page contains the text 'Example Domain'"

// Test 6: QA Assertion (should fail - to test bug capture)
"Navigate to https://example.com and assert that the page title is 'Wrong Title'"
```

## 🎓 Tips for Effective Testing

1. **Start Simple**: Begin with basic navigation before complex interactions
2. **Be Specific**: Provide clear URLs and specific element descriptions
3. **Check Logs**: Always monitor terminal output for errors
4. **Verify Storage**: After QA tests, check the `./qa-storage` directory
5. **Test Incrementally**: Test one feature at a time
6. **Use Assertions**: Use `qaAssertTool` to validate expected behavior

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Agent doesn't respond | Check OpenAI API key and credits |
| Browser automation fails | Verify Browserbase credentials |
| No bug reports created | Check `QA_STORAGE_DIR` permissions |
| Tool execution errors | Check terminal logs for details |
| Slow responses | Normal for AI agents, wait patiently |

## 📚 Additional Resources

- **Mastra Documentation**: https://mastra.ai/docs
- **Stagehand Documentation**: https://stagehand.dev
- **Browserbase**: https://browserbase.com
- **OpenAPI Spec**: http://localhost:4111/api/openapi.json

---

**Happy Testing! 🎉**

For questions or issues, check the terminal logs and browser console first.

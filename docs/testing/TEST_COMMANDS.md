# BugZapp Quick Test Script

This script tests the main functionality of BugZapp.

## Prerequisites

Make sure the application is running:
```bash
pnpm run dev
```

## Run Tests

### Option 1: Using Node.js
```bash
node test-bugzapp.js
```

### Option 2: Using curl (manual testing)

**Test 1: Check if agent is available**
```bash
curl http://localhost:4111/api/agents/web-agent | python -m json.tool
```

**Test 2: Navigate to a website**
```bash
curl -X POST http://localhost:4111/api/agents/web-agent/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Navigate to https://example.com"
      }
    ]
  }' | python -m json.tool
```

**Test 3: Extract data from a page**
```bash
curl -X POST http://localhost:4111/api/agents/web-agent/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Navigate to https://example.com and extract the main heading"
      }
    ]
  }' | python -m json.tool
```

**Test 4: Run QA assertion**
```bash
curl -X POST http://localhost:4111/api/agents/web-agent/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Navigate to https://example.com and assert that the page title contains Example"
      }
    ]
  }' | python -m json.tool
```

## Check Results

After running tests, check the QA storage:
```bash
# List all files in qa-storage
ls -la ./qa-storage

# View bug reports (if any)
cat ./qa-storage/bug-reports/*.json

# View test runs
cat ./qa-storage/test-runs/*.json
```

## What to Expect

1. **Successful Navigation**: Agent navigates to the URL using Browserbase
2. **Data Extraction**: Agent extracts requested information
3. **QA Assertions**: Agent validates conditions and captures evidence
4. **Bug Reports**: Failed assertions create bug reports in `./qa-storage`

## Troubleshooting

- **Connection refused**: Make sure `pnpm run dev` is running
- **API key errors**: Check your `.env` file for valid API keys
- **Slow responses**: AI agents take time to process, be patient
- **Browser errors**: Verify Browserbase credentials

## Next Steps

1. Open http://localhost:4111 in your browser
2. Explore the Mastra Studio interface
3. Try the interactive agent chat
4. Review the TESTING_GUIDE.md for detailed testing scenarios

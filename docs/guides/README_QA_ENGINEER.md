# 🎯 BugZapp - AI QA Engineer Quick Start

## What is BugZapp?

BugZapp is an **AI-powered QA Engineer** that comprehensively tests websites by:
- 🔍 Analyzing UI/UX consistency
- ✅ Validating functionality and flows
- 🐛 Discovering and documenting bugs
- 📸 Capturing evidence (screenshots, logs)
- 📝 Generating detailed bug reports

---

## 🚀 Quick Start (3 Steps)

### **Step 1: Start the Server**
```bash
pnpm run dev
```

### **Step 2: Run Comprehensive QA Test**
```bash
# Test any website
node comprehensive-qa-test.js https://yourwebsite.com

# Or test example.com
node comprehensive-qa-test.js https://example.com
```

### **Step 3: Review Results**
- Check terminal output for test results
- Review `./qa-storage/bug-reports/` for detailed bug reports
- Open http://localhost:4111 for interactive testing

---

## 💡 How to Use as AI QA Engineer

### **Option 1: Automated Comprehensive Testing**

Run the full test suite on any website:

```bash
node comprehensive-qa-test.js https://yoursite.com
```

This runs 8 comprehensive test phases:
1. ✅ Initial Discovery & Homepage Analysis
2. ✅ UI Element Validation
3. ✅ Navigation & Link Testing
4. ✅ Content Quality Check
5. ✅ Interactive Elements Testing
6. ✅ Basic Accessibility Audit
7. ✅ Responsive Design Elements
8. ✅ Performance & Load Check

### **Option 2: Interactive Testing via Mastra Studio**

1. Open http://localhost:4111
2. Select **webAgent**
3. Give comprehensive testing instructions:

```
Act as a QA engineer and comprehensively test https://yourwebsite.com

Test the following:
1. Homepage layout and structure
2. Navigation functionality
3. All forms and interactive elements
4. User flows (signup, login, checkout, etc.)
5. UI consistency across pages
6. Accessibility features
7. Responsive design elements

For each issue found:
- Capture evidence
- Create a detailed bug report
- Suggest fixes

Provide a comprehensive QA report at the end.
```

### **Option 3: Custom Test Scripts**

Create your own test scripts using the API:

```javascript
const testPrompt = `
  Test the e-commerce checkout flow on https://mystore.com:
  1. Add product to cart
  2. Navigate to cart
  3. Proceed to checkout
  4. Fill shipping info
  5. Verify order summary
  6. Assert all steps work correctly
  Capture bugs with evidence.
`;

// Run via API
await fetch('http://localhost:4111/api/agents/web-agent/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: testPrompt }]
  })
});
```

---

## 📋 Common QA Test Patterns

### **Pattern 1: Full Website Audit**
```
Perform a comprehensive QA audit of https://yoursite.com:
- Test all pages (home, about, contact, products)
- Verify navigation consistency
- Check all forms and buttons
- Test user flows
- Validate content quality
- Check accessibility
- Report all bugs with evidence
```

### **Pattern 2: User Flow Testing**
```
Test the complete user signup flow on https://yoursite.com:
1. Navigate to signup page
2. Fill in all required fields
3. Submit the form
4. Verify success message
5. Check if user is logged in
6. Assert email confirmation is sent
Report any issues found.
```

### **Pattern 3: UI Consistency Check**
```
Check UI consistency across https://yoursite.com:
1. Verify header is identical on all pages
2. Check footer consistency
3. Validate color scheme usage
4. Verify button styles are consistent
5. Check typography consistency
6. Assert spacing and alignment
Report any inconsistencies.
```

### **Pattern 4: Form Validation Testing**
```
Test all forms on https://yoursite.com:
1. Test with empty fields
2. Test with invalid data
3. Test with valid data
4. Verify error messages
5. Check success messages
6. Assert form submission works
Report validation issues.
```

### **Pattern 5: Accessibility Audit**
```
Perform accessibility audit on https://yoursite.com:
1. Check alt text on images
2. Verify heading hierarchy
3. Test keyboard navigation
4. Check form label associations
5. Verify color contrast
6. Assert ARIA attributes
Report accessibility violations.
```

---

## 🎯 Real-World Examples

### **Example 1: E-Commerce Site**
```bash
node comprehensive-qa-test.js https://mystore.com
```

Or via Mastra Studio:
```
Test my e-commerce site https://mystore.com as a QA engineer:
- Homepage product display
- Product search and filtering
- Product detail pages
- Add to cart functionality
- Shopping cart operations
- Checkout process
- Payment form validation
- Order confirmation
Test everything and report bugs.
```

### **Example 2: SaaS Dashboard**
```
QA test the SaaS dashboard at https://app.myservice.com:
- Login flow
- Dashboard widgets and charts
- Settings page
- User profile management
- Data CRUD operations
- Export/import features
- Notification system
- Help/support integration
Comprehensive test with bug reports.
```

### **Example 3: Blog/Content Site**
```
Test the blog at https://myblog.com:
- Homepage post listing
- Individual blog post pages
- Category/tag filtering
- Search functionality
- Comment system
- Author pages
- Archive pages
- RSS feed
Full QA with evidence capture.
```

---

## 📊 Understanding Test Results

### **Terminal Output**
The test script shows:
- ✅ Passed tests (green checkmarks)
- ❌ Failed tests (red X marks)
- 📊 Summary statistics
- 📝 Detailed findings

### **Bug Reports**
Check `./qa-storage/bug-reports/` for:
- Detailed bug descriptions
- Evidence (screenshots, HTML)
- Steps to reproduce
- Expected vs actual behavior
- Severity and priority

### **Test Runs**
Check `./qa-storage/test-runs/` for:
- Complete test execution logs
- Timestamp information
- Test coverage metrics
- Overall pass/fail status

---

## 🔧 Available Tools

The AI QA Engineer has access to:

| Tool | Purpose |
|------|---------|
| `pageNavigateTool` | Navigate to any URL |
| `pageObserveTool` | Find and inspect elements |
| `pageActTool` | Click, type, interact |
| `pageExtractTool` | Extract data/content |
| `qaAssertTool` | Run assertions & capture bugs |
| `qaRunTool` | Execute test runs |

---

## 📚 Documentation Files

- **AI_QA_ENGINEER_GUIDE.md** - Comprehensive guide with patterns and examples
- **TESTING_GUIDE.md** - Detailed testing scenarios
- **HOW_TO_TEST.md** - Quick start and basic testing
- **TEST_COMMANDS.md** - curl command reference
- **comprehensive-qa-test.js** - Automated test script
- **test-bugzapp.js** - Basic functionality test

---

## 💡 Pro Tips

1. **Start with automated tests** - Run `comprehensive-qa-test.js` first
2. **Be specific** - Give detailed testing instructions
3. **Test incrementally** - Test one flow at a time for complex sites
4. **Use assertions** - Always use qaAssertTool for validation
5. **Review bug reports** - Check `./qa-storage` after each test
6. **Iterate** - Refine tests based on findings

---

## 🎓 Example Complete Test Session

```bash
# 1. Start the server
pnpm run dev

# 2. Run comprehensive automated test
node comprehensive-qa-test.js https://yoursite.com

# 3. Review results in terminal

# 4. Check bug reports
ls -la ./qa-storage/bug-reports/
cat ./qa-storage/bug-reports/*.json

# 5. Run interactive tests
# Open http://localhost:4111
# Use Mastra Studio for custom tests

# 6. Generate final QA report
# Compile findings from all tests
```

---

## 🆘 Troubleshooting

**Q: Tests are slow**
- A: AI processing takes time (10-30s per test). This is normal.

**Q: No bug reports generated**
- A: Bug reports are only created when assertions fail. Check `QA_STORAGE_TYPE` in `.env`.

**Q: Server not responding**
- A: Make sure `pnpm run dev` is running in another terminal.

**Q: Browserbase errors**
- A: Verify `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID` in `.env`.

---

## 🎯 Next Steps

1. ✅ Run `node comprehensive-qa-test.js https://example.com`
2. ✅ Review the test results
3. ✅ Check `./qa-storage` for bug reports
4. ✅ Open http://localhost:4111 for interactive testing
5. ✅ Read `AI_QA_ENGINEER_GUIDE.md` for advanced patterns

---

**🤖 Your AI QA Engineer is ready to test any website comprehensively!**

Start testing now: `node comprehensive-qa-test.js https://yoursite.com` 🚀

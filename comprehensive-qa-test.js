/**
 * Comprehensive Website QA Test Script
 * 
 * This script demonstrates how to use BugZapp as an AI QA Engineer
 * to test an entire website comprehensively.
 * 
 * Usage: node comprehensive-qa-test.js <website-url>
 * Example: node comprehensive-qa-test.js https://example.com
 */

const API_BASE = 'http://localhost:4111/api';

// Get website URL from command line or use default
const websiteUrl = process.argv[2] || 'https://example.com';

console.log(`🤖 AI QA Engineer - Comprehensive Website Test`);
console.log(`🌐 Target Website: ${websiteUrl}`);
console.log(`⏰ Started at: ${new Date().toLocaleString()}\n`);

// Helper function to run a QA test
async function runQATest(testName, prompt) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 ${testName}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);
    console.log(`⏳ Running test... (this may take 10-30 seconds)\n`);

    try {
        const response = await fetch(`${API_BASE}/agents/web-agent/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        console.log(`✅ Test Completed!`);
        console.log(`\n📊 Results:`);
        console.log(`${'-'.repeat(60)}`);

        if (result.text) {
            // Truncate long responses
            const resultText = result.text.length > 500
                ? result.text.substring(0, 500) + '...\n[Response truncated]'
                : result.text;
            console.log(resultText);
        }

        console.log(`${'-'.repeat(60)}`);

        return { success: true, result };
    } catch (error) {
        console.error(`❌ Test Failed!`);
        console.error(`Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Main test suite
async function runComprehensiveQA() {
    const results = [];

    // Test 1: Initial Discovery
    results.push(await runQATest(
        'Test 1: Initial Discovery & Homepage Analysis',
        `Navigate to ${websiteUrl} and provide a comprehensive analysis:
    1. Describe the overall page structure and layout
    2. List all main sections visible on the homepage
    3. Identify the primary navigation elements
    4. Extract the page title and main heading
    5. List all visible call-to-action buttons
    6. Describe the footer content
    Please provide a detailed report of what you observe.`
    ));

    // Test 2: UI Element Validation
    results.push(await runQATest(
        'Test 2: UI Element Validation',
        `Navigate to ${websiteUrl} and verify the following UI elements:
    1. Assert that a header/logo is present
    2. Assert that navigation menu exists
    3. Assert that the page has a main content area
    4. Assert that a footer is present
    5. Check if all images are loaded (no broken images)
    Capture evidence for any failures.`
    ));

    // Test 3: Navigation Testing
    results.push(await runQATest(
        'Test 3: Navigation & Link Testing',
        `Navigate to ${websiteUrl} and test the navigation:
    1. Extract all navigation links
    2. Identify the number of clickable links on the page
    3. Check if links have descriptive text
    4. Verify that the logo is clickable (if present)
    Report all findings.`
    ));

    // Test 4: Content Validation
    results.push(await runQATest(
        'Test 4: Content Quality Check',
        `Navigate to ${websiteUrl} and validate the content:
    1. Extract the main heading (H1)
    2. Check if there are subheadings (H2, H3)
    3. Verify that text content is readable and not truncated
    4. Assert that the page title is set and descriptive
    5. Check if meta description exists (if accessible)
    Report your findings.`
    ));

    // Test 5: Interactive Elements
    results.push(await runQATest(
        'Test 5: Interactive Elements Testing',
        `Navigate to ${websiteUrl} and test interactive elements:
    1. Identify all buttons on the page
    2. List all form inputs (if any)
    3. Check if there are any dropdowns or select elements
    4. Identify any search functionality
    5. Note any interactive widgets or components
    Provide a comprehensive list.`
    ));

    // Test 6: Accessibility Check
    results.push(await runQATest(
        'Test 6: Basic Accessibility Audit',
        `Navigate to ${websiteUrl} and perform accessibility checks:
    1. Check if images have alt text attributes
    2. Verify proper heading hierarchy (H1 -> H2 -> H3)
    3. Check if form inputs have associated labels (if forms exist)
    4. Verify that buttons have descriptive text
    5. Assert that the page has a meaningful title
    Report any accessibility issues found.`
    ));

    // Test 7: Responsive Design Check
    results.push(await runQATest(
        'Test 7: Responsive Design Elements',
        `Navigate to ${websiteUrl} and check for responsive design indicators:
    1. Look for mobile menu icons (hamburger menu)
    2. Check if the layout appears to be responsive
    3. Identify any viewport meta tags (if accessible)
    4. Note any responsive images or flexible layouts
    Report your observations.`
    ));

    // Test 8: Performance Indicators
    results.push(await runQATest(
        'Test 8: Performance & Load Check',
        `Navigate to ${websiteUrl} and assess performance:
    1. Note the page load experience
    2. Check if there are any console errors
    3. Verify that critical content loads quickly
    4. Check if images are optimized (based on load time)
    5. Note any performance issues
    Provide a performance summary.`
    ));

    // Print Summary
    console.log(`\n\n${'='.repeat(60)}`);
    console.log(`📊 COMPREHENSIVE QA TEST SUMMARY`);
    console.log(`${'='.repeat(60)}`);
    console.log(`🌐 Website: ${websiteUrl}`);
    console.log(`⏰ Completed at: ${new Date().toLocaleString()}`);
    console.log(`\n📈 Test Results:`);

    const passedTests = results.filter(r => r.success).length;
    const failedTests = results.filter(r => !r.success).length;

    console.log(`   ✅ Passed: ${passedTests}/${results.length}`);
    console.log(`   ❌ Failed: ${failedTests}/${results.length}`);

    if (failedTests > 0) {
        console.log(`\n⚠️  Failed Tests:`);
        results.forEach((result, index) => {
            if (!result.success) {
                console.log(`   ${index + 1}. Test ${index + 1}: ${result.error}`);
            }
        });
    }

    console.log(`\n📁 Check Bug Reports:`);
    console.log(`   Directory: ./qa-storage/bug-reports/`);
    console.log(`   Command: ls -la ./qa-storage/bug-reports/`);

    console.log(`\n📚 Next Steps:`);
    console.log(`   1. Review the test results above`);
    console.log(`   2. Check ./qa-storage for detailed bug reports`);
    console.log(`   3. Open http://localhost:4111 for interactive testing`);
    console.log(`   4. Read AI_QA_ENGINEER_GUIDE.md for more test patterns`);

    console.log(`\n${'='.repeat(60)}\n`);
}

// Check if server is running first
async function checkServer() {
    try {
        const response = await fetch(`${API_BASE}/agents`);
        if (!response.ok) throw new Error('Server not responding');
        return true;
    } catch (error) {
        console.error(`\n❌ Error: BugZapp server is not running!`);
        console.error(`\nPlease start the server first:`);
        console.error(`   cd ${process.cwd()}`);
        console.error(`   pnpm run dev\n`);
        return false;
    }
}

// Run the comprehensive QA test suite
(async () => {
    const serverRunning = await checkServer();
    if (!serverRunning) {
        process.exit(1);
    }

    console.log(`✅ Server is running\n`);
    console.log(`🚀 Starting comprehensive QA test suite...`);
    console.log(`⚠️  Note: This will take several minutes to complete.\n`);

    await runComprehensiveQA();
})().catch(error => {
    console.error(`\n💥 Fatal error:`, error);
    process.exit(1);
});

/**
 * Proper QA Test for jeevanantham.site
 * 
 * This script runs REAL assertions with evidence capture
 * for jeevanantham.site, not just AI analysis.
 */

const API_BASE = 'http://localhost:4111';

async function callAgent(prompt) {
    const response = await fetch(`${API_BASE}/api/agents/web-agent/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }]
        })
    });

    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
}

async function runTest(testName, prompt) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 ${testName}`);
    console.log('='.repeat(60));
    console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);
    console.log('⏳ Running test with assertions... (this may take 30-60 seconds)\n');

    try {
        const result = await callAgent(prompt);
        console.log('✅ Test Completed!\n');
        console.log('📊 Results:');
        console.log('-'.repeat(60));
        console.log(result.text || JSON.stringify(result, null, 2));
        console.log('-'.repeat(60));
        return { success: true, result };
    } catch (error) {
        console.log('❌ Test Failed!\n');
        console.log('❌ Error:', error.message);
        console.log('-'.repeat(60));
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('🎯 Proper QA Test Suite for jeevanantham.site');
    console.log('='.repeat(60));
    console.log('⏰ Started at:', new Date().toLocaleString());
    console.log('🌐 Target: https://jeevanantham.site');
    console.log('📋 Running tests with REAL assertions and evidence capture\n');

    const tests = [];

    // Test 1: Homepage Title Assertion
    tests.push(await runTest(
        'Test 1: Homepage Title Check',
        `Navigate to https://jeevanantham.site and run the following QA assertion:

Title: "Homepage Title Verification"
Severity: critical
Priority: p0
Steps:
1. Navigate to https://jeevanantham.site
2. Check the page title

Assertions:
- Assert that the page title exists
- Assert that the page title is not empty
- Assert that the page title contains "Jeevanantham" (case-insensitive)

Expected: Page title should contain "Jeevanantham"

Use the qaAssertTool to run this assertion and capture evidence if it fails.`
    ));

    // Test 2: Navigation Menu Assertion
    tests.push(await runTest(
        'Test 2: Navigation Menu Check',
        `Navigate to https://jeevanantham.site and run the following QA assertion:

Title: "Navigation Menu Presence"
Severity: major
Priority: p1
Steps:
1. Navigate to https://jeevanantham.site
2. Check for navigation menu

Assertions:
- Assert that a navigation element exists (nav, header with links, or menu)
- Assert that navigation links are visible

Expected: Navigation menu should be present and visible

Use the qaAssertTool to run this assertion and capture evidence if it fails.`
    ));

    // Test 3: Main Heading Assertion
    tests.push(await runTest(
        'Test 3: Main Heading (H1) Check',
        `Navigate to https://jeevanantham.site and run the following QA assertion:

Title: "Main Heading Verification"
Severity: major
Priority: p1
Steps:
1. Navigate to https://jeevanantham.site
2. Find the main H1 heading

Assertions:
- Assert that an H1 heading exists
- Assert that the H1 text is not empty
- Assert that the H1 contains meaningful content (more than 10 characters)

Expected: Main H1 heading should exist with meaningful content

Use the qaAssertTool to run this assertion and capture evidence if it fails.`
    ));

    // Test 4: Image Alt Text Assertion
    tests.push(await runTest(
        'Test 4: Image Alt Text Check',
        `Navigate to https://jeevanantham.site and run the following QA assertion:

Title: "Image Accessibility - Alt Text"
Severity: minor
Priority: p2
Steps:
1. Navigate to https://jeevanantham.site
2. Find all images on the page
3. Check if all images have alt attributes

Assertions:
- Assert that all images have alt attributes
- If any image is missing alt text, capture it as a bug

Expected: All images should have alt text for accessibility

Use the qaAssertTool to run this assertion and capture evidence if it fails.`
    ));

    // Test 5: Meta Description Assertion
    tests.push(await runTest(
        'Test 5: Meta Description Check',
        `Navigate to https://jeevanantham.site and run the following QA assertion:

Title: "SEO - Meta Description"
Severity: minor
Priority: p2
Steps:
1. Navigate to https://jeevanantham.site
2. Check for meta description tag

Assertions:
- Assert that meta description exists
- Assert that meta description is not empty
- Assert that meta description length is between 50-160 characters

Expected: Meta description should exist and be properly formatted

Use the qaAssertTool to run this assertion and capture evidence if it fails.`
    ));

    // Test 6: Responsive Viewport Assertion
    tests.push(await runTest(
        'Test 6: Responsive Viewport Meta Tag',
        `Navigate to https://jeevanantham.site and run the following QA assertion:

Title: "Responsive Design - Viewport Meta"
Severity: minor
Priority: p2
Steps:
1. Navigate to https://jeevanantham.site
2. Check for viewport meta tag

Assertions:
- Assert that viewport meta tag exists
- Assert that it contains "width=device-width"

Expected: Viewport meta tag should exist for responsive design

Use the qaAssertTool to run this assertion and capture evidence if it fails.`
    ));

    // Test 7: Links Functionality
    tests.push(await runTest(
        'Test 7: Links Functionality Check',
        `Navigate to https://jeevanantham.site and run the following QA assertion:

Title: "Links Functionality"
Severity: major
Priority: p1
Steps:
1. Navigate to https://jeevanantham.site
2. Find all links on the page
3. Check if links have valid href attributes

Assertions:
- Assert that all links have href attributes
- Assert that no links have empty or "#" href values (except intentional anchors)

Expected: All links should have valid href attributes

Use the qaAssertTool to run this assertion and capture evidence if it fails.`
    ));

    // Test 8: Console Errors Check
    tests.push(await runTest(
        'Test 8: JavaScript Console Errors',
        `Navigate to https://jeevanantham.site and run the following QA assertion:

Title: "JavaScript Console Errors"
Severity: critical
Priority: p0
Steps:
1. Navigate to https://jeevanantham.site
2. Check browser console for errors

Assertions:
- Assert that there are no JavaScript errors in the console
- If errors exist, capture them as evidence

Expected: No JavaScript console errors

Use the qaAssertTool to run this assertion and capture evidence if it fails.`
    ));

    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('🎯 PROPER QA TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`🌐 Website: https://jeevanantham.site`);
    console.log(`⏰ Completed at: ${new Date().toLocaleString()}\n`);

    const passed = tests.filter(t => t.success).length;
    const failed = tests.filter(t => !t.success).length;

    console.log(`📊 Test Results:`);
    console.log(`   ✅ Passed: ${passed}/${tests.length}`);
    console.log(`   ❌ Failed: ${failed}/${tests.length}\n`);

    console.log(`📁 Evidence Location:`);
    console.log(`   Directory: ./src/mastra/public/evidence/`);
    console.log(`   Command: ls -la ./src/mastra/public/evidence/\n`);

    console.log(`📋 Bug Reports:`);
    console.log(`   Directory: ./qa-storage/bug-reports/ (if created)`);
    console.log(`   Command: ls -la ./qa-storage/bug-reports/\n`);

    console.log(`🎬 Session Recordings:`);
    console.log(`   Check Browserbase dashboard for video recordings\n`);

    console.log(`📝 Next Steps:`);
    console.log(`   1. Check ./src/mastra/public/evidence/ for screenshots and HTML`);
    console.log(`   2. Review bug-report.json files in evidence folders`);
    console.log(`   3. View session recordings in Browserbase`);
    console.log(`   4. Open http://localhost:4111 for interactive testing\n`);

    console.log('='.repeat(60));
}

// Run the tests
main().catch(console.error);

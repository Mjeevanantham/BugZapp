/**
 * Fresh QA Test for aaludra.com
 * 
 * This script runs comprehensive assertions with evidence capture
 * for aaludra.com with proper qaAssertTool usage.
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
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🧪 ${testName}`);
    console.log('='.repeat(70));
    console.log(`⏳ Running test... (this may take 30-60 seconds)\n`);

    try {
        const result = await callAgent(prompt);
        console.log('✅ Test Completed!\n');
        console.log('📊 Results:');
        console.log('-'.repeat(70));
        console.log(result.text || JSON.stringify(result, null, 2));
        console.log('-'.repeat(70));
        return { success: true, result };
    } catch (error) {
        console.log('❌ Test Failed!\n');
        console.log('❌ Error:', error.message);
        console.log('-'.repeat(70));
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('\n' + '='.repeat(70));
    console.log('🎯 FRESH QA TEST SUITE FOR AALUDRA.COM');
    console.log('='.repeat(70));
    console.log('⏰ Started at:', new Date().toLocaleString());
    console.log('🌐 Target: https://aaludra.com');
    console.log('🧹 Evidence folder: CLEANED');
    console.log('📋 Running comprehensive assertions with evidence capture\n');

    const tests = [];

    // Test 1: Homepage Title and Meta
    tests.push(await runTest(
        'Test 1: Homepage Title and Meta Tags',
        `Navigate to https://aaludra.com and use qaAssertTool to run these assertions:

Title: "Homepage Title and Meta Verification"
Severity: critical
Priority: p0
Component: SEO
Steps:
1. Navigate to https://aaludra.com
2. Check page title
3. Check meta description

Assertions:
- Check if page title exists and is visible
- Check if meta description exists

Expected: Page should have proper title and meta description for SEO

Capture evidence if any assertion fails.`
    ));

    // Test 2: Main Heading
    tests.push(await runTest(
        'Test 2: Main Heading (H1) Verification',
        `Navigate to https://aaludra.com and use qaAssertTool to run these assertions:

Title: "Main Heading H1 Check"
Severity: major
Priority: p1
Component: Content
Steps:
1. Navigate to https://aaludra.com
2. Find the main H1 heading

Assertions:
- Check if H1 heading exists and is visible

Expected: Page should have a main H1 heading

Capture evidence if any assertion fails.`
    ));

    // Test 3: Navigation Menu
    tests.push(await runTest(
        'Test 3: Navigation Menu Presence',
        `Navigate to https://aaludra.com and use qaAssertTool to run these assertions:

Title: "Navigation Menu Check"
Severity: major
Priority: p1
Component: UI
Steps:
1. Navigate to https://aaludra.com
2. Look for navigation menu

Assertions:
- Check if navigation menu exists (nav element or header with links)

Expected: Page should have a navigation menu

Capture evidence if any assertion fails.`
    ));

    // Test 4: Images
    tests.push(await runTest(
        'Test 4: Images and Alt Text',
        `Navigate to https://aaludra.com and use qaAssertTool to run these assertions:

Title: "Image Accessibility Check"
Severity: minor
Priority: p2
Component: Accessibility
Steps:
1. Navigate to https://aaludra.com
2. Find all images on the page
3. Check if images have alt attributes

Assertions:
- Check if images exist on the page
- Verify images have alt text for accessibility

Expected: All images should have alt text

Capture evidence if any assertion fails.`
    ));

    // Test 5: Links
    tests.push(await runTest(
        'Test 5: Links Functionality',
        `Navigate to https://aaludra.com and use qaAssertTool to run these assertions:

Title: "Links Functionality Check"
Severity: major
Priority: p1
Component: Navigation
Steps:
1. Navigate to https://aaludra.com
2. Find all links on the page
3. Check if links have valid href attributes

Assertions:
- Check if links exist on the page
- Verify links have href attributes

Expected: All links should have valid href attributes

Capture evidence if any assertion fails.`
    ));

    // Test 6: Responsive Design
    tests.push(await runTest(
        'Test 6: Responsive Viewport Meta',
        `Navigate to https://aaludra.com and use qaAssertTool to run these assertions:

Title: "Responsive Design - Viewport Meta"
Severity: minor
Priority: p2
Component: Responsive Design
Steps:
1. Navigate to https://aaludra.com
2. Check for viewport meta tag

Assertions:
- Check if viewport meta tag exists

Expected: Page should have viewport meta tag for responsive design

Capture evidence if any assertion fails.`
    ));

    // Test 7: Page Load and Console
    tests.push(await runTest(
        'Test 7: Page Load and Console Errors',
        `Navigate to https://aaludra.com and use qaAssertTool to run these assertions:

Title: "Page Load and Console Check"
Severity: critical
Priority: p0
Component: Performance
Steps:
1. Navigate to https://aaludra.com
2. Check if page loads successfully
3. Check browser console for errors

Assertions:
- Verify page loads without errors
- Check for JavaScript console errors

Expected: Page should load successfully without console errors

Capture evidence if any assertion fails.`
    ));

    // Test 8: Content Verification
    tests.push(await runTest(
        'Test 8: Content and Text Verification',
        `Navigate to https://aaludra.com and use qaAssertTool to run these assertions:

Title: "Content Verification"
Severity: major
Priority: p1
Component: Content
Steps:
1. Navigate to https://aaludra.com
2. Check if page has meaningful content

Assertions:
- Verify page has text content (not empty)
- Check if main content area exists

Expected: Page should have meaningful content

Capture evidence if any assertion fails.`
    ));

    // Summary
    console.log('\n\n' + '='.repeat(70));
    console.log('🎯 FRESH QA TEST SUMMARY FOR AALUDRA.COM');
    console.log('='.repeat(70));
    console.log(`🌐 Website: https://aaludra.com`);
    console.log(`⏰ Completed at: ${new Date().toLocaleString()}\n`);

    const passed = tests.filter(t => t.success).length;
    const failed = tests.filter(t => !t.success).length;

    console.log(`📊 Test Results:`);
    console.log(`   ✅ Completed: ${passed}/${tests.length}`);
    console.log(`   ❌ Failed: ${failed}/${tests.length}\n`);

    console.log(`📁 Evidence Location:`);
    console.log(`   Directory: ./src/mastra/public/evidence/`);
    console.log(`   Command: ls -la ./src/mastra/public/evidence/\n`);

    console.log(`🔍 To View Evidence:`);
    console.log(`   1. Check evidence folders for bug reports`);
    console.log(`   2. Each folder contains:`);
    console.log(`      - bug-report.json (bug details with aaludra.com URL)`);
    console.log(`      - screenshot.png (screenshot of aaludra.com)`);
    console.log(`      - page.html (HTML snapshot of aaludra.com)`);
    console.log(`      - console-logs.json (console errors)`);
    console.log(`      - network-errors.json (network failures)\n`);

    console.log(`🎬 Session Recordings:`);
    console.log(`   Check Browserbase dashboard for video recordings\n`);

    console.log(`📝 Next Steps:`);
    console.log(`   1. Review evidence files in ./src/mastra/public/evidence/`);
    console.log(`   2. Open bug-report.json files to see issues`);
    console.log(`   3. View screenshots to see visual evidence`);
    console.log(`   4. Check Browserbase for session recordings\n`);

    console.log('='.repeat(70));
    console.log('✅ Fresh test completed! All evidence is from aaludra.com only.');
    console.log('='.repeat(70));
}

// Run the tests
main().catch(console.error);

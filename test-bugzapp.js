/**
 * BugZapp Automated Test Script
 * 
 * This script tests the main functionality of BugZapp by:
 * 1. Checking if the server is running
 * 2. Testing the webAgent availability
 * 3. Running a simple navigation test
 * 4. Running a QA assertion test
 * 
 * Usage: node test-bugzapp.js
 */

const API_BASE = 'http://localhost:4111/api';

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  console.log(`\n🔄 Calling: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    throw error;
  }
}

// Test 1: Check if server is running
async function testServerHealth() {
  console.log('\n📡 Test 1: Checking server health...');
  try {
    const agents = await apiCall('/agents');
    console.log('✅ Server is running!');
    console.log(`   Found ${Object.keys(agents).length} agent(s)`);
    return true;
  } catch (error) {
    console.error('❌ Server is not responding. Make sure `pnpm run dev` is running.');
    return false;
  }
}

// Test 2: Check webAgent availability
async function testWebAgent() {
  console.log('\n🤖 Test 2: Checking webAgent availability...');
  try {
    const agent = await apiCall('/agents/web-agent');
    console.log('✅ webAgent is available!');
    console.log(`   Name: ${agent.name}`);
    console.log(`   Model: ${agent.provider}/${agent.modelId}`);
    console.log(`   Tools: ${Object.keys(agent.tools).length} available`);
    return true;
  } catch (error) {
    console.error('❌ webAgent not found');
    return false;
  }
}

// Test 3: Simple navigation test
async function testNavigation() {
  console.log('\n🌐 Test 3: Testing navigation to example.com...');
  console.log('   This may take 10-30 seconds...');
  
  try {
    const result = await apiCall('/agents/web-agent/generate', {
      method: 'POST',
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Navigate to https://example.com and tell me what you see'
          }
        ]
      })
    });

    console.log('✅ Navigation test completed!');
    
    if (result.text) {
      console.log(`   Response: ${result.text.substring(0, 200)}...`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Navigation test failed');
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

// Test 4: QA Assertion test
async function testQAAssertion() {
  console.log('\n✅ Test 4: Testing QA assertion...');
  console.log('   This may take 10-30 seconds...');
  
  try {
    const result = await apiCall('/agents/web-agent/generate', {
      method: 'POST',
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Navigate to https://example.com and assert that the page title contains "Example"'
          }
        ]
      })
    });

    console.log('✅ QA assertion test completed!');
    
    if (result.text) {
      console.log(`   Response: ${result.text.substring(0, 200)}...`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ QA assertion test failed');
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 BugZapp Automated Test Suite');
  console.log('================================\n');
  
  const results = {
    serverHealth: false,
    webAgent: false,
    navigation: false,
    qaAssertion: false,
  };

  // Run tests sequentially
  results.serverHealth = await testServerHealth();
  
  if (results.serverHealth) {
    results.webAgent = await testWebAgent();
    
    if (results.webAgent) {
      console.log('\n⚠️  Note: The following tests require valid Browserbase and OpenAI API keys');
      console.log('   If they fail, check your .env file\n');
      
      results.navigation = await testNavigation();
      results.qaAssertion = await testQAAssertion();
    }
  }

  // Print summary
  console.log('\n\n📊 Test Summary');
  console.log('================');
  console.log(`Server Health:    ${results.serverHealth ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`WebAgent Check:   ${results.webAgent ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Navigation Test:  ${results.navigation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`QA Assertion:     ${results.qaAssertion ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\nTotal: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! BugZapp is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
  
  console.log('\n📚 Next Steps:');
  console.log('   1. Open http://localhost:4111 in your browser');
  console.log('   2. Try the Mastra Studio interface');
  console.log('   3. Read TESTING_GUIDE.md for detailed testing scenarios');
  console.log('   4. Check ./qa-storage for bug reports (if any)');
}

// Run the tests
runTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

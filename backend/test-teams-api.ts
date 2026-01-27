/**
 * Test script for Teams API
 * 
 * Run with: tsx backend/test-teams-api.ts
 * 
 * Make sure the backend server is running on port 4000
 */

const BASE_URL = 'http://localhost:4000/api/teams';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

async function testCreateTeam() {
  try {
    const response = await fetch(`${BASE_URL}/admin/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team_name: 'TestTeam',
        player1_name: 'Alice Smith',
        player2_name: 'Bob Jones',
        phone_no: '9876543210',
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      results.push({
        name: '1. Create Team',
        success: true,
        message: `Team created successfully (ID: ${data.data.team_id})`,
        data: data.data,
      });
      return data.data;
    } else {
      results.push({
        name: '1. Create Team',
        success: false,
        message: data.error || 'Failed to create team',
      });
      return null;
    }
  } catch (error: any) {
    results.push({
      name: '1. Create Team',
      success: false,
      message: error.message,
    });
    return null;
  }
}

async function testLogin(teamName: string, password: string) {
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team_name: teamName, password }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      results.push({
        name: '2. Team Login',
        success: true,
        message: 'Login successful',
        data: data.data,
      });
      return true;
    } else {
      results.push({
        name: '2. Team Login',
        success: false,
        message: data.error || 'Login failed',
      });
      return false;
    }
  } catch (error: any) {
    results.push({
      name: '2. Team Login',
      success: false,
      message: error.message,
    });
    return false;
  }
}

async function testSubmitScore(teamId: string, round: 1 | 2, score: number) {
  try {
    const response = await fetch(`${BASE_URL}/round/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team_id: teamId,
        round_number: round,
        total_score: score,
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      results.push({
        name: `3. Submit Round ${round} Score`,
        success: true,
        message: `Score ${score} submitted`,
        data: data.data,
      });
      return true;
    } else {
      results.push({
        name: `3. Submit Round ${round} Score`,
        success: false,
        message: data.error || 'Score submission failed',
      });
      return false;
    }
  } catch (error: any) {
    results.push({
      name: `3. Submit Round ${round} Score`,
      success: false,
      message: error.message,
    });
    return false;
  }
}

async function testGetRankings(round: 1 | 2) {
  try {
    const response = await fetch(`${BASE_URL}/rankings?round=${round}`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      results.push({
        name: `4. Get Round ${round} Rankings`,
        success: true,
        message: `Retrieved ${data.data.length} teams`,
        data: data.data,
      });
      return true;
    } else {
      results.push({
        name: `4. Get Round ${round} Rankings`,
        success: false,
        message: data.error || 'Failed to get rankings',
      });
      return false;
    }
  } catch (error: any) {
    results.push({
      name: `4. Get Round ${round} Rankings`,
      success: false,
      message: error.message,
    });
    return false;
  }
}

async function testGetTeamDetails(teamId: string) {
  try {
    const response = await fetch(`${BASE_URL}/${teamId}`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      results.push({
        name: '5. Get Team Details',
        success: true,
        message: 'Team details retrieved',
        data: data.data,
      });
      return true;
    } else {
      results.push({
        name: '5. Get Team Details',
        success: false,
        message: data.error || 'Failed to get team details',
      });
      return false;
    }
  } catch (error: any) {
    results.push({
      name: '5. Get Team Details',
      success: false,
      message: error.message,
    });
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting Teams API Tests...\n');
  console.log('Base URL:', BASE_URL);
  console.log('=' .repeat(60));

  // Test 1: Create Team
  const teamData = await testCreateTeam();
  
  if (teamData) {
    // Test 2: Login
    await testLogin(teamData.team_name, teamData.password);
    
    // Test 3: Submit Round 1 Score
    await testSubmitScore(teamData.team_id, 1, 85);
    
    // Test 4: Submit Round 2 Score
    await testSubmitScore(teamData.team_id, 2, 92);
    
    // Test 5: Get Round 1 Rankings
    await testGetRankings(1);
    
    // Test 6: Get Round 2 Rankings
    await testGetRankings(2);
    
    // Test 7: Get Team Details
    await testGetTeamDetails(teamData.team_id);
  }

  // Print Results
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS\n');
  
  results.forEach((result) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    console.log(`   ${result.message}`);
    if (result.data) {
      console.log(`   Data:`, JSON.stringify(result.data, null, 2));
    }
    console.log();
  });

  const passed = results.filter(r => r.success).length;
  const total = results.length;
  console.log('='.repeat(60));
  console.log(`✨ Tests Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
  }
}

// Run tests
runTests().catch(console.error);

/**
 * Test script for calendar endpoint verification
 * Run with: node test-calendar-endpoint.js
 * 
 * This script tests the employee summary endpoint to verify it's working correctly.
 * Make sure your backend server is running before executing this script.
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Test configuration - you'll need to update these with real values
const TEST_CONFIG = {
  // Get these from your database or login as manager
  managerToken: process.env.TEST_MANAGER_TOKEN || 'YOUR_MANAGER_TOKEN_HERE',
  employeeId: process.env.TEST_EMPLOYEE_ID || 'YOUR_EMPLOYEE_ID_HERE',
  year: 2024,
  month: 11, // November
};

/**
 * Test the health endpoint
 */
async function testHealth() {
  console.log('\n📋 Step 1: Testing Health Endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

/**
 * Test the employee summary endpoint
 */
async function testEmployeeSummary() {
  console.log('\n📋 Step 2: Testing Employee Summary Endpoint...');
  
  const { managerToken, employeeId, year, month } = TEST_CONFIG;
  
  if (!managerToken || managerToken === 'YOUR_MANAGER_TOKEN_HERE') {
    console.warn('⚠️  Warning: Manager token not configured. Please set TEST_MANAGER_TOKEN environment variable.');
    console.warn('   Or update TEST_CONFIG in this file.');
    return false;
  }
  
  if (!employeeId || employeeId === 'YOUR_EMPLOYEE_ID_HERE') {
    console.warn('⚠️  Warning: Employee ID not configured. Please set TEST_EMPLOYEE_ID environment variable.');
    console.warn('   Or update TEST_CONFIG in this file.');
    return false;
  }
  
  const url = `${API_URL}/calendar/employee/${employeeId}/summary`;
  const params = { year, month };
  
  console.log('Request URL:', url);
  console.log('Query Params:', params);
  console.log('Full URL:', `${url}?year=${year}&month=${month}`);
  
  try {
    const response = await axios.get(url, {
      params,
      headers: {
        'Authorization': `Bearer ${managerToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ Request successful!');
    console.log('Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    // Validate response structure
    const data = response.data;
    const requiredFields = ['userId', 'year', 'month', 'period', 'statistics'];
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      console.warn('⚠️  Warning: Missing fields in response:', missingFields);
    } else {
      console.log('✅ Response structure is valid');
    }
    
    // Validate statistics structure
    if (data.statistics) {
      const statsFields = ['totalDays', 'present', 'absent', 'late', 'halfDay', 'leaveApproved', 'leavePending', 'onTimePercentage'];
      const missingStats = statsFields.filter(field => !(field in data.statistics));
      
      if (missingStats.length > 0) {
        console.warn('⚠️  Warning: Missing statistics fields:', missingStats);
      } else {
        console.log('✅ Statistics structure is valid');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Request failed!');
    
    if (error.response) {
      // Server responded with error
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 404) {
        console.error('\n🔍 Troubleshooting 404:');
        console.error('  1. Check if backend server is running');
        console.error('  2. Verify route exists in backend/routes/calendar.js');
        console.error('  3. Ensure route is mounted in backend/server.js');
        console.error('  4. Restart backend server if you just added the route');
      } else if (error.response.status === 401) {
        console.error('\n🔍 Troubleshooting 401:');
        console.error('  1. Check if token is valid');
        console.error('  2. Verify token is not expired');
        console.error('  3. Ensure token is properly formatted (Bearer <token>)');
      } else if (error.response.status === 403) {
        console.error('\n🔍 Troubleshooting 403:');
        console.error('  1. Verify user role is "manager"');
        console.error('  2. Check managerAuth middleware is working correctly');
      }
    } else if (error.request) {
      // Request made but no response
      console.error('No response received from server');
      console.error('This usually means:');
      console.error('  1. Backend server is not running');
      console.error('  2. Wrong URL or port');
      console.error('  3. Network/firewall issue');
    } else {
      // Error in request setup
      console.error('Error setting up request:', error.message);
    }
    
    return false;
  }
}

/**
 * Test the employee calendar endpoint (for comparison)
 */
async function testEmployeeCalendar() {
  console.log('\n📋 Step 3: Testing Employee Calendar Endpoint (for comparison)...');
  
  const { managerToken, employeeId, year, month } = TEST_CONFIG;
  
  if (!managerToken || managerToken === 'YOUR_MANAGER_TOKEN_HERE') {
    console.log('⏭️  Skipping: Manager token not configured');
    return false;
  }
  
  if (!employeeId || employeeId === 'YOUR_EMPLOYEE_ID_HERE') {
    console.log('⏭️  Skipping: Employee ID not configured');
    return false;
  }
  
  const url = `${API_URL}/calendar/employee/${employeeId}`;
  const params = { year, month };
  
  try {
    const response = await axios.get(url, {
      params,
      headers: {
        'Authorization': `Bearer ${managerToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ Calendar endpoint works!');
    console.log('Status:', response.status);
    console.log('Has employee data:', !!response.data.employee);
    console.log('Calendar data length:', response.data.calendarData?.length || 0);
    
    return true;
  } catch (error) {
    console.error('❌ Calendar endpoint failed:', error.response?.status || error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting Calendar Endpoint Verification Tests');
  console.log('=' .repeat(60));
  
  const healthOk = await testHealth();
  if (!healthOk) {
    console.error('\n❌ Health check failed. Backend server may not be running.');
    console.error('Please start your backend server and try again.');
    process.exit(1);
  }
  
  await testEmployeeSummary();
  await testEmployeeCalendar();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Tests completed!');
  console.log('\n💡 Tips:');
  console.log('  - To test with real data, set environment variables:');
  console.log('    export TEST_MANAGER_TOKEN="your_token_here"');
  console.log('    export TEST_EMPLOYEE_ID="employee_id_here"');
  console.log('  - Or update TEST_CONFIG in this file');
  console.log('  - Get token by logging in as manager and checking localStorage');
}

// Run tests
runTests().catch(console.error);


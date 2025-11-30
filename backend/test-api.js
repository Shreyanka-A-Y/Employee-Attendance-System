// Quick API test script
// Run with: node test-api.js

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

async function testAPI() {
  console.log('Testing Employee Attendance API...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Endpoint...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('✓ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: Register User
    console.log('2. Testing User Registration...');
    const testEmail = `test${Date.now()}@test.com`;
    const registerData = {
      name: 'Test User',
      email: testEmail,
      password: 'test123',
      employeeId: `TEST${Date.now()}`,
      department: 'Testing'
    };

    let registerResponse;
    try {
      registerResponse = await axios.post(`${API_URL}/auth/register`, registerData);
      console.log('✓ Registration successful:', registerResponse.data.user.email);
      console.log('');
    } catch (error) {
      console.log('✗ Registration failed:', error.response?.data?.message || error.message);
      console.log('');
    }

    // Test 3: Login
    console.log('3. Testing User Login...');
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: testEmail,
        password: 'test123'
      });
      console.log('✓ Login successful:', loginResponse.data.user.email);
      console.log('✓ Token received:', loginResponse.data.token ? 'Yes' : 'No');
      console.log('');

      // Test 4: Get Me (with token)
      console.log('4. Testing Get Current User...');
      const meResponse = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${loginResponse.data.token}`
        }
      });
      console.log('✓ Get me successful:', meResponse.data.user.email);
      console.log('');

      console.log('✅ All tests passed!');
    } catch (error) {
      console.log('✗ Login failed:', error.response?.data?.message || error.message);
      console.log('');
    }

  } catch (error) {
    console.error('✗ API Test Failed:');
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Message:', error.response.data?.message || error.response.data);
    } else if (error.request) {
      console.error('  Error: No response from server');
      console.error('  Make sure backend is running on', API_URL);
    } else {
      console.error('  Error:', error.message);
    }
    process.exit(1);
  }
}

testAPI();


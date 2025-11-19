const axios = require('axios');

const API_URL = 'http://localhost:3002/api';

async function testAPI() {
  try {
    console.log('🧪 Testing API...\n');

    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const health = await axios.get('http://localhost:3002/health');
    console.log('✅ Health Check:', health.data);

    // Test 2: Register User
    console.log('\n2. Testing User Registration...');
    const registerData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123'
    };
    const register = await axios.post(`${API_URL}/auth/register`, registerData);
    console.log('✅ User Registered:', register.data.data.user);
    const token = register.data.data.token;
    console.log('🔑 Token:', token);

    // Test 3: Login
    console.log('\n3. Testing User Login...');
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };
    const login = await axios.post(`${API_URL}/auth/login`, loginData);
    console.log('✅ User Logged In:', login.data.data.user);

    // Test 4: Get Current User
    console.log('\n4. Testing Get Current User...');
    const me = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Current User:', me.data.data.user);

    // Test 5: Get All Videos (should be empty)
    console.log('\n5. Testing Get All Videos...');
    const videos = await axios.get(`${API_URL}/videos`);
    console.log('✅ Videos:', videos.data.data);

    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAPI();
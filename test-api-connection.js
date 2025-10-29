// Quick test to verify API connection between frontend and backend
const axios = require('axios');

async function testAPIConnection() {
  console.log('🧪 Testing Strukt API Connection...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing backend health...');
    const health = await axios.get('http://localhost:5050/health');
    console.log('✅ Backend health:', health.data);
    
    // Test 2: List workspaces
    console.log('\n2. Testing workspaces list...');
    const workspaces = await axios.get('http://localhost:5050/api/workspaces');
    console.log('✅ Workspaces found:', workspaces.data.length);
    
    // Test 3: AI suggestions
    console.log('\n3. Testing AI suggestions...');
    const aiResponse = await axios.post('http://localhost:5050/api/ai/suggest', {
      nodes: [],
      edges: []
    });
    console.log('✅ AI suggestions:', aiResponse.data.suggestions.length);
    
    // Test 4: Create a test workspace
    console.log('\n4. Testing workspace creation...');
    const testWorkspace = {
      name: 'API Test Workspace',
      nodes: [
        {
          id: 'center',
          type: 'root',
          position: { x: 500, y: 300 },
          data: {
            title: 'Test Project',
            summary: 'Created via API test'
          }
        },
        {
          id: 'node1',
          type: 'frontend',
          position: { x: 800, y: 300 },
          data: {
            title: 'Frontend App',
            summary: 'React application'
          }
        }
      ],
      edges: [
        {
          id: 'edge1',
          source: 'center',
          target: 'node1',
          label: ''
        }
      ]
    };

    const createResponse = await axios.post('http://localhost:5050/api/workspaces', testWorkspace);
    console.log('✅ Workspace created:', createResponse.data.name);
    
    // Test 5: Load the workspace
    console.log('\n5. Testing workspace loading...');
    const loadResponse = await axios.get(`http://localhost:5050/api/workspaces/${encodeURIComponent(testWorkspace.name)}`);
    console.log('✅ Workspace loaded:', loadResponse.data.name, `(${loadResponse.data.nodes.length} nodes)`);
    
    console.log('\n🎉 All API tests passed! Backend integration is working correctly.');
    
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
  }
}

testAPIConnection();
/**
 * CV Builder Debug Tool
 * Add this to browser console to debug authentication and API calls
 */

console.log('%c=== CV Builder Debug Tool ===', 'color: #00ff00; font-size: 16px; font-weight: bold;');

// Check if user is logged in
const token = localStorage.getItem('token');
console.log('\n1. Authentication Status:');
console.log('Token exists:', !!token);
if (token) {
  console.log('Token (first 30 chars):', token.substring(0, 30) + '...');
  
  // Decode JWT to check expiration
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('Token payload:', payload);
      console.log('Token expires:', new Date(payload.exp * 1000).toLocaleString());
      console.log('Is expired:', Date.now() > payload.exp * 1000);
    }
  } catch (e) {
    console.error('Failed to decode token:', e);
  }
}

// Check API configuration
console.log('\n2. API Configuration:');
console.log('VITE_API_BASE_URL:', import.meta.env?.VITE_API_BASE_URL || '/api (default)');
console.log('Current origin:', window.location.origin);
console.log('Full API URL:', `${window.location.origin}/api/cv-builder/quick-generate`);

// Test API call with detailed logging
console.log('\n3. Testing CV API call...');
async function testCVAPI() {
  const requestData = {
    style: 'professional',
    sections: ['summary', 'work', 'education', 'skills'],
    use_section_by_section: true
  };
  
  console.log('Request data:', requestData);
  console.log('Request headers:', {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token ? token.substring(0, 20) + '...' : 'NO TOKEN'}`
  });
  
  try {
    const response = await fetch('/api/cv-builder/quick-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    console.log('Response data:', responseData);
    
    if (response.ok) {
      console.log('%c✅ CV generation successful!', 'color: #00ff00; font-weight: bold;');
      console.log('Has cv_content:', !!responseData.cv_content);
      console.log('Has progress:', !!responseData.progress);
      console.log('Has todos:', !!responseData.todos);
    } else {
      console.log('%c❌ CV generation failed!', 'color: #ff0000; font-weight: bold;');
    }
    
    return responseData;
  } catch (error) {
    console.error('%c❌ Request failed:', 'color: #ff0000; font-weight: bold;', error);
    return null;
  }
}

// Run the test
testCVAPI().then(result => {
  console.log('\n4. Test Complete');
  console.log('Result:', result);
  console.log('\n%c=== Debug Tool Complete ===', 'color: #00ff00; font-size: 16px; font-weight: bold;');
});

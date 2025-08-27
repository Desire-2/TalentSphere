/**
 * Development authentication helper
 * This is a temporary solution to test the job management components
 */

export const setupDevAuth = () => {
  // Test employer credentials
  const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImVtcGxveWVyQHRlY2hjb3JwLmNvbSIsInJvbGUiOiJlbXBsb3llciIsImV4cCI6MTc1NTEwOTMwN30.yje2lpplhQZiSZjkc4CY8jKoU9uvGpNXPYz_yow-x2Y";
  
  const testUser = {
    "bio": "HR Manager at TechCorp Solutions",
    "created_at": "2025-08-12T12:01:34.433894",
    "email": "employer@techcorp.com",
    "first_name": "John",
    "full_name": "John Manager",
    "id": 1,
    "is_active": true,
    "is_verified": false,
    "last_login": "2025-08-13T17:21:47.208522",
    "last_name": "Manager",
    "location": "San Francisco, CA",
    "phone": null,
    "profile_picture": null,
    "role": "employer",
    "updated_at": "2025-08-13T17:21:47.210453"
  };

  // Set token and user in localStorage
  localStorage.setItem('token', testToken);
  localStorage.setItem('user', JSON.stringify(testUser));
  
  console.log('🔧 Development authentication set up');
  console.log('👤 Logged in as:', testUser.full_name);
  console.log('🎭 Role:', testUser.role);
  
  return { token: testToken, user: testUser };
};

export const clearDevAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  console.log('🔧 Development authentication cleared');
};

export const isDevAuthActive = () => {
  return localStorage.getItem('token') && localStorage.getItem('user');
};

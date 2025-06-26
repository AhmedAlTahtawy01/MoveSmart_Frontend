/**
 * Authentication Guard Utility
 * Include this file in any page that requires authentication
 * It will automatically redirect unauthenticated users to the login page
 */

// Ensure auth manager is available
if (typeof authManager === 'undefined') {
  console.error('AuthManager not found. Make sure to include auth.js before authGuard.js');
  window.location.href = 'login.html';
} else {
  // Check authentication immediately when this script loads
  authManager.requireAuth();
}

/**
 * Utility function to get the current user's information
 * Can be used in any protected page
 */
function getCurrentUser() {
  return authManager.getUserData();
}

/**
 * Utility function to check if current user has a specific role
 * @param {string} role - The role to check
 * @returns {boolean} - True if user has the role
 */
function hasRole(role) {
  const userData = authManager.getUserData();
  return userData.role === role;
}

/**
 * Utility function to logout with confirmation
 */
function confirmLogout() {
  if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
    authManager.logout();
  }
}

/**
 * Utility function to add authentication headers to API requests
 * @param {Object} headers - Existing headers object
 * @returns {Object} - Headers with authentication token
 */
function addAuthHeaders(headers = {}) {
  const userData = authManager.getUserData();
  if (userData.token) {
    headers['Authorization'] = `Bearer ${userData.token}`;
  }
  return headers;
}

/**
 * Enhanced fetch function that automatically includes auth headers
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
async function authenticatedFetch(url, options = {}) {
  // Add authentication headers
  options.headers = addAuthHeaders(options.headers);
  
  try {
    const response = await fetch(url, options);
    
    // If unauthorized, redirect to login
    if (response.status === 401) {
      console.warn('Authentication failed, redirecting to login');
      authManager.logout();
      return;
    }
    
    return response;
  } catch (error) {
    console.error('Authenticated fetch error:', error);
    throw error;
  }
} 
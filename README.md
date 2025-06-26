# Move Smart Frontend - Authentication System

This is the new frontend project for Move Smart with improved authentication architecture.

## Project Structure

```
Final_Frontend/
├── Assets/
│   ├── Fonts/
│   ├── Images/
│   └── Styles/
│       ├── login.css
│       ├── superUserDashboard.css
│       └── sharedLayout.css        # Shared styles for dashboards
├── Javascript/
│   ├── auth.js                     # Core authentication module
│   ├── authGuard.js               # Authentication guard utility
│   ├── dashboards.js              # Shared dashboard utilities
│   ├── login.js                   # Login page logic
│   └── superUserDashboard.js      # SuperUser dashboard logic
└── Pages/
    ├── login.html                 # Login page
    ├── superUserDashboard.html    # SuperUser dashboard
    └── _sharedLayout.html         # Main application layout for regular users
```

## Authentication Flow

1. **Login Process**: Users authenticate via `login.html`
2. **Role-based Redirect**: 
   - **SuperUser** → redirected to `superUserDashboard.html`
   - **Other users** → redirected to `_sharedLayout.html`
3. **Centralized Auth**: Authentication logic is centralized in `auth.js` module

## Key Components

### 1. AuthManager (`auth.js`)
Central authentication module that handles:
- Login API calls
- JWT token parsing
- localStorage management
- User session management
- Redirects and logout

```javascript
// Global instance available throughout the application
const authManager = new AuthManager();
```

### 2. Authentication Guard (`authGuard.js`)
Utility for protecting pages that require authentication:

```html
<!-- Include in any protected page -->
<script src="../Javascript/auth.js"></script>
<script src="../Javascript/authGuard.js"></script>
```

### 3. Login Page (`login.html`)
- Maintains original Arabic UI and styling
- Uses centralized authentication
- Includes loading states and error handling
- **NEW**: Role-based redirect logic
  - SuperUser → `superUserDashboard.html`
  - Other users → `_sharedLayout.html`

### 4. SuperUser Dashboard (`superUserDashboard.html`)
- **NEW**: Complete SuperUser dashboard with role-based access control
- Includes navigation cards for different system sections
- Modern, responsive design
- Integrated with centralized authentication system

### 5. Shared Dashboard Utilities (`dashboards.js`)
- **NEW**: Common dashboard functionality
- Notification system
- Utility functions for formatting and error handling
- Shared logout management

## Usage Examples

### Protecting a Page
```html
<!DOCTYPE html>
<html>
<head>
    <title>Protected Page</title>
    <link rel="stylesheet" href="../Assets/Styles/sharedLayout.css">
</head>
<body>
    <!-- Your page content -->
    
    <!-- Authentication scripts -->
    <script src="../Javascript/auth.js"></script>
    <script src="../Javascript/authGuard.js"></script>
    <script src="../Javascript/dashboards.js"></script>
    <!-- Your page scripts -->
</body>
</html>
```

### Making Authenticated API Calls
```javascript
// Using the enhanced fetch function
const response = await authenticatedFetch('/api/data', {
    method: 'GET'
});

// Or manually adding auth headers
const headers = addAuthHeaders({'Content-Type': 'application/json'});
const response = await fetch('/api/data', { headers });
```

### Getting User Information
```javascript
// Get current user data
const user = getCurrentUser();
console.log(user.name, user.role);

// Check user role
if (hasRole('SuperUser')) {
    // Show admin features
}
```

### SuperUser Dashboard Navigation
```javascript
// Navigation is handled automatically by the dashboard
// Cards navigate to different sections:
// - Users Management
// - Cars Management  
// - Drivers Management
// - Applications
// - Consumables
// - Spare Parts
// - Reports
```

### Using Dashboard Utilities
```javascript
// Show notifications
dashboardUtils.showNotification('تم الحفظ بنجاح', 'success');
dashboardUtils.showNotification('حدث خطأ', 'error');

// Format numbers for Arabic locale
const formattedNumber = dashboardUtils.formatNumber(1234); // "١٬٢٣٤"

// Handle API errors
try {
    // API call
} catch (error) {
    dashboardUtils.handleApiError(error, 'رسالة خطأ مخصصة');
}

// Loading states
dashboardUtils.setLoadingState(element, true);  // Show loading
dashboardUtils.setLoadingState(element, false); // Hide loading
```

### Logout
```javascript
// Simple logout
authManager.logout();

// Logout with confirmation (handled automatically in dashboards)
confirmLogout();
```

## API Configuration

The authentication endpoint is configured in `auth.js`:
```javascript
this.baseUrl = "https://movesmartapi.runasp.net/api/v1/User/login";
```

## Role-Based Access Control

The system now supports role-based access:

- **SuperUser**: Gets access to comprehensive dashboard with all system management features
- **Other Roles**: Directed to shared layout for regular application features

## Migration from Old Frontend

Key changes from the old system:

1. **Centralized Auth**: No need to duplicate authentication code across files
2. **Role-based Landing**: SuperUsers get dedicated dashboard, others use shared layout
3. **Improved Error Handling**: Better error messages and loading states
4. **Modular Structure**: Reusable authentication and dashboard components
5. **Enhanced SuperUser Experience**: Dedicated dashboard with management cards

## Next Steps

1. Add your application-specific pages and functionality
2. Include authentication guard in protected pages
3. Customize `_sharedLayout.html` with your application's main interface for regular users
4. Add more role-based UI components as needed
5. Create additional management pages that the SuperUser dashboard links to 
// Authentication module for handling user login and token management
class AuthManager {
  constructor() {
    this.baseUrl = "https://movesmartapi.runasp.net/api/v1/User/login";
  }

  // Parse JWT token to extract payload
  parseJwt(token) {
    if (!token) return null;

    try {
      const base64Url = token.split(".")[1]; // Get the payload part
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((char) => {
            return "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Invalid token format:", e);
      return null;
    }
  }

  // Store user authentication data in localStorage
  storeAuthData(data) {
    const parsedPayload = this.parseJwt(data.token);
    
    localStorage.setItem("userName", data.name || "User");
    localStorage.setItem("token", data.token);
    localStorage.setItem("userRole", data.role);
    localStorage.setItem("payload", JSON.stringify(parsedPayload));
  }

  // Clear authentication data from localStorage
  clearAuthData() {
    localStorage.removeItem("userName");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("payload");
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem("token");
    return token !== null;
  }

  // Get user data from localStorage
  getUserData() {
    return {
      name: localStorage.getItem("userName"),
      token: localStorage.getItem("token"),
      role: localStorage.getItem("userRole"),
      payload: JSON.parse(localStorage.getItem("payload") || "null")
    };
  }

  // Perform login API call
  async login(nationalNo, password) {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nationalNo, password }),
      });

      if (response.ok) {
        const data = await response.json();
        this.storeAuthData(data);
        return { success: true, data };
      } else {
        let errorMessage = "حدث خطأ في الخادم. حاول مرة أخرى.";
        
        if (response.status === 401) {
          errorMessage = "الرقم القومي أو كلمة المرور غير صحيح";
        } else {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // Use default error message if parsing fails
          }
        }
        
        return { 
          success: false, 
          error: errorMessage,
          status: response.status 
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { 
        success: false, 
        error: "حدث خطأ في الاتصال بالخادم. حاول مرة أخرى." 
      };
    }
  }

  // Logout user
  logout() {
    this.clearAuthData();
    window.location.href = "login.html";
  }

  // Redirect authenticated user to main application
  redirectToApp() {
    window.location.href = "_sharedLayout.html";
  }

  // Check authentication on page load and redirect if needed
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  }
}

// Create global auth manager instance
const authManager = new AuthManager(); 
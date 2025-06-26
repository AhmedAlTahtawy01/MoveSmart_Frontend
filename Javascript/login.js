async function validateForm(event) {
  event.preventDefault();
  let isValid = true;
  const nationalNo = document.getElementById("nationalNo").value;
  const password = document.getElementById("password").value;
  const nationalNoError = document.getElementById("nationalNoError");
  const passwordError = document.getElementById("passwordError");
  const serverError = document.getElementById("serverError");
  const loginButton = document.querySelector(".login-button");

  // Hide any existing server errors
  serverError.style.display = "none";

  // Validate national ID (14 digits)
  const nationalIdPattern = /^[0-9]{14}$/;
  if (!nationalIdPattern.test(nationalNo)) {
    nationalNoError.style.display = "block";
    isValid = false;
  } else {
    nationalNoError.style.display = "none";
  }

  // Validate password (minimum 6 characters)
  if (password.length < 6) {
    passwordError.style.display = "block";
    isValid = false;
  } else {
    passwordError.style.display = "none";
  }

  // Don't proceed if validation fails
  if (!isValid) return false;

  // Show loading state
  loginButton.classList.add("loading");
  loginButton.disabled = true;

  try {
    // Use auth manager to perform login
    const result = await authManager.login(nationalNo, password);

    if (result.success) {
      // Check user role and redirect accordingly
      if (result.data.role === "SuperUser") {
        window.location.href = "superUserDashboard.html";
      } else {
        // Redirect to shared layout for other users
        authManager.redirectToApp();
      }
    } else {
      // Show error message
      serverError.textContent = result.error;
      serverError.style.display = "block";
      console.log("Login error - Status:", result.status);
    }
  } catch (error) {
    // Handle unexpected errors
    serverError.textContent = "حدث خطأ غير متوقع. حاول مرة أخرى.";
    serverError.style.display = "block";
    console.error("Unexpected login error:", error);
  } finally {
    // Hide loading state
    loginButton.classList.remove("loading");
    loginButton.disabled = false;
  }

  return false;
}

// Check if user is already authenticated on page load
document.addEventListener("DOMContentLoaded", function() {
  if (authManager.isAuthenticated()) {
    // Check user role and redirect appropriately
    const userData = authManager.getUserData();
    if (userData.role === "SuperUser") {
      window.location.href = "superUserDashboard.html";
    } else {
      // User is already logged in, redirect to main app
      authManager.redirectToApp();
    }
  }
});

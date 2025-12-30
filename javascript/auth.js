
let isSignup = false;

const authForm = document.getElementById("authForm");
if (!authForm) {
  console.warn("authForm not found, auth.js skipped");
} 


// Elements
const switchModeBtn = document.getElementById("switchMode");
const switchText = document.getElementById("switchText");
const authTitle = document.getElementById("authTitle");
const authSubmitBtn = document.getElementById("authSubmitBtn");

const loginIdentifier = document.getElementById("loginIdentifier");
const signupUsername = document.getElementById("signupUsername");
const signupEmail = document.getElementById("signupEmail");
const signupAvatar = document.getElementById("signupAvatar");
const signupBio = document.getElementById("signupBio");
const authPassword = document.getElementById("authPassword");

const signupFields = [
  signupUsername,
  signupEmail,
  signupAvatar,
  signupBio
].filter(Boolean);

function setAuthMode(signup) {
  isSignup = signup;

  // Login field
  if (loginIdentifier) {
    loginIdentifier.classList.toggle("hidden", isSignup);
  }

  // Signup-only fields
  signupFields.forEach(field => {
    if (field) {
      field.classList.toggle("hidden", !isSignup);
    }
  });

  authTitle.textContent = isSignup ? "Signup" : "Login";
  authSubmitBtn.textContent = isSignup ? "Signup" : "Login";

  switchText.textContent = isSignup
    ? "Already have an account?"
    : "Don’t have an account?";

  switchModeBtn.textContent = isSignup ? "Login" : "Signup";
}

setAuthMode(false);

switchModeBtn.addEventListener("click", () => {
  setAuthMode(!isSignup);
});



// Global auth state
window.currentUser = null;
let isLoadingUser = false;
let lastAuthCheck = 0;
const AUTH_CACHE_DURATION = 30000; // 30 seconds cache

window.loadCurrentUser = async function loadCurrentUser(retryCount = 0, forceRefresh = false) {
  // Check cache first - if we have recent auth data, return it (unless force refresh requested)
  const now = Date.now();
  if (!forceRefresh && window.currentUser && (now - lastAuthCheck) < AUTH_CACHE_DURATION) {
    return window.currentUser;
  }

  // Prevent multiple concurrent calls
  if (isLoadingUser) {
    return window.currentUser;
  }

  isLoadingUser = true;
  const maxRetries = 2;

  try {
    const res = await fetch(`${API_BASE}/api/users/me`, {
      method: "GET",
      credentials: "include"
    });
    console.log(res);

    if (res.status === 401) {
      // 401 means logged out - this is expected behavior, not an error
      window.currentUser = null;
      updateLoggedOutUI();
      return null;
    }

    if (!res.ok) {
      // Other non-401 errors - retry up to maxRetries times
      if (retryCount < maxRetries) {
        console.warn(`loadCurrentUser failed with status ${res.status}, retrying... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        isLoadingUser = false; // Reset loading flag for retry
        return loadCurrentUser(retryCount + 1);
      }

      // Max retries reached - show user-friendly error
      console.error(`loadCurrentUser failed after ${maxRetries} retries with status ${res.status}`);
      window.currentUser = null;
      updateLoggedOutUI();

      // Show user feedback only on pages that need authentication
      if (window.location.pathname.includes('profile') || window.location.pathname.includes('write')) {
        alert("Unable to verify your session. Please try logging in again.");
        window.location.href = "/html/index.html";
      }

      return null;
    }

    const data = await res.json();
    window.currentUser = data.data;
    lastAuthCheck = Date.now(); // Update cache timestamp
    updateLoggedInUI(window.currentUser);
    return window.currentUser;
  } catch (err) {
    // Network errors - retry logic
    if (retryCount < maxRetries) {
      console.warn(`loadCurrentUser network error, retrying... (${retryCount + 1}/${maxRetries})`, err);
      await new Promise(resolve => setTimeout(resolve, 1000));
      isLoadingUser = false; // Reset loading flag for retry
      return loadCurrentUser(retryCount + 1);
    }

    // Max retries reached for network errors
    console.error("loadCurrentUser network error after retries", err);
    window.currentUser = null;
    updateLoggedOutUI();

    // Show user feedback for network errors on critical pages
    if (window.location.pathname.includes('profile') || window.location.pathname.includes('write')) {
      alert("Network error. Please check your connection and try again.");
    }

    return null;
  } finally {
    isLoadingUser = false;
  }
};


// SUBMIT → BACKEND
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
     
    if (!isSignup) {
      // LOGIN LOGIC
      const res = await fetch(`${API_BASE}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 🔥 IMPORTANT
        body: JSON.stringify({
          identifier: loginIdentifier.value,
          password: authPassword.value
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // success - wait for cookies to be set before checking auth
      document.getElementById("authModal").classList.add("hidden");

      // Small delay to ensure cookies are properly set
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadCurrentUser(0, true); // Force refresh after login
      alert("user logged in!");
    } else {
      // SIGNUP LOGIC
      const formData = new FormData();

      formData.append("username", signupUsername.value);
      formData.append("email", signupEmail.value);
      formData.append("password", authPassword.value);
      formData.append("bio", signupBio.value || "");

      if (signupAvatar.files[0]) {
        formData.append("avatar", signupAvatar.files[0]);
      }

      const res = await fetch(`${API_BASE}/api/users/register`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Signup failed");
        return;
      }
      else{
         alert(isSignup ? "user registered successfully" : "user logged in");

      document.getElementById("authModal").classList.add("hidden");

      // Small delay to ensure cookies are properly set
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadCurrentUser(0, true); // Force refresh after signup

    }
      
    }
  } catch (err) {
    console.error(err);
    alert(isSignup ? "Signup error" : "Login error");
  }
});


// Global UI update functions
window.updateLoggedInUI = function updateLoggedInUI(user) {
  const profileIcon = document.getElementById("profileIcon");
  if (profileIcon) {
    profileIcon.src = user.avatar || profileIcon.src;
    profileIcon.title = user.username;
  }
  // optionally hide auth modal trigger text
}

window.updateLoggedOutUI = function updateLoggedOutUI() {
  const profileIcon = document.getElementById("profileIcon");
  if (profileIcon) {
    profileIcon.src =
      "https://cdn-icons-png.flaticon.com/512/847/847969.png";
    profileIcon.title = "Login / Signup";
  }
}

// Debug function for testing authentication
window.debugAuth = async function debugAuth() {
  console.log("=== AUTH DEBUG ===");
  console.log("API_BASE:", API_BASE);
  console.log("Current cookies:", document.cookie);

  try {
    const response = await fetch(`${API_BASE}/api/users/me`, {
      method: "GET",
      credentials: "include"
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", [...response.headers.entries()]);

    if (response.ok) {
      const data = await response.json();
      console.log("Response data:", data);
    } else {
      const errorText = await response.text();
      console.log("Error response:", errorText);
    }
  } catch (error) {
    console.error("Network error:", error);
  }
};

// Debug functions for testing authentication
window.debugAuth = async function debugAuth() {
  console.log("=== AUTH DEBUG ===");
  console.log("API_BASE:", API_BASE);
  console.log("Current cookies:", document.cookie);
  console.log("Current user:", window.currentUser);
  console.log("Last auth check:", window.lastAuthCheck ? new Date(window.lastAuthCheck).toLocaleString() : "Never");

  try {
    console.log("Making request to:", `${API_BASE}/api/users/me`);
    const response = await fetch(`${API_BASE}/api/users/me`, {
      method: "GET",
      credentials: "include"
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log("✅ SUCCESS - Response data:", data);
    } else {
      const errorText = await response.text();
      console.log("❌ ERROR - Response body:", errorText);
    }
  } catch (error) {
    console.error("❌ NETWORK ERROR:", error);
  }
};

// Simple connectivity test
window.testConnection = async function testConnection() {
  console.log("=== CONNECTION TEST ===");
  console.log("Testing connection to:", API_BASE);
  console.log("Current time:", new Date().toLocaleString());

  try {
    const response = await fetch(`${API_BASE}/api/users/me`, {
      method: "GET",
      credentials: "include"
    });

    console.log("Status:", response.status);
    console.log("CORS headers present:", response.headers.get('access-control-allow-origin') !== null);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (response.status === 401) {
      console.log("✅ 401 received - This is expected when not logged in");
      console.log("Cookies sent:", document.cookie ? "Yes" : "No (empty)");
      console.log("Cookie details:", document.cookie);
    } else if (response.status === 200) {
      console.log("✅ 200 received - User is authenticated!");
      const data = await response.json();
      console.log("User data:", data);
    } else {
      console.log("⚠️ Unexpected status:", response.status);
      const errorText = await response.text();
      console.log("Error response:", errorText);
    }
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    console.error("Full error:", error);
  }
};

// Emergency debug - just log that functions loaded
console.log("🔧 Auth debug functions loaded - testConnection and debugAuth available");

// Manual test you can copy-paste into console if functions don't work
window.manualTest = async () => {
  console.log("=== MANUAL AUTH TEST ===");
  console.log("API_BASE:", window.API_BASE || "NOT SET");
  console.log("Cookies:", document.cookie);

  try {
    const response = await fetch("https://blog-website-3jb5.onrender.com/api/users/me", {
      credentials: "include"
    });
    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Response:", text);
  } catch (e) {
    console.error("Error:", e);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  loadCurrentUser();
});


console.log("✅ auth.js loaded at:", new Date().toLocaleTimeString());

/* ======================
   CONFIGURATION
====================== */
// const API_BASE = window.API_BASE || "http://localhost:8000";
// console.log("🔧 API_BASE configured as:", API_BASE);

const AUTH_CACHE_DURATION = 30000; // 30 seconds

/* ======================
   DEBUG MODE
====================== */
const DEBUG = true; // Set to false in production

function debugLog(emoji, message, data = null) {
  if (DEBUG) {
    if (data) {
      console.log(`${emoji} ${message}`, data);
    } else {
      console.log(`${emoji} ${message}`);
    }
  }
}

/* ======================
   TOKEN REFRESH LOGIC
====================== */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  debugLog("🔄", "Processing queued requests:", failedQueue.length);
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

async function refreshAccessToken() {
  if (isRefreshing) {
    debugLog("⏳", "Token refresh already in progress, queuing request");
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  debugLog("🔄", "Starting token refresh...");

  try {
    const res = await fetch(`${API_BASE}/api/users/refresh-token`, {
      method: "POST",
      credentials: "include"
    });

    if (!res.ok) {
      throw new Error(`Token refresh failed with status: ${res.status}`);
    }

    const data = await res.json();
    debugLog("✅", "Token refreshed successfully");
    processQueue(null, data.accessToken);
    isRefreshing = false;
    return data.accessToken;
  } catch (err) {
    debugLog("❌", "Token refresh error:", err.message);
    processQueue(err, null);
    isRefreshing = false;
    throw err;
  }
}

/* ======================
   ENHANCED FETCH WRAPPER
====================== */
window.fetchWithAuth = async function fetchWithAuth(url, options = {}) {
  debugLog("📡", "Fetch with auth:", url);
  
  try {
    const res = await fetch(url, {
      ...options,
      credentials: "include"
    });

    debugLog("📥", `Response status: ${res.status}`);

    // If 401 (unauthorized), try to refresh token
    if (res.status === 401) {
      debugLog("🔑", "Got 401, attempting token refresh...");
      
      try {
        await refreshAccessToken();
        
        debugLog("🔁", "Retrying original request after token refresh");
        // Retry original request
        const retryRes = await fetch(url, {
          ...options,
          credentials: "include"
        });
        
        debugLog("📥", `Retry response status: ${retryRes.status}`);
        return retryRes;
      } catch (refreshErr) {
        debugLog("❌", "Token refresh failed, clearing user");
        window.currentUser = null;
        updateLoggedOutUI();
        throw refreshErr;
      }
    }

    return res;
  } catch (err) {
    debugLog("❌", "Fetch error:", err.message);
    throw err;
  }
};

/* ======================
   AUTH STATE (GLOBAL)
====================== */
window.currentUser = null;
window.authResolved = false;

let isLoadingUser = false;
let lastAuthCheck = 0;

window.loadCurrentUser = async function loadCurrentUser(
  retryCount = 0,
  forceRefresh = false
) {
  const now = Date.now();

  // Return cached user if available
  if (!forceRefresh && window.currentUser && now - lastAuthCheck < AUTH_CACHE_DURATION) {
    debugLog("💾", "Using cached user data");
    return window.currentUser;
  }

  // Prevent concurrent requests
  if (isLoadingUser) {
    debugLog("⏳", "Already loading user, waiting...");
    return window.currentUser;
  }

  isLoadingUser = true;
  debugLog("🔍", "Loading current user...");

  try {
    const res = await fetchWithAuth(`${API_BASE}/api/users/me`, {
      method: "GET"
    });

    if (res.status === 401) {
      debugLog("❌", "User not authenticated (401)");
      window.currentUser = null;
      window.authResolved = true;
      updateLoggedOutUI();
      return null;
    }

    if (!res.ok) {
      debugLog("❌", `Failed to load user: ${res.status}`);
      window.currentUser = null;
      window.authResolved = true;
      updateLoggedOutUI();
      return null;
    }

    const { data } = await res.json();
    
    if (!data) {
      debugLog("❌", "No user data in response");
      window.currentUser = null;
      window.authResolved = true;
      updateLoggedOutUI();
      return null;
    }

    debugLog("✅", "User loaded:", data.username);
    window.currentUser = data;
    window.authResolved = true;
    lastAuthCheck = Date.now();
    updateLoggedInUI(data);
    
    return data;
  } catch (err) {
    debugLog("❌", "Error loading user:", err.message);
    window.currentUser = null;
    window.authResolved = true;
    updateLoggedOutUI();
    return null;
  } finally {
    isLoadingUser = false;
  }
};

/* ======================
   AUTH UI (LOGIN PAGE ONLY)
====================== */
const authForm = document.getElementById("authForm");

debugLog("🔍", "Looking for authForm...");

if (authForm) {
  debugLog("✅", "Auth form found! Initializing login/signup...");
  
  let isSignup = false;

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

  // Debug: Check if all elements exist
  debugLog("🔍", "Form elements check:", {
    switchModeBtn: !!switchModeBtn,
    switchText: !!switchText,
    authTitle: !!authTitle,
    authSubmitBtn: !!authSubmitBtn,
    loginIdentifier: !!loginIdentifier,
    signupUsername: !!signupUsername,
    signupEmail: !!signupEmail,
    authPassword: !!authPassword
  });

  const signupFields = [
    signupUsername,
    signupEmail,
    signupAvatar,
    signupBio
  ].filter(Boolean);

  function setAuthMode(signup) {
    isSignup = signup;
    debugLog("🔄", `Switching to ${signup ? "SIGNUP" : "LOGIN"} mode`);

    if (loginIdentifier) {
      loginIdentifier.classList.toggle("hidden", isSignup);
      loginIdentifier.required = !isSignup;
    }

    signupFields.forEach(f => {
      f.classList.toggle("hidden", !isSignup);
      if (f === signupUsername || f === signupEmail) {
        f.required = isSignup;
      }
    });

    if (authTitle) authTitle.textContent = isSignup ? "Signup" : "Login";
    if (authSubmitBtn) authSubmitBtn.textContent = isSignup ? "Signup" : "Login";
    if (switchText) {
      switchText.textContent = isSignup
        ? "Already have an account?"
        : "Don't have an account?";
    }
    if (switchModeBtn) switchModeBtn.textContent = isSignup ? "Login" : "Signup";
  }

  // Initialize to login mode
  setAuthMode(false);

  switchModeBtn?.addEventListener("click", () => {
    debugLog("🔘", "Switch mode button clicked");
    setAuthMode(!isSignup);
  });

  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    debugLog("📝", `Form submitted in ${isSignup ? "SIGNUP" : "LOGIN"} mode`);
    
    const submitBtn = authSubmitBtn;
    const originalText = submitBtn.textContent;
    
    // Disable button during submission
    submitBtn.disabled = true;
    submitBtn.textContent = isSignup ? "Creating account..." : "Logging in...";

    try {
      if (!isSignup) {
        // ========== LOGIN ==========
        debugLog("🔐", "Processing login...");
        
        const identifier = loginIdentifier ? loginIdentifier.value.trim() : "";
        const password = authPassword ? authPassword.value : "";

        debugLog("📋", "Login data:", { identifier, passwordLength: password.length });

        if (!identifier || !password) {
          alert("Please fill in all fields");
          debugLog("❌", "Missing login credentials");
          return;
        }

        const loginData = { identifier, password };
        debugLog("📡", "Sending login request to:", `${API_BASE}/api/users/login`);

        const res = await fetch(`${API_BASE}/api/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(loginData),
        });

        debugLog("📥", "Login response status:", res.status);

        const data = await res.json();
        debugLog("📦", "Login response data:", data);
        
        if (!res.ok) {
          debugLog("❌", "Login failed:", data.message);
          alert(data.message || "Login failed");
          return;
        }

        debugLog("✅", "Login successful!");
      } else {
        // ========== SIGNUP ==========
        debugLog("📝", "Processing signup...");
        
        const username = signupUsername ? signupUsername.value.trim() : "";
        const email = signupEmail ? signupEmail.value.trim() : "";
        const password = authPassword ? authPassword.value : "";
        const bio = signupBio ? signupBio.value.trim() : "";

        debugLog("📋", "Signup data:", { 
          username, 
          email, 
          passwordLength: password.length,
          bio: bio.substring(0, 20) + "..."
        });

        if (!username || !email || !password) {
          alert("Please fill in all required fields");
          debugLog("❌", "Missing signup fields");
          return;
        }

        const formData = new FormData();
        formData.append("username", username);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("bio", bio || "");

        if (signupAvatar && signupAvatar.files[0]) {
          formData.append("avatar", signupAvatar.files[0]);
          debugLog("📎", "Avatar attached:", signupAvatar.files[0].name);
        }

        debugLog("📡", "Sending signup request to:", `${API_BASE}/api/users/register`);

        const res = await fetch(`${API_BASE}/api/users/register`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        debugLog("📥", "Signup response status:", res.status);

        const data = await res.json();
        debugLog("📦", "Signup response data:", data);
        
        if (!res.ok) {
          debugLog("❌", "Signup failed:", data.message);
          alert(data.message || "Signup failed");
          return;
        }

        debugLog("✅", "Signup successful!");
      }

      // Hide auth modal if it exists
      const authModal = document.getElementById("authModal");
      if (authModal) {
        authModal.classList.add("hidden");
        debugLog("🎨", "Auth modal hidden");
      }

      // Wait for modal animation
      await new Promise(r => setTimeout(r, 300));
      
      // Reload user data
      debugLog("🔄", "Reloading user data...");
      await loadCurrentUser(0, true);
      
      debugLog("🎉", "Authentication complete!");
      alert(isSignup ? "Account created successfully!" : "Login successful!");
      
      // Reset form
      authForm.reset();
      
      // Redirect if on login page
      if (window.location.pathname.includes("login") || 
          window.location.pathname.includes("signup")) {
        debugLog("🔀", "Redirecting to home page...");
        window.location.href = "/";
      }

    } catch (err) {
      debugLog("❌", "Authentication error:", err);
      console.error("Full error:", err);
      alert("Authentication error. Please try again.");
    } finally {
      // Re-enable button
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
} else {
  debugLog("ℹ️", "No auth form found on this page");
}

/* ======================
   UI HELPERS (GLOBAL)
====================== */
window.updateLoggedInUI = function updateLoggedInUI(user) {
  debugLog("🎨", "Updating UI for logged-in user:", user.username);
  
  const profileIcon = document.getElementById("profileIcon");
  if (profileIcon) {
    profileIcon.src = user.avatar || profileIcon.src;
    profileIcon.title = user.username;
  }

  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  
  if (loginBtn) loginBtn.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "block";
};

window.updateLoggedOutUI = function updateLoggedOutUI() {
  debugLog("🎨", "Updating UI for logged-out state");
  
  const profileIcon = document.getElementById("profileIcon");
  if (profileIcon) {
    profileIcon.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
    profileIcon.title = "Login / Signup";
  }

  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  
  if (loginBtn) loginBtn.style.display = "block";
  if (logoutBtn) logoutBtn.style.display = "none";
};

/* ======================
   GLOBAL LOGOUT HANDLER
====================== */
window.handleLogout = async function handleLogout() {
  debugLog("🚪", "Logging out...");
  
  try {
    const res = await fetch(`${API_BASE}/api/users/logout`, {
      method: "POST",
      credentials: "include"
    });

    if (!res.ok) {
      debugLog("❌", "Logout request failed");
    } else {
      debugLog("✅", "Logout request successful");
    }
  } catch (err) {
    debugLog("❌", "Logout error:", err.message);
  } finally {
    window.currentUser = null;
    window.authResolved = false;
    updateLoggedOutUI();
    
    debugLog("✅", "Logged out, redirecting...");
    window.location.href = "/html/login.html";
  }
};

/* ======================
   AUTO-LOAD USER ON PAGE LOAD
====================== */
document.addEventListener("DOMContentLoaded", async () => {
  debugLog("🚀", "DOM loaded, checking authentication...");
  debugLog("📍", "Current page:", window.location.pathname);
  
  // Don't auto-load on login/signup pages
  if (window.location.pathname.includes("login") || 
      window.location.pathname.includes("signup")) {
    debugLog("📍", "On auth page, skipping auto-load");
    window.authResolved = true;
    return;
  }
  
  // Load user data
  await loadCurrentUser();
  
  debugLog("✅", "Auth check complete");
});

debugLog("✅", "auth.js initialization complete");
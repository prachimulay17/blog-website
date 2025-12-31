console.log("✅ navbar.js loaded");

//const API_BASE = window.API_BASE || "http://localhost:8000";

/* ======================
   HAMBURGER MENU
====================== */
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

if (hamburger && navLinks) {
  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("active");
    console.log("🍔 Hamburger menu toggled");
  });
}

/* ======================
   AUTH MODAL
====================== */
const authModal = document.getElementById("authModal");
const closeAuth = document.getElementById("closeAuth");

if (closeAuth && authModal) {
  closeAuth.addEventListener("click", () => {
    authModal.classList.add("hidden");
    console.log("❌ Auth modal closed");
  });
}

if (authModal) {
  authModal.addEventListener("click", (e) => {
    if (e.target === authModal) {
      authModal.classList.add("hidden");
      console.log("❌ Auth modal closed (outside click)");
    }
  });
}

/* ======================
   PROFILE ICON CLICK
   - If logged in: Go to profile page
   - If logged out: Show auth modal
====================== */
const profileIcon = document.getElementById("profileIcon");

if (profileIcon) {
  profileIcon.addEventListener("click", async () => {
    console.log("👤 Profile icon clicked");

    // Wait for auth to be resolved if not yet
    if (!window.authResolved) {
      console.log("⏳ Waiting for auth to resolve...");
      await new Promise((resolve) => {
        const check = () => {
          if (window.authResolved) {
            resolve();
          } else {
            requestAnimationFrame(check);
          }
        };
        check();
      });
    }

    // Check if user is logged in
    if (window.currentUser) {
      console.log("✅ User logged in, redirecting to profile page");
      // Redirect to profile page
      window.location.href = "/html/profile.html";
    } else {
      console.log("❌ User not logged in, showing auth modal");
      // Show auth modal for login/signup
      if (authModal) {
        authModal.classList.remove("hidden");
      } else {
        // If no auth modal exists, redirect to login page
        console.log("⚠️ No auth modal found, redirecting to login page");
        window.location.href = "/html/login.html";
      }
    }
  });
}

/* ======================
   LOGOUT FUNCTION
====================== */
async function logout() {
  console.log("🚪 Logout function called");
  
  try {
    const res = await fetch(`${API_BASE}/api/users/logout`, {
      method: "POST",
      credentials: "include"
    });

    if (!res.ok) {
      console.error("❌ Logout failed:", res.status);
    } else {
      console.log("✅ Logout successful");
    }
  } catch (err) {
    console.error("❌ Logout error:", err);
  } finally {
    // Clear cached auth state
    window.currentUser = null;
    window.authResolved = false;

    // Update UI to logged-out state
    if (typeof window.updateLoggedOutUI === "function") {
      window.updateLoggedOutUI();
    }

    console.log("🔀 Redirecting to home page...");
    // Redirect to home page
    window.location.href = "/html/index.html";
  }
}

// Make logout available globally
window.logout = logout;

/* ======================
   UPDATE NAV FOR AUTH STATE
====================== */
function updateNavForAuthState() {
  if (!window.authResolved) return;

  const profileIcon = document.getElementById("profileIcon");
  
  if (window.currentUser) {
    console.log("🎨 Updating navbar for logged-in user:", window.currentUser.username);
    
    // Update profile icon
    if (profileIcon) {
      profileIcon.src = window.currentUser.avatar || profileIcon.src;
      profileIcon.title = `${window.currentUser.username} - View Profile`;
      profileIcon.style.cursor = "pointer";
    }
  } else {
    console.log("🎨 Updating navbar for logged-out user");
    
    // Reset profile icon
    if (profileIcon) {
      profileIcon.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
      profileIcon.title = "Login / Signup";
      profileIcon.style.cursor = "pointer";
    }
  }
}

/* ======================
   LISTEN FOR AUTH CHANGES
====================== */
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 navbar.js DOM loaded");

  // Wait for auth resolution and update navbar
  const waitForAuth = setInterval(() => {
    if (window.authResolved) {
      clearInterval(waitForAuth);
      updateNavForAuthState();
    }
  }, 100);

  // Timeout after 5 seconds
  setTimeout(() => {
    clearInterval(waitForAuth);
    console.log("⏰ Auth wait timeout");
  }, 5000);
});

// Also update navbar whenever auth state changes
if (typeof window.addEventListener !== 'undefined') {
  window.addEventListener('user-logged-in', updateNavForAuthState);
  window.addEventListener('user-logged-out', updateNavForAuthState);
}

console.log("✅ navbar.js initialized");
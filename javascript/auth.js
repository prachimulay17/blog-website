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

window.loadCurrentUser = async function loadCurrentUser() {
  // Prevent multiple concurrent calls
  if (isLoadingUser) {
    return window.currentUser;
  }

  isLoadingUser = true;

  try {
    const res = await fetch(`${API_BASE}/api/users/me`, {
      credentials: "include"
    });

    if (res.status === 401) {
      // 401 means logged out - this is expected behavior, not an error
      window.currentUser = null;
      updateLoggedOutUI();
      return null;
    }

    if (!res.ok) {
      // Other non-401 errors should still be logged
      console.error(`loadCurrentUser failed with status ${res.status}`);
      window.currentUser = null;
      updateLoggedOutUI();
      return null;
    }

    const data = await res.json();
    window.currentUser = data.data;
    updateLoggedInUI(window.currentUser);
    return window.currentUser;
  } catch (err) {
    // Network errors, etc.
    console.error("loadCurrentUser network error", err);
    window.currentUser = null;
    updateLoggedOutUI();
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

      // success
      document.getElementById("authModal").classList.add("hidden");
      await loadCurrentUser();
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

      document.getElementById("authModal").classList.add("hidden");
      await loadCurrentUser();
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

document.addEventListener("DOMContentLoaded", () => {
  loadCurrentUser();
});


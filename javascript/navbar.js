const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

if (hamburger && navLinks) {
  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

// Auth modal open/close
const profileIcon = document.getElementById("profileIcon");
const authModal = document.getElementById("authModal");
const closeAuth = document.getElementById("closeAuth");

if (profileIcon && authModal) {
  profileIcon.addEventListener("click", () => {
    authModal.classList.remove("hidden");
  });
}

if (closeAuth && authModal) {
  closeAuth.addEventListener("click", () => {
    authModal.classList.add("hidden");
  });
}

if (authModal) {
  authModal.addEventListener("click", (e) => {
    if (e.target === authModal) {
      authModal.classList.add("hidden");
    }
  });
}

async function logout() {
  await fetch(`${API_BASE}/api/users/logout`, {
    method: "POST",
    credentials: "include"
  });

  // Refresh auth state after logout
  await loadCurrentUser();
}

// Profile icon behavior on navbar for logged in users
profileIcon.addEventListener("click", async () => {
  // Use global auth state instead of making another API call
  if (window.currentUser) {
    window.location.href = "/html/profile.html";
  } else {
    authModal.classList.remove("hidden");
  }
});


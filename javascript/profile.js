console.log("✅ profile.js loaded");

/* ======================
   CONFIGURATION
====================== */
const API_BASE = window.API_BASE || "http://localhost:8000";

/* ======================
   WAIT FOR AUTH HELPER
====================== */
function waitForAuth() {
  return new Promise((resolve) => {
    const check = () => {
      if (window.authResolved) {
        console.log("✅ Auth resolved, continuing...");
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    };
    check();
  });
}

/* ======================
   PROFILE PAGE SCRIPT
   Safe & defensive
====================== */

// This file should ONLY do anything if profile page exists
const profilePage = document.getElementById("profilePage");
const loginPage = document.getElementById("loginPage");

// If this page is not profile-related, exit silently
if (!profilePage && !loginPage) {
  console.warn("⚠️ profile.js loaded on non-profile page, skipping");
} else {
  console.log("📄 Profile page detected, initializing...");

  /* ======================
     DOM ELEMENTS
  ====================== */
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const profileAvatar = document.getElementById("profilePic");

  const logoutBtn = document.getElementById("logoutBtn");

  const editBtn = document.getElementById("editBtn");
  const editForm = document.getElementById("editForm");
  const editUsername = document.getElementById("editUsername");
  const editEmail = document.getElementById("editEmail");
  const editAvatar = document.getElementById("editAvatar");
  const cancelBtn = document.getElementById("cancelBtn");

  const avatarInput = document.getElementById("avatarInput");

  /* ======================
     UI HELPERS
  ====================== */
  function showProfile() {
    console.log("🎨 Showing profile page");
    if (loginPage) loginPage.style.display = "none";
    if (profilePage) profilePage.style.display = "block";
  }

  function showLogin() {
    console.log("🎨 Showing login page");
    if (loginPage) loginPage.style.display = "block";
    if (profilePage) profilePage.style.display = "none";
  }

  /* ======================
     POPULATE PROFILE
  ====================== */
  function populateProfile(user) {
    if (!user) {
      console.warn("⚠️ No user data to populate");
      return;
    }

    console.log("📝 Populating profile for:", user.username);

    if (profileName) profileName.textContent = user.username;
    if (profileEmail) profileEmail.textContent = user.email;
    if (profileAvatar) {
      profileAvatar.src = user.avatar || "/images/default-avatar.png";
    }

    loadUserBlogs(user._id);
  }

  /* ======================
     AUTH CHECK (BOOTSTRAP)
  ====================== */
  document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Profile page DOM loaded");

    try {
      // Wait for auth to complete (auth.js handles the loading)
      await waitForAuth();

      const user = window.currentUser;

      if (!user) {
        console.log("❌ No user found, showing login");
        showLogin();
        return;
      }

      console.log("✅ User authenticated:", user.username);
      showProfile();
      populateProfile(user);
    } catch (err) {
      console.error("❌ Error during auth check:", err);
      showLogin();
    }
  });

  /* ======================
     FETCH USER BLOGS
  ====================== */
  async function loadUserBlogs(userId) {
    const container = document.getElementById("userBlogs");
    if (!container) {
      console.warn("⚠️ Blogs container not found");
      return;
    }

    console.log("📚 Loading blogs for user:", userId);

    const title = container.querySelector(".blogs-title");

    try {
      // Use fetchWithAuth if available, otherwise regular fetch
      const fetchFunc = window.fetchWithAuth || fetch;
      
      const res = await fetchFunc(`${API_BASE}/api/blogs/user/${userId}`, {
        method: "GET",
        credentials: "include"
      });

      if (!res.ok) {
        throw new Error(`Failed to load blogs: ${res.status}`);
      }

      const { data } = await res.json();

      // Clear container but keep title
      container.innerHTML = "";
      if (title) container.appendChild(title);

      if (!data || !data.length) {
        console.log("📭 No blogs found");
        const msg = document.createElement("p");
        msg.className = "no-blogs-message";
        msg.textContent = "You haven't written any blogs yet.";
        msg.style.textAlign = "center";
        msg.style.color = "#5E548E";
        msg.style.padding = "20px 0";
        container.appendChild(msg);
        return;
      }

      console.log(`✅ Loaded ${data.length} blogs`);

      // Create blog items securely
      data.forEach(blog => {
        const div = document.createElement("div");
        div.className = "blog-item";

        const h4 = document.createElement("h4");
        h4.textContent = blog.title;

        const btn = document.createElement("button");
        btn.textContent = "Edit";
        btn.addEventListener("click", () => {
          window.location.href = `/html/write.html?editId=${blog._id}`;
        });

        div.appendChild(h4);
        div.appendChild(btn);
        container.appendChild(div);
      });
    } catch (err) {
      console.error("❌ Error loading blogs:", err);
      
      container.innerHTML = "";
      if (title) container.appendChild(title);
      
      const errorMsg = document.createElement("p");
      errorMsg.className = "error-message";
      errorMsg.textContent = "Error loading blogs. Please try again.";
      errorMsg.style.textAlign = "center";
      errorMsg.style.color = "#d32f2f";
      errorMsg.style.padding = "20px 0";
      container.appendChild(errorMsg);
    }
  }

  /* ======================
     AVATAR PREVIEW (EDIT)
  ====================== */
  editAvatar?.addEventListener("change", () => {
    const file = editAvatar.files[0];
    if (!file) return;

    console.log("🖼️ Avatar preview selected");

    // Revoke previous URL to prevent memory leak
    if (profileAvatar && profileAvatar.dataset.objectUrl) {
      URL.revokeObjectURL(profileAvatar.dataset.objectUrl);
    }

    const url = URL.createObjectURL(file);
    if (profileAvatar) {
      profileAvatar.dataset.objectUrl = url;
      profileAvatar.src = url;
    }
  });

  /* ======================
     AVATAR UPLOAD (DIRECT)
  ====================== */
  avatarInput?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log("📤 Uploading avatar directly...");

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const fetchFunc = window.fetchWithAuth || fetch;
      
      const res = await fetchFunc(`${API_BASE}/api/users/avatar`, {
        method: "PATCH",
        body: formData,
        credentials: "include"
      });

      const data = await res.json();
      
      if (res.ok) {
        console.log("✅ Avatar uploaded successfully");
        if (profileAvatar) {
          profileAvatar.src = data.data.avatar;
        }
        
        // Update global user state
        if (window.currentUser) {
          window.currentUser.avatar = data.data.avatar;
        }
      } else {
        console.error("❌ Avatar upload failed:", data.message);
        alert(data.message || "Avatar upload failed");
      }
    } catch (err) {
      console.error("❌ Avatar upload error:", err);
      alert("Failed to upload avatar. Please try again.");
    }
  });

  /* ======================
     EDIT PROFILE TOGGLE
  ====================== */
  editBtn?.addEventListener("click", () => {
    console.log("✏️ Edit mode activated");
    
    if (editForm) editForm.style.display = "block";
    if (editBtn) editBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none"; // Hide logout during edit

    if (editUsername && profileName) {
      editUsername.value = profileName.textContent;
    }
    if (editEmail && profileEmail) {
      editEmail.value = profileEmail.textContent;
    }
  });

  cancelBtn?.addEventListener("click", () => {
    console.log("❌ Edit cancelled");
    
    if (editForm) editForm.style.display = "none";
    if (editBtn) editBtn.style.display = "";
    if (logoutBtn) logoutBtn.style.display = ""; // Show logout again

    // Clear file input
    if (editAvatar) editAvatar.value = "";

    // Revoke object URL if exists
    if (profileAvatar && profileAvatar.dataset.objectUrl) {
      URL.revokeObjectURL(profileAvatar.dataset.objectUrl);
      delete profileAvatar.dataset.objectUrl;
    }
  });

  /* ======================
     UPDATE PROFILE
  ====================== */
  editForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    console.log("💾 Saving profile changes...");

    // Get save button for loading state
    const saveBtn = editForm.querySelector(".save-btn");
    const originalText = saveBtn ? saveBtn.textContent : "Save";
    
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
    }
    if (cancelBtn) cancelBtn.disabled = true;

    try {
      const formData = new FormData();
      formData.append("username", editUsername.value.trim());
      formData.append("email", editEmail.value.trim());

      if (editAvatar.files[0]) {
        formData.append("avatar", editAvatar.files[0]);
      }

      const fetchFunc = window.fetchWithAuth || fetch;
      
      const res = await fetchFunc(`${API_BASE}/api/users/update`, {
        method: "PATCH",
        body: formData,
        credentials: "include"
      });

      const result = await res.json();
      
      if (!res.ok) {
        console.error("❌ Profile update failed:", result.message);
        alert(result.message || "Update failed");
        return;
      }

      console.log("✅ Profile updated successfully");

      // Update UI with new data
      populateProfile(result.data);
      
      // Update global user state
      window.currentUser = result.data;

      // Clean up object URL
      if (profileAvatar && profileAvatar.dataset.objectUrl) {
        URL.revokeObjectURL(profileAvatar.dataset.objectUrl);
        delete profileAvatar.dataset.objectUrl;
      }

      // Hide form and show edit button
      if (editForm) editForm.style.display = "none";
      if (editBtn) editBtn.style.display = "";
      if (logoutBtn) logoutBtn.style.display = ""; // Show logout again
      
      // Clear file input
      if (editAvatar) editAvatar.value = "";

      alert("Profile updated successfully!");
    } catch (err) {
      console.error("❌ Profile update error:", err);
      alert("Failed to update profile. Please try again.");
    } finally {
      // Re-enable buttons
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
      }
      if (cancelBtn) cancelBtn.disabled = false;
    }
  });

  /* ======================
     LOGOUT
  ====================== */
  logoutBtn?.addEventListener("click", async () => {
    console.log("🚪 Logout button clicked");
    
    // Disable logout button to prevent double clicks
    if (logoutBtn) logoutBtn.disabled = true;
    
    // Use global logout handler from auth.js
    if (typeof window.handleLogout === "function") {
      console.log("🔄 Using global logout handler");
      await window.handleLogout();
    } else {
      // Fallback if auth.js not loaded
      console.warn("⚠️ Global logout handler not found, using fallback");
      
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
        window.currentUser = null;
        window.authResolved = false;
        console.log("🔀 Redirecting to login page...");
        window.location.href = "/html/login.html";
      }
    }
  });

  console.log("✅ Profile.js initialized successfully");
}

/* ======================
   EXPORT FOR DEBUGGING
====================== */
if (typeof window !== 'undefined') {
  window.profileDebug = {
    showProfile,
    showLogin,
    populateProfile: (user) => {
      if (typeof populateProfile === 'function') {
        populateProfile(user);
      }
    }
  };
}
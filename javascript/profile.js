

/* ======================
   DOM ELEMENTS
====================== */
const loginPage = document.getElementById("loginPage");
const profilePage = document.getElementById("profilePage");

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
  if (loginPage) loginPage.style.display = "none";
  if (profilePage) profilePage.style.display = "block";
}

function showLogin() {
  if (loginPage) loginPage.style.display = "block";
  if (profilePage) profilePage.style.display = "none";
}

/* ======================
   POPULATE PROFILE
====================== */
function populateProfile(user) {
  profileName.textContent = user.username;
  profileEmail.textContent = user.email;
  profileAvatar.src = user.avatar || "/images/default-avatar.png";
  console.log("current img src:", user.avatar);
  console.log("current img src:", profileAvatar.src);

  loadUserBlogs(user._id);
}


document.addEventListener("DOMContentLoaded", async () => {
  const user = await window.loadCurrentUser();

  if (!user) {
    showLogin();
    return;
  }

  showProfile();
  populateProfile(user);
});


/* ======================
   FETCH USER BLOGS
====================== */
async function loadUserBlogs(userId) {
  const container = document.getElementById("userBlogs");
  const title = container.querySelector(".blogs-title");

  try {
    const res = await fetch(`${API_BASE}/api/blogs/user/${userId}`, {
      method:"GET",
      credentials: "include"
    });

    if (!res.ok) {
      throw new Error("Failed to load blogs");
    }

    const { data } = await res.json();

    // Clear existing content but keep title
    container.innerHTML = "";
    if (title) container.appendChild(title);

    if (!data || !data.length) {
      const emptyMsg = document.createElement("p");
      emptyMsg.className = "no-blogs-message";
      emptyMsg.textContent = "You haven't written any blogs yet.";
      emptyMsg.style.textAlign = "center";
      emptyMsg.style.color = "#5E548E";
      emptyMsg.style.padding = "20px 0";
      container.appendChild(emptyMsg);
      return;
    }

    // Create blog items securely (no innerHTML to prevent XSS)
    data.forEach((blog) => {
      const div = document.createElement("div");
      div.className = "blog-item";

      const h4 = document.createElement("h4");
      h4.textContent = blog.title; // textContent auto-escapes HTML

      const btn = document.createElement("button");
      btn.textContent = "Edit";
      btn.addEventListener("click", () => editBlog(blog._id));

      div.appendChild(h4);
      div.appendChild(btn);
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading blogs:", err);
    container.innerHTML = "";
    if (title) container.appendChild(title);
    
    const errorMsg = document.createElement("p");
    errorMsg.className = "error-message";
    errorMsg.textContent = "Error loading blogs. Please try again later.";
    errorMsg.style.textAlign = "center";
    errorMsg.style.color = "#d32f2f";
    errorMsg.style.padding = "20px 0";
    container.appendChild(errorMsg);
  }
}

function editBlog(id) {
  window.location.href = `/html/write.html?editId=${id}`;
}

/* ======================
   AVATAR PREVIEW (EDIT)
====================== */
editAvatar?.addEventListener("change", () => {
  const file = editAvatar.files[0];
  if (!file) return;

  // Revoke previous object URL to prevent memory leak
  if (profileAvatar.dataset.objectUrl) {
    URL.revokeObjectURL(profileAvatar.dataset.objectUrl);
  }

  const previewURL = URL.createObjectURL(file);
  profileAvatar.dataset.objectUrl = previewURL;
  profileAvatar.src = previewURL;
});

/* ======================
   AVATAR UPLOAD (DIRECT)
====================== */
avatarInput?.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("avatar", file);

  try {
    const res = await fetch(`${API_BASE}/api/users/avatar`, {
      method: "PATCH",
      body: formData,
      credentials: "include"
    });

    const data = await res.json();

    if (res.ok) {
      profileAvatar.src = data.data.avatar;
    } else {
      alert(data.message || "Avatar upload failed");
    }
  } catch (err) {
    console.error("Avatar upload error:", err);
    alert("Failed to upload avatar. Please try again.");
  }
});

/* ======================
   EDIT PROFILE TOGGLE
====================== */
editBtn?.addEventListener("click", () => {
  editForm.style.display = "block";
  editBtn.style.display = "none";

  editUsername.value = profileName.textContent;
  editEmail.value = profileEmail.textContent;
});

cancelBtn?.addEventListener("click", () => {
  editForm.style.display = "none";
  editBtn.style.display = "";

  // Clear file input
  if (editAvatar) editAvatar.value = "";
  
  // Revoke object URL if exists
  if (profileAvatar.dataset.objectUrl) {
    URL.revokeObjectURL(profileAvatar.dataset.objectUrl);
    delete profileAvatar.dataset.objectUrl;
  }
});

/* ======================
   UPDATE PROFILE
====================== */
editForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Disable buttons during submission
  const saveBtn = editForm.querySelector(".save-btn");
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";
  cancelBtn.disabled = true;

  try {
    const formData = new FormData();
    formData.append("username", editUsername.value);
    formData.append("email", editEmail.value);

    if (editAvatar.files[0]) {
      formData.append("avatar", editAvatar.files[0]);
    }

    const res = await fetch(`${API_BASE}/api/users/update`, {
      method: "PATCH",
      credentials: "include",
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Update failed");
      return;
    }

    // Update UI with new data
    profileName.textContent = data.data.username;
    profileEmail.textContent = data.data.email;
    profileAvatar.src = data.data.avatar || profileAvatar.src;

    // Clean up object URL
    if (profileAvatar.dataset.objectUrl) {
      URL.revokeObjectURL(profileAvatar.dataset.objectUrl);
      delete profileAvatar.dataset.objectUrl;
    }

    // Hide form and show edit button
    editForm.style.display = "none";
    editBtn.style.display = "";
    
    // Clear file input
    if (editAvatar) editAvatar.value = "";
  } catch (err) {
    console.error("Profile update error:", err);
    alert("Failed to update profile. Please try again.");
  } finally {
    // Re-enable buttons
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
    cancelBtn.disabled = false;
  }
});

/* ======================
   LOGOUT
====================== */
logoutBtn?.addEventListener("click", async () => {
  try {
    const res = await fetch(`${API_BASE}/api/users/logout`, {
      method: "POST",
      credentials: "include"
    });

    if (!res.ok) {
      console.error("Logout request failed");
    }
  } catch (err) {
    console.error("Logout error:", err);
  } finally {
    // Always redirect to login, even if API fails
    // Clear any cached data
    if (profileAvatar.dataset.objectUrl) {
      URL.revokeObjectURL(profileAvatar.dataset.objectUrl);
    }
    
    // Redirect to login page
    window.location.href = "/html/index.html";
    alert("user logged out successfully");
  }
});
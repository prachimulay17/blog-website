const API_BASE = "http://localhost:8000";

// Elements for auth state management
const signInSection = document.querySelector(".sign-in-section");
const profilePage = document.querySelector(".profile-page");
const logoutBtn = document.getElementById("logoutBtn");

/* =========================
   LOAD PROFILE (PROTECTED)
========================= */
async function loadProfile() {
  try {
    // 1️⃣ Get logged-in user
    const meRes = await fetch(`${API_BASE}/api/users/me`, {
      credentials: "include"
    });

    if (!meRes.ok) {
      // ❌ Not logged in - show sign-in section, hide profile page
      if (signInSection) signInSection.style.display = "block";
      if (profilePage) profilePage.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "none";
      return;
    }

    // ✅ Logged in - show profile page, hide sign-in section
    if (signInSection) signInSection.style.display = "none";
    if (profilePage) profilePage.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "block";

    const { data: user } = await meRes.json();

    // Update profile info
    const profileAvatar = document.getElementById("profileAvatar");
    const profileUsername = document.getElementById("profileUsername");
    const profileBio = document.getElementById("profileBio");
    const profileEmail = document.getElementById("profileEmail");

    if (profileAvatar) profileAvatar.src = user.avatar || "https://cdn-icons-png.flaticon.com/512/847/847969.png";
    if (profileUsername) profileUsername.textContent = user.username;
    if (profileBio) profileBio.textContent = user.bio || "";
    if (profileEmail) profileEmail.textContent = user.email;

    // 2️⃣ Fetch user's blogs
    const blogsRes = await fetch(`${API_BASE}/api/blogs/my`, {
      credentials: "include"
    });

    if (blogsRes.ok) {
      const blogsData = await blogsRes.json();
      renderMyBlogs(blogsData.data || []);
    } else {
      renderMyBlogs([]);
    }

  } catch (err) {
    console.error("Profile load error:", err);
    // On error, show sign-in section
    if (signInSection) signInSection.style.display = "block";
    if (profilePage) profilePage.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
}

function renderMyBlogs(blogs) {
  const container = document.getElementById("myBlogs");
  container.innerHTML = "";

  if (!blogs.length) {
    container.innerHTML = "<p>You haven’t written any blogs yet.</p>";
    return;
  }

  blogs.forEach(blog => {
    const div = document.createElement("div");
    div.className = "my-blog-card";

    div.innerHTML = `
      <h4>${blog.title}</h4>
      <p>${blog.content.slice(0, 120)}...</p>
      <a href="/html/post.html?id=${blog._id}">View</a>
      <a href="/html/write.html?editId=${blog._id}">Edit</a>
      <button data-id="${blog._id}" class="delete-blog">Delete</button>
    `;

    container.appendChild(div);
  });
}

/* =========================
   LOGOUT
========================= */
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch(`${API_BASE}/api/users/logout`, {
        method: "POST",
        credentials: "include"
      });

      // Reload profile to show sign-in section
      loadProfile();
    } catch (err) {
      console.error("Logout error:", err);
    }
  });
}

/* =========================
   SIGN-IN FORM (in profile page)
========================= */
const classicLoginForm = document.getElementById("classicLoginForm");
if (classicLoginForm) {
  classicLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById("emailInput");
    const passwordInput = document.getElementById("passwordInput");

    try {
      const res = await fetch(`${API_BASE}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          identifier: emailInput.value,
          password: passwordInput.value
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // Success - reload profile to show logged-in state
      loadProfile();
    } catch (err) {
      console.error("Login error:", err);
      alert("Login error");
    }
  });
}

document.addEventListener("DOMContentLoaded", loadProfile);


//delete from profile page

document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("delete-blog")) return;

  const id = e.target.dataset.id;
  if (!confirm("Delete this blog?")) return;

  const res = await fetch(`${API_BASE}/api/blogs/${id}`, {
    method: "DELETE",
    credentials: "include"
  });

  if (res.ok) {
    loadProfile(); // refresh list
  } else {
    alert("Delete failed");
  }
});

const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

const authLinks = document.getElementById("authLinks");

const API_BASE = "http://localhost:8000";

/* =========================
   NAVBAR INTERACTIONS
========================= */

const profileIcon = document.getElementById("profileIcon");
const authModal = document.getElementById("authModal");
const closeAuth = document.getElementById("closeAuth");

// OPEN modal
profileIcon.addEventListener("click", () => {
  authModal.classList.remove("hidden");
});

// CLOSE modal

if (closeAuth && authModal) {
  closeAuth.addEventListener("click", () => {
    authModal.classList.add("hidden");
  });
}


// Close on backdrop click
if (authModal) {
  authModal.addEventListener("click", (e) => {
    if (e.target === authModal) {
      authModal.classList.add("hidden");
    }
  });
  
}

/* =========================
   AUTH MODE LOGIC (FIXED)
========================= */

let isSignup = false;

// Buttons & text
const switchModeBtn = document.getElementById("switchMode");
const switchText = document.getElementById("switchText");
const authTitle = document.getElementById("authTitle");
const authSubmitBtn = document.getElementById("authSubmitBtn");

// Login fields
const loginIdentifier = document.getElementById("loginIdentifier");

// Signup fields
const signupUsername = document.getElementById("signupUsername");
const signupEmail = document.getElementById("signupEmail");
const signupAvatar = document.getElementById("signupAvatar");
const signupBio = document.getElementById("signupBio");

// Common field
const authPassword = document.getElementById("authPassword");

const signupFields = [
  signupUsername,
  signupEmail,
  signupAvatar,
  signupBio
].filter(Boolean); // filter out nulls

function setAuthMode(signup) {
  isSignup = signup;

  if (loginIdentifier) {
    loginIdentifier.classList.toggle("hidden", isSignup);
  }

  signupFields.forEach(field => {
    field.classList.toggle("hidden", !isSignup);
  });

  if (authTitle) authTitle.textContent = isSignup ? "Signup" : "Login";
  if (authSubmitBtn) authSubmitBtn.textContent = isSignup ? "Signup" : "Login";
  if (switchText) {
    switchText.textContent = isSignup
      ? "Already have an account?"
      : "Don’t have an account?";
  }
  if (switchModeBtn) {
    switchModeBtn.textContent = isSignup ? "Login" : "Signup";
  }
}
setAuthMode(false);


// Toggle mode
if (setAuthMode && switchModeBtn) {
  switchModeBtn.addEventListener("click", () => {
    setAuthMode(!isSignup);
  });
}

// Prevent reload + debug output
const authForm = document.getElementById("authForm");
if (authForm) {
  authForm.addEventListener("submit", (e) => {
    e.preventDefault();
  
    if (isSignup) {
      console.log("SIGNUP DATA", {
        username: signupUsername.value,
        email: signupEmail.value,
        avatar: signupAvatar.files[0],
        bio: signupBio.value,
        password: authPassword.value
      });
    } else {
      console.log("LOGIN DATA", {
        identifier: loginIdentifier.value,
        password: authPassword.value
      });
    }
  });
}



/* =========================
   HELPERS
========================= */

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* =========================
   FETCH BLOGS FROM BACKEND
========================= */

async function fetchBlogs() {
  try {
    const res = await fetch(`${API_BASE}/api/blogs`);
    const result = await res.json();

    if (!res.ok) {
      console.error(result.message || "Failed to fetch blogs");
      return;
    }

    renderBlogs(result.data);
  } catch (err) {
    console.error("Failed to fetch blogs", err);
  }
}

/* =========================
   RENDER BLOG CARDS
========================= */

function renderBlogs(blogs) {
  const container = document.getElementById("postsContainer");
  if (!container) return;

  container.innerHTML = "";

  if (!blogs || blogs.length === 0) {
    container.innerHTML = "<p>No blogs found.</p>";
    return;
  }

  blogs.forEach((blog) => {
    const card = document.createElement("div");
    card.className = "blog-card";

    const preview = escapeHtml(blog.content).slice(0, 250);

    card.innerHTML = `
      <img src="${blog.coverImage || "/images/image.png"}" alt="Blog">
      <div class="content">
       <h2>${escapeHtml(blog.title)}</h2>
<p class="author">By ${escapeHtml(blog.author?.username || "Unknown")}</p>

        <p>${preview}${blog.content.length > 250 ? "..." : ""}</p>
        <a class="read-more" 
           href="../html/post.html?id=${blog._id}" 
           data-id="${blog._id}">
          Read More
        </a>
      </div>
    `;

    container.appendChild(card);
  });
}

/* =========================
   DELETE BLOG (AUTHOR ONLY)
========================= */

document.addEventListener("click", async (e) => {
  const target = e.target;

  if (target.classList.contains("delete-post")) {
    e.preventDefault();

    const blogId = target.getAttribute("data-id");
    if (!blogId) return;

    if (!confirm("Delete this post? This cannot be undone.")) return;

    try {
      const res = await fetch(`${API_BASE}/api/blogs/${blogId}`, {
        method: "DELETE",
        credentials: "include" // 🔐 cookie auth
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Not authorized to delete");
        return;
      }

      alert("Blog deleted successfully");
      fetchBlogs(); // refresh list
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete blog");
    }
  }
});

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", () => {
  fetchBlogs();
});



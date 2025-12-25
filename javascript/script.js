const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");
const profileIcon = document.getElementById("profileIcon");
const authLinks = document.getElementById("authLinks");

const API_BASE = "http://localhost:8000";

/* =========================
   NAVBAR INTERACTIONS
========================= */

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("active");
  if (!navLinks.classList.contains("active")) {
    if (authLinks) authLinks.classList.remove("active");
  }
});

document.addEventListener("click", (e) => {
  if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
    navLinks.classList.remove("active");
  }
  if (authLinks && !authLinks.contains(e.target) && !profileIcon.contains(e.target)) {
    authLinks.classList.remove("active");
  }
});

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
        <p>${preview}${blog.content.length > 250 ? "..." : ""}</p>
        <a class="read-more" 
           href="post.html?id=${blog._id}" 
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

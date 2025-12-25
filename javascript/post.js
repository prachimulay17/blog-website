const API_BASE = "http://localhost:8000";


// Parse query string to get `id`
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function renderPost() {
  const container = document.getElementById("postContainer");
  if (!container) return;

  const blogId = getQueryParam("id");
  if (!blogId) {
    container.innerHTML = "<p>No post id provided.</p>";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/blogs/${blogId}`);
    const data = await res.json();

    if (!res.ok) {
      container.innerHTML = "<p>Post not found.</p>";
      return;
    }

    const post = data.data;
    const created = new Date(post.createdAt).toLocaleString();
    const contentHtml = escapeHtml(post.content).replace(/\n/g, "<br>");

    container.innerHTML = `
      <article class="blog-card single-post-card">
        <div class="content">
          <h1>${escapeHtml(post.title)}</h1>
          <p class="meta">
            by ${escapeHtml(post.author.username)} · ${created}
          </p>

          <div class="post-actions">
            <a href="write.html?editId=${post._id}" class="edit-post">Edit</a>
            <a href="#" class="delete-post" data-id="${post._id}">Delete</a>
          </div>

          <div class="post-body">${contentHtml}</div>
        </div>
      </article>
    `;
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load post.</p>";
  }
}

document.addEventListener('DOMContentLoaded', renderPost);

// Handle delete from single post view
document.addEventListener("click", async (e) => {
  const t = e.target;
  if (!t || !t.classList) return;

  if (t.classList.contains("delete-post")) {
    e.preventDefault();

    const blogId = t.getAttribute("data-id");
    if (!blogId) return;

    if (!confirm("Delete this post? This cannot be undone.")) return;

    try {
      const res = await fetch(`${API_BASE}/api/blogs/${blogId}`, {
        method: "DELETE",
        credentials: "include" // 🔥 REQUIRED (auth)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Not allowed to delete this post");
        return;
      }

      alert("Post deleted successfully");
      window.location.href = "index.html";
    } catch (err) {
      console.error(err);
      alert("Failed to delete post.");
    }
  }
});


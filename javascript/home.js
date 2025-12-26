function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function fetchBlogs() {
  try {
    const res = await fetch(`${API_BASE}/api/blogs`);
    const result = await res.json();

    if (!res.ok) return;

    renderBlogs(result.data);
  } catch (err) {
    console.error(err);
  }
}

function renderBlogs(blogs) {
  const container = document.getElementById("postsContainer");
  if (!container) return;

  container.innerHTML = "";

  blogs.forEach(blog => {
    const card = document.createElement("div");
    card.className = "blog-card";

    card.innerHTML = `
      <img src="${blog.coverImage || "/images/image.png"}">
      <div class="content">
        <h2>${escapeHtml(blog.title)}</h2>
        <p class="author">By ${escapeHtml(blog.author?.username || "Unknown")}</p>
        <p>${escapeHtml(blog.content).slice(0, 250)}...</p>
        <a class="read-more" href="../html/post.html?id=${blog._id}">
          Read More
        </a>
      </div>
    `;

    container.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", fetchBlogs);


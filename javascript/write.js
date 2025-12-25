const API_BASE = "http://localhost:8000";

// elements (MATCH YOUR HTML)
const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const postBtn = document.getElementById("postBtn");

// check edit mode
const params = new URLSearchParams(window.location.search);
const editId = params.get("editId");

/* =========================
   LOAD BLOG FOR EDIT
========================= */

async function loadBlogForEdit() {
  if (!editId) return;

  try {
    const res = await fetch(`${API_BASE}/api/blogs/${editId}`, {
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to load blog");
      return;
    }

    const blog = data.data;
    titleInput.value = blog.title;
    contentInput.value = blog.content;

    postBtn.textContent = "Update";
  } catch (err) {
    console.error(err);
    alert("Error loading blog");
  }
}

/* =========================
   CREATE / UPDATE BLOG
========================= */

postBtn.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!title || !content) {
    alert("Title and content are required");
    return;
  }

  const formData = new FormData();
  formData.append("title", title);
  formData.append("content", content);
  // coverImage optional
  // formData.append("coverImage", fileInput.files[0]);

  const isEdit = Boolean(editId);
  const url = isEdit
    ? `${API_BASE}/api/blogs/${editId}`
    : `${API_BASE}/api/blogs`;

  const method = isEdit ? "PATCH" : "POST";

  try {
    const res = await fetch(url, {
      method,
      credentials: "include", // 🔐 REQUIRED
      body: formData          // 🔥 REQUIRED
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to save blog");
      return;
    }

    alert(isEdit ? "Blog updated successfully" : "Blog published successfully");
    window.location.href = "index.html";
  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
});


/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", () => {
  loadBlogForEdit();
});

const API_BASE = "http://localhost:8000";


console.log("write.js loaded");

const form = document.getElementById("writeForm");
console.log("FORM:", form);

// elements

const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const coverInput = document.getElementById("coverImage");
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

    postBtn.textContent = "Update Blog";
  } catch (err) {
    console.error(err);
    alert("Error loading blog");
  }
}


document.addEventListener("DOMContentLoaded", loadBlogForEdit);
/* =========================
   CREATE / UPDATE BLOG
========================= */


form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (title.length < 3) {
    alert("Title must be at least 3 characters long");
    return;
  }

  const formData = new FormData(form);

  try {
    const res = await fetch(`${API_BASE}/api/blogs`, {
      method: "POST",
      credentials: "include",
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to publish blog");
      return;
    }

    alert("Blog published successfully");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 300);

  } catch (err) {
    console.error("FETCH ERROR:", err);
    alert("Network error");
  }
});



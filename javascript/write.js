console.log("✅ write.js loaded");

const API_BASE = window.API_BASE || "https://blog-website-3jb5.onrender.com";

/* ======================
   DOM ELEMENTS
====================== */
const form = document.getElementById("writeForm");
const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const coverInput = document.getElementById("coverImage");
const postBtn = document.getElementById("postBtn");

console.log("📋 Form elements:", {
  form: !!form,
  titleInput: !!titleInput,
  contentInput: !!contentInput,
  coverInput: !!coverInput,
  postBtn: !!postBtn
});

/* ======================
   CHECK EDIT MODE
====================== */
const params = new URLSearchParams(window.location.search);
const editId = params.get("editId");

if (editId) {
  console.log("✏️ Edit mode - Blog ID:", editId);
} else {
  console.log("📝 Create mode - New blog");
}

/* ======================
   LOAD BLOG FOR EDIT
====================== */
async function loadBlogForEdit() {
  if (!editId) {
    console.log("ℹ️ Not in edit mode, skipping blog load");
    return;
  }

  console.log("🔍 Loading blog for edit:", editId);

  try {
    const fetchFunc = window.fetchWithAuth || fetch;
    
    const res = await fetchFunc(`${API_BASE}/api/blogs/${editId}`, {
      method: "GET",
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Failed to load blog:", data.message);
      alert(data.message || "Failed to load blog");
      return;
    }

    const blog = data.data;
    console.log("✅ Blog loaded:", blog.title);

    // Populate form
    if (titleInput) titleInput.value = blog.title;
    if (contentInput) contentInput.value = blog.content;
    if (postBtn) postBtn.textContent = "Update Blog";

    console.log("📝 Form populated with blog data");
  } catch (err) {
    console.error("❌ Error loading blog:", err);
    alert("Error loading blog. Please try again.");
  }
}

/* ======================
   WAIT FOR AUTH AND LOAD
====================== */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 write.js DOM loaded");

  // Wait for auth if needed
  if (typeof window.authResolved !== 'undefined' && !window.authResolved) {
    console.log("⏳ Waiting for auth...");
    await new Promise((resolve) => {
      const check = () => {
        if (window.authResolved) {
          resolve();
        } else {
          requestAnimationFrame(check);
        }
      };
      check();
    });
  }

  // Check if user is logged in
  if (!window.currentUser) {
    console.log("❌ User not logged in, redirecting...");
    alert("Please login to write a blog");
    window.location.href = "/html/login.html";
    return;
  }

  console.log("✅ User authenticated:", window.currentUser.username);

  // Load blog if in edit mode
  await loadBlogForEdit();
});

/* ======================
   CREATE / UPDATE BLOG
====================== */
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    console.log("📤 Form submitted");

    const title = titleInput ? titleInput.value.trim() : "";
    const content = contentInput ? contentInput.value.trim() : "";

    console.log("📋 Form data:", {
      title: title.substring(0, 50) + "...",
      contentLength: content.length,
      hasCoverImage: coverInput && coverInput.files.length > 0,
      editMode: !!editId
    });

    // Validation
    if (title.length < 3) {
      alert("Title must be at least 3 characters long");
      console.log("❌ Validation failed: Title too short");
      return;
    }

    if (content.length < 10) {
      alert("Content must be at least 10 characters long");
      console.log("❌ Validation failed: Content too short");
      return;
    }

    // Disable button during submission
    if (postBtn) {
      postBtn.disabled = true;
      postBtn.textContent = editId ? "Updating..." : "Publishing...";
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);

      // Add cover image if selected
      if (coverInput && coverInput.files[0]) {
        formData.append("coverImage", coverInput.files[0]);
        console.log("🖼️ Cover image attached:", coverInput.files[0].name);
      }

      // Determine URL and method based on edit mode
      const url = editId 
        ? `${API_BASE}/api/blogs/${editId}` 
        : `${API_BASE}/api/blogs`;
      
      const method = editId ? "PATCH" : "POST";

      console.log(`📡 Sending ${method} request to:`, url);

      const fetchFunc = window.fetchWithAuth || fetch;

      const res = await fetchFunc(url, {
        method: method,
        credentials: "include",
        body: formData
      });

      console.log("📥 Response status:", res.status);

      const data = await res.json();
      console.log("📦 Response data:", data);

      if (!res.ok) {
        console.error("❌ Request failed:", data.message);
        alert(data.message || `Failed to ${editId ? "update" : "publish"} blog`);
        return;
      }

      console.log(`✅ Blog ${editId ? "updated" : "published"} successfully`);

      // Success message
      const message = editId 
        ? "Blog updated successfully!" 
        : "Blog published successfully!";
      
      alert(message);

      // Redirect after short delay
      setTimeout(() => {
        console.log("🔀 Redirecting to home page...");
        window.location.href = "/html/index.html";
      }, 500);

    } catch (err) {
      console.error("❌ Network error:", err);
      alert("Network error. Please check your connection and try again.");
    } finally {
      // Re-enable button
      if (postBtn) {
        postBtn.disabled = false;
        postBtn.textContent = editId ? "Update Blog" : "Post Blog";
      }
    }
  });
} else {
  console.error("❌ Form element not found!");
}

console.log("✅ write.js initialized");
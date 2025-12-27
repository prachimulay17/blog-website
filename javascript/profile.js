const API_BASE = "http://localhost:8000";

/* ======================
   LOAD CURRENT USER
====================== */
async function loadProfile() {
  const res = await fetch(`${API_BASE}/api/users/me`, {
    credentials: "include"
  });

  if (!res.ok) return;

  const { data } = await res.json();

  document.getElementById("profileName").textContent = data.username;
  document.getElementById("profileEmail").textContent = data.email;
  document.getElementById("profileAvatar").src =
    data.avatar || "/images/default-avatar.png";

  loadUserBlogs(data._id);
}

/* ======================
   FETCH USER BLOGS
====================== */
async function loadUserBlogs(userId) {
  const res = await fetch(`${API_BASE}/api/blogs/user/${userId}`, {
    credentials: "include"
  });

  const data = await res.json();
  const container = document.getElementById("userBlogs");

  container.innerHTML = "";

  if (!data.data.length) {
    container.innerHTML = "<p>You haven't written any blogs yet.</p>";
    return;
  }

  data.data.forEach((blog) => {
    const div = document.createElement("div");
    div.className = "blog-item";

    div.innerHTML = `
      <h4>${blog.title}</h4>
      <button onclick="editBlog('${blog._id}')">Edit</button>
    `;

    container.appendChild(div);
  });
}

function editBlog(id) {
  window.location.href = `/html/write.html?editId=${id}`;
}

/* ======================
   AVATAR UPLOAD
====================== */
document.getElementById("avatarInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("avatar", file);

  const res = await fetch(`${API_BASE}/api/users/avatar`, {
    method: "PATCH",
    body: formData,
    credentials: "include"
  });

  const data = await res.json();

  if (res.ok) {
    document.getElementById("profileAvatar").src = data.data.avatar;
  } else {
    alert("Avatar upload failed");
  }
});

/* ======================
   LOGOUT
====================== */
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await fetch(`${API_BASE}/api/users/logout`, {
    method: "POST",
    credentials: "include"
  });

  window.location.href = "/index.html";
});

/* ======================
   INIT
====================== */
document.addEventListener("DOMContentLoaded", loadProfile);

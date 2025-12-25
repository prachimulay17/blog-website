


const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profilePic = document.getElementById("profilePic");
const logoutBtn = document.getElementById("logoutBtn");
const classicLoginForm = document.getElementById("classicLoginForm");
const signInSection = document.querySelector(".sign-in-section");
const googleSignInBtn = document.getElementById("googleSignInBtn");

googleSignInBtn.style.display = "none"; // hide for now

const API_BASE = "http://localhost:8000/api/users";

/* =========================
   UI HELPERS
========================= */
function displayUserInfo(name, email, picUrl) {
  profileName.textContent = name;
  profileEmail.textContent = email;
  profilePic.src =
    picUrl || "https://cdn-icons-png.flaticon.com/512/847/847969.png";
  logoutBtn.style.display = "block";
}

function resetUserInfo() {
  profileName.textContent = "Guest";
  profileEmail.textContent = "Not signed in";
  profilePic.src =
    "https://cdn-icons-png.flaticon.com/512/847/847969.png";
  logoutBtn.style.display = "none";
}

function toggleSignIn(show) {
  signInSection.style.display = show ? "block" : "none";
}

/* =========================
   FETCH CURRENT USER
========================= */
async function fetchCurrentUser() {
  try {
    const res = await fetch(`${API_BASE}/me`, {
      credentials: "include"
    });

    if (!res.ok) throw new Error("Not logged in");

    const data = await res.json();
    const user = data.data;

    displayUserInfo(user.username, user.email, user.avatar);
    toggleSignIn(false);
  } catch (err) {
    resetUserInfo();
    toggleSignIn(true);
  }
}

/* =========================
   LOGIN (EMAIL/PASSWORD)
========================= */
classicLoginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;

  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // 🔥 REQUIRED
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message || "Login failed");
    return;
  }

  alert("Login successful");
  fetchCurrentUser();
});

/* =========================
   LOGOUT
========================= */
logoutBtn.addEventListener("click", async () => {
  await fetch(`${API_BASE}/logout`, {
    method: "POST",
    credentials: "include"
  });

  alert("Logged out");
  resetUserInfo();
  toggleSignIn(true);
});

/* =========================
   ON PAGE LOAD
========================= */
fetchCurrentUser();

const API_BASE = "http://localhost:8000";


const registerForm = document.getElementById("registerForm");

registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(registerForm);

  const res = await fetch("http://localhost:8000/api/users/register", {
    method: "POST",
    body: formData,
    credentials: "include" // 🔥 REQUIRED
  });

  const data = await res.json();
  console.log(data);

  if (res.ok) {
    alert("Registered successfully");
  } else {
    alert(data.message);
  }
});


const loginForm = document.getElementById("loginForm");

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("http://localhost:8000/api/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password }),
    credentials: "include" // 🔥 REQUIRED
  });

  const data = await res.json();
  console.log(data);

  if (res.ok) {
    alert("Login successful");
    window.location.href = "profile.html";
  } else {
    alert(data.message);
  }
});

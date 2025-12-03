const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profilePic = document.getElementById('profilePic');
const logoutBtn = document.getElementById('logoutBtn');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const classicLoginForm = document.getElementById('classicLoginForm');
const signInSection = document.querySelector('.sign-in-section');

// Initialize Google Sign In
window.onload = function() {
  google.accounts.id.initialize({
    client_id: 'YOUR_GOOGLE_CLIENT_ID',  // Replace with your client ID
    callback: handleGoogleSignin
  });
};

googleSignInBtn.addEventListener('click', () => {
  google.accounts.id.prompt(handleGoogleSignin);
});

function handleGoogleSignin(response) {
  if (!response.credential) {
    alert('Google Sign-in failed');
    return;
  }
  const payload = JSON.parse(atob(response.credential.split('.')[1]));
  displayUserInfo(payload.name, payload.email, payload.picture);
  toggleSignIn(false);
}

function displayUserInfo(name, email, picUrl) {
  profileName.textContent = name;
  profileEmail.textContent = email;
  profilePic.src = picUrl || 'https://cdn-icons-png.flaticon.com/512/847/847969.png';
  logoutBtn.style.display = 'block';
}

logoutBtn.addEventListener('click', () => {
  profileName.textContent = 'Guest';
  profileEmail.textContent = 'Not signed in';
  profilePic.src = 'https://cdn-icons-png.flaticon.com/512/847/847969.png';
  logoutBtn.style.display = 'none';
  toggleSignIn(true);
});

classicLoginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  // For now just mock login success
  const email = document.getElementById('emailInput').value;
  displayUserInfo('User', email, null);
  toggleSignIn(false);
});

function toggleSignIn(showSignIn) {
  signInSection.style.display = showSignIn ? 'block' : 'none';
}



const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const profileIcon = document.getElementById('profileIcon');
const authLinks = document.getElementById('authLinks');

// Toggle nav links on hamburger click (small screens)
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('active');
  // Hide auth links if nav is closing
  if (!navLinks.classList.contains('active')) {
    authLinks.classList.remove('active');
  }
});



// Optional: Close menus if clicking outside
document.addEventListener('click', (e) => {
  if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
    navLinks.classList.remove('active');
  }
  if (!authLinks.contains(e.target) && !profileIcon.contains(e.target)) {
    authLinks.classList.remove('active');
  }
});

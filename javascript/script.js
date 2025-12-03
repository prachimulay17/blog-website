const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const profileIcon = document.getElementById('profileIcon');
const authLinks = document.getElementById('authLinks');

// Toggle nav links on hamburger click (small screens)
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('active');
  // Hide auth links if nav is closing
  if (!navLinks.classList.contains('active')) {
    if (authLinks) authLinks.classList.remove('active');
  }
});



// Optional: Close menus if clicking outside
document.addEventListener('click', (e) => {
  if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
    navLinks.classList.remove('active');
  }
  if (authLinks && !authLinks.contains(e.target) && !profileIcon.contains(e.target)) {
    authLinks.classList.remove('active');
  }
});

// Helper to escape HTML
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Seed some sample posts so static cards/read-more have content
function seedSamplePostsIfEmpty() {
  try {
    const existing = JSON.parse(localStorage.getItem('posts') || '[]');
    if (!existing || existing.length === 0) {
      const sample = [
        {
          id: 1001,
          title: 'A Walk In Lavender Fields',
          content: `The sun dipped low over the lavender rows, painting the sky in shades of purple. Walking slowly, I breathed in the floral air and felt the quiet of the countryside settle around me. This little escape helped put life back in perspective.`,
          created: new Date().toISOString()
        },
        {
          id: 1002,
          title: 'JavaScript Tips For Beginners',
          content: `When starting with JavaScript, remember to keep functions small and focused. Use descriptive variable names and comment tricky logic. Practice by building tiny projects and reading other people's code.`,
          created: new Date().toISOString()
        },
        {
          id: 1003,
          title: 'Creative Mornings Routine',
          content: `Mornings are for light stretches, a cup of tea, and jotting down three ideas. This ritual helps channel creativity into a manageable flow and prevents the day from feeling overwhelming.`,
          created: new Date().toISOString()
        }
      ];
      localStorage.setItem('posts', JSON.stringify(sample));
    }
  } catch (e) {
    console.error('Failed to seed sample posts', e);
  }
}

// Render posts saved in localStorage into #postsContainer
function renderPosts() {
  const container = document.getElementById('postsContainer');
  if (!container) return;
  container.innerHTML = '';
  let posts = [];
  try {
    posts = JSON.parse(localStorage.getItem('posts') || '[]');
  } catch (e) {
    console.error('Failed to parse posts', e);
  }

  if (!posts || posts.length === 0) return;

  posts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'blog-card';
    const preview = escapeHtml(post.content).slice(0, 250);
    card.innerHTML = `
  <img src="/images/image.png" alt="Blog">
  <div class="content">
    <h2>${escapeHtml(post.title)}</h2>
    <p>${preview}${post.content.length > 250 ? '...' : ''}</p>
    <a class="read-more" href="post.html?id=${post.id}">Read More</a>
  </div>
`;

    // attach id to the button so navigation still works
    const btn = card.querySelector('.read-more');
    if (btn) btn.setAttribute('data-id', post.id);
    container.appendChild(card);
  });
}

// Navigate to single-post view when Read More clicked
document.addEventListener('click', (e) => {
  if (e.target && e.target.classList && e.target.classList.contains('read-more')) {
    const id = e.target.getAttribute('data-id');
    if (id) {
      // Navigate to post page (relative to current `index.html` in /html/)
      window.location.href = `post.html?id=${encodeURIComponent(id)}`;
    }
  }
});

// Handle edit/delete clicks via delegation
document.addEventListener('click', (e) => {
  const t = e.target;
  if (!t || !t.classList) return;

  // Delete post
  if (t.classList.contains('delete-post')) {
    e.preventDefault();
    const id = t.getAttribute('data-id');
    if (!id) return;
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      let posts = JSON.parse(localStorage.getItem('posts') || '[]');
      posts = posts.filter(p => String(p.id) !== String(id));
      localStorage.setItem('posts', JSON.stringify(posts));
      // re-render posts
      renderPosts();
    } catch (err) {
      console.error('Failed to delete post', err);
      alert('Could not delete the post.');
    }
  }

  // Edit is a normal link to write.html?editId=..., no JS needed. Keeping for clarity.
});

// Initial call to render posts on page load
document.addEventListener('DOMContentLoaded', () => {
  seedSamplePostsIfEmpty();
  renderPosts();
});

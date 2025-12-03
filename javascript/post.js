// Parse query string to get `id`
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderPost() {
  const container = document.getElementById('postContainer');
  if (!container) return;

  const id = getQueryParam('id');
  if (!id) {
    container.innerHTML = '<p>No post id provided.</p>';
    return;
  }

  let posts = [];
  try {
    posts = JSON.parse(localStorage.getItem('posts') || '[]');
  } catch (e) {
    console.error('Failed to parse posts', e);
  }

  const post = posts.find(p => String(p.id) === String(id));
  if (!post) {
    container.innerHTML = '<p>Post not found.</p>';
    return;
  }

  const created = new Date(post.created).toLocaleString();
  const contentHtml = escapeHtml(post.content).replace(/\n/g, '<br>');

  container.innerHTML = `
    <article class="blog-card single-post-card">
      <div class="content">
        <h1>${escapeHtml(post.title)}</h1>
        <p class="meta">${created}</p>
        <div class="post-actions">
          <a href="write.html?editId=${post.id}" class="edit-post">Edit</a>
          <a href="#" class="delete-post" data-id="${post.id}">Delete</a>
        </div>
        <div class="post-body">${contentHtml}</div>
      </div>
    </article>
  `;
}

document.addEventListener('DOMContentLoaded', renderPost);

// Handle delete from single post view
document.addEventListener('click', (e) => {
  const t = e.target;
  if (!t || !t.classList) return;

  if (t.classList.contains('delete-post')) {
    e.preventDefault();
    const id = t.getAttribute('data-id');
    if (!id) return;
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      let posts = JSON.parse(localStorage.getItem('posts') || '[]');
      posts = posts.filter(p => String(p.id) !== String(id));
      localStorage.setItem('posts', JSON.stringify(posts));
      // Redirect to home after delete
      window.location.href = 'index.html';
    } catch (err) {
      console.error('Failed to delete post', err);
      alert('Could not delete the post.');
    }
  }
});

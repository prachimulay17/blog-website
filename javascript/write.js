const postBtn = document.getElementById('postBtn');
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');

// Helper to get query params
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// If editId is present, prefill form and change button text
const editId = getQueryParam('editId');
if (editId) {
  // change button label to indicate edit
  postBtn.textContent = 'Save';
  try {
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const p = posts.find(x => String(x.id) === String(editId));
    if (p) {
      titleInput.value = p.title || '';
      contentInput.value = p.content || '';
    }
  } catch (e) {
    console.error('Failed to load post for edit', e);
  }
}

postBtn.addEventListener('click', () => {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!title) {
    alert('Please enter a blog title.');
    titleInput.focus();
    return;
  }
  if (!content) {
    alert('Please write some content for your blog.');
    contentInput.focus();
    return;
  }

  try {
    const existing = JSON.parse(localStorage.getItem('posts') || '[]');

    if (editId) {
      // Update existing post
      const idx = existing.findIndex(p => String(p.id) === String(editId));
      if (idx !== -1) {
        existing[idx] = {
          ...existing[idx],
          title,
          content,
          updated: new Date().toISOString()
        };
        localStorage.setItem('posts', JSON.stringify(existing));
        alert('Post updated. Redirecting to post view...');
        // redirect to single post view
        window.location.href = `post.html?id=${encodeURIComponent(editId)}`;
        return;
      }
    }

    // Create new post object
    const post = {
      id: Date.now(),
      title,
      content,
      created: new Date().toISOString()
    };

    existing.unshift(post); // newest first
    localStorage.setItem('posts', JSON.stringify(existing));

    alert('Blog Posted! Redirecting to Home...');
    // Clear fields
    titleInput.value = '';
    contentInput.value = '';

    // Redirect to index (same folder)
    window.location.href = 'index.html';
  } catch (e) {
    console.error('Failed to save post', e);
    alert('Could not save the post locally.');
  }
});

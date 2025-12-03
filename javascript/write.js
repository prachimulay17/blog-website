const postBtn = document.getElementById('postBtn');
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');

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

  // For now just show the content in alert (replace with post logic)
  alert(`Blog Posted!\n\nTitle: ${title}\nContent Preview:\n${content.substring(0, 100)}...`);

  // Clear fields after post
  titleInput.value = '';

});

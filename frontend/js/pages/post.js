import { renderAppShell } from '../core/shell.js';
import { api } from '../core/api.js';
import { getCurrentUser, isAuthenticated } from '../core/auth.js';
import { renderAvatarHTML } from '../core/avatar.js';
import { renderPostCard } from '../components/postCard.js';
import { renderCommentItem } from '../components/commentList.js';
import { openGuestModal } from '../core/modal.js';
import { showToast } from '../core/toast.js';

const postMount = document.getElementById('single-post-mount');
const commentMount = document.getElementById('comments-list-mount');
const commentInput = document.getElementById('post-detail-comment-input');
const submitBtn = document.getElementById('post-detail-comment-submit');
const backBtn = document.getElementById('post-back-btn');
const avatarMount = document.getElementById('comment-user-avatar');
const countPill = document.getElementById('comments-count-pill');

const getPostIdFromPath = () => {
  const parts = window.location.pathname.split('/');
  return parts[2] || '';
};

export const initPostPage = async () => {
  renderAppShell('post');

  if (backBtn) {
    backBtn.onclick = () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/';
      }
    };
  }

  const currentUser = getCurrentUser();
  if (avatarMount) {
    avatarMount.innerHTML = currentUser ? renderAvatarHTML(currentUser, 'avatar-sm') : '<div class="avatar avatar-sm">?</div>';
  }

  const postId = getPostIdFromPath();
  if (!postId) {
    window.location.href = '/';
    return;
  }

  if (commentInput && submitBtn) {
    commentInput.addEventListener('input', () => {
      submitBtn.disabled = !commentInput.value.trim();
    });

    submitBtn.addEventListener('click', async () => {
      const text = commentInput.value.trim();
      if (!text) return;

      if (!isAuthenticated()) {
        openGuestModal('join the conversation with a comment');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Posting...';

      try {
        const res = await api.post(`/posts/${postId}/comments`, { text });
        commentInput.value = '';

        // Prepend new comment
        const commentEl = renderCommentItem(res.comment);
        if (commentMount) {
          // If empty placeholder exists, clear it
          const emptyPlaceholder = commentMount.querySelector('.empty-comments-text');
          if (emptyPlaceholder) emptyPlaceholder.remove();
          commentMount.prepend(commentEl);
        }

        showToast('Comment posted!');
      } catch (err) {
        showToast(err.message || 'Failed to post comment');
      } finally {
        submitBtn.textContent = 'Comment';
        submitBtn.disabled = true;
      }
    });
  }

  await loadPostAndComments(postId);
};

const loadPostAndComments = async (postId) => {
  if (postMount) {
    postMount.innerHTML = `<div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: var(--text-xs);">Loading post...</div>`;
  }

  try {
    const [postData, commentData] = await Promise.all([
      api.get(`/posts/${postId}`),
      api.get(`/posts/${postId}/comments`)
    ]);

    if (postMount) {
      postMount.innerHTML = '';
      const postCard = renderPostCard(postData.post, {
        onPostDeleted: () => {
          showToast('Post deleted');
          setTimeout(() => {
            window.location.href = '/';
          }, 300);
        }
      });
      postMount.appendChild(postCard);
    }

    const comments = commentData.comments || [];
    if (countPill) {
      countPill.textContent = `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`;
    }

    if (commentMount) {
      commentMount.innerHTML = '';
      if (comments.length === 0) {
        commentMount.innerHTML = `
          <div class="empty-comments-text" style="padding: 24px 0; text-align: center; color: var(--text-muted); font-size: var(--text-xs);">
            No comments yet. Be the first to share your perspective!
          </div>
        `;
      } else {
        comments.forEach(c => {
          commentMount.appendChild(renderCommentItem(c, {
            onDeleted: () => {
              if (countPill) {
                const count = commentMount.children.length;
                countPill.textContent = `${count} ${count === 1 ? 'comment' : 'comments'}`;
              }
            }
          }));
        });
      }
    }
  } catch (err) {
    if (postMount) {
      postMount.innerHTML = `
        <div style="background: var(--bg-surface); border: 1px solid var(--border-hairline); border-radius: var(--rad-lg); padding: 40px 20px; text-align: center;">
          <h2 style="font-weight: 800; font-size: var(--text-base); margin-bottom: 6px;">Post Not Found</h2>
          <p style="color: var(--text-muted); font-size: var(--text-xs); margin-bottom: 16px;">This post may have been removed or does not exist.</p>
          <a href="/" class="btn btn-primary btn-sm">Return Home</a>
        </div>
      `;
    }
  }
};

document.addEventListener('DOMContentLoaded', initPostPage);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initPostPage();
}

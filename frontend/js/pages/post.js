import { renderAppShell } from '../core/shell.js';
import { api } from '../core/api.js';
import { getCurrentUser, isAuthenticated } from '../core/auth.js';
import { renderAvatarHTML } from '../core/avatar.js';
import { renderPostCard } from '../components/postCard.js';
import { renderCommentItem } from '../components/commentList.js';
import { renderPostSkeleton, renderCommentSkeleton } from '../components/skeletons.js';
import { openGuestModal } from '../core/modal.js';
import { showToast } from '../core/toast.js';

const postMount = document.getElementById('single-post-mount');
const commentMount = document.getElementById('comments-section');
const replyAvatar = document.getElementById('reply-avatar-mount');
const commentForm = document.getElementById('comment-form');
const commentInput = document.getElementById('comment-input');
const submitCommentBtn = document.getElementById('submit-comment-btn');
const backBtn = document.getElementById('post-back-btn');

const getPostIdFromPath = () => {
  const parts = window.location.pathname.split('/');
  return parts[2] || '';
};

export const initPostPage = async () => {
  renderAppShell('post');

  backBtn.onclick = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  const currentUser = getCurrentUser() || { name: 'You', username: 'guest', avatarHue: 175 };
  if (replyAvatar) {
    replyAvatar.innerHTML = renderAvatarHTML(currentUser, 'avatar-md');
  }

  const postId = getPostIdFromPath();
  if (!postId) {
    window.location.href = '/';
    return;
  }

  // Reply input auto-resize & enable submit
  if (commentInput) {
    commentInput.addEventListener('input', () => {
      commentInput.style.height = 'auto';
      commentInput.style.height = `${commentInput.scrollHeight}px`;
      if (submitCommentBtn) submitCommentBtn.disabled = !commentInput.value.trim();
    });
  }

  if (commentForm) {
    commentForm.onsubmit = async (e) => {
      e.preventDefault();
      if (!isAuthenticated()) {
        openGuestModal('reply to conversations');
        return;
      }

      const text = commentInput.value.trim();
      if (!text) return;

      submitCommentBtn.disabled = true;
      submitCommentBtn.textContent = 'Posting...';

      try {
        const res = await api.post(`/posts/${postId}/comments`, { text });

        // Reset composer
        commentInput.value = '';
        commentInput.style.height = 'auto';

        // Optimistically insert new comment
        const commentEl = renderCommentItem(res.comment);
        commentEl.classList.add('animate-rise');
        commentMount.prepend(commentEl);

        // Update post comment counter in DOM
        const replyCounter = postMount.querySelector('.action-reply .action-count');
        if (replyCounter) {
          const currentCount = parseInt(replyCounter.textContent, 10) || 0;
          replyCounter.textContent = String(currentCount + 1);
        }

        showToast('Reply published', 'success');
      } catch (err) {
        showToast(err.message || 'Failed to post reply', 'error');
      } finally {
        submitCommentBtn.textContent = 'Reply';
        submitCommentBtn.disabled = true;
      }
    };
  }

  await loadPostAndComments(postId);
};

const loadPostAndComments = async (postId) => {
  postMount.innerHTML = renderPostSkeleton();
  commentMount.innerHTML = renderCommentSkeleton() + renderCommentSkeleton();

  try {
    const [postData, commentData] = await Promise.all([
      api.get(`/posts/${postId}`),
      api.get(`/posts/${postId}/comments`)
    ]);

    postMount.innerHTML = '';
    const postCard = renderPostCard(postData.post, {
      onPostDeleted: () => {
        showToast('Post deleted', 'info');
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      }
    });
    postMount.appendChild(postCard);

    // Comments
    const comments = commentData.comments || [];
    commentMount.innerHTML = '';

    if (comments.length === 0) {
      commentMount.innerHTML = `
        <div style="padding: 36px 16px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
          No replies yet. Be the first to add your perspective!
        </div>
      `;
    } else {
      comments.forEach(c => {
        commentMount.appendChild(renderCommentItem(c, {
          onDeleted: () => {
            const replyCounter = postMount.querySelector('.action-reply .action-count');
            if (replyCounter) {
              const currentCount = parseInt(replyCounter.textContent, 10) || 1;
              replyCounter.textContent = String(Math.max(0, currentCount - 1));
            }
          }
        }));
      });
    }
  } catch (err) {
    postMount.innerHTML = `
      <div class="empty-state-card">
        <h3 style="font-family: var(--font-display); font-size: 1.3rem; margin-bottom: 6px;">Post Not Found</h3>
        <p style="color: var(--text-secondary); margin-bottom: 16px;">This post may have been deleted or the link is expired.</p>
        <a href="/" class="btn btn-primary btn-sm">Return Home</a>
      </div>
    `;
    commentMount.innerHTML = '';
  }
};

initPostPage();

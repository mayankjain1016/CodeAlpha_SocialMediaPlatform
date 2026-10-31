import { api } from '../core/api.js';
import { renderAvatarHTML } from '../core/avatar.js';
import { icons } from '../core/icons.js';
import { escapeHTML, timeAgo, formatFullDate, linkify } from '../core/utils.js';
import { confirmModal } from '../core/modal.js';
import { showToast } from '../core/toast.js';

export const renderCommentItem = (comment, { onDeleted = null } = {}) => {
  const item = document.createElement('div');
  item.className = 'comment-item';
  item.id = `comment-${comment._id}`;

  const author = comment.author || { name: 'User', username: 'user', avatarHue: 175 };
  const time = timeAgo(comment.createdAt);
  const fullDate = formatFullDate(comment.createdAt);

  item.innerHTML = `
    <div class="comment-thread-line"></div>
    <a href="/u/${escapeHTML(author.username)}" style="flex-shrink: 0; z-index: 2;" aria-label="${escapeHTML(author.name)}'s profile">
      ${renderAvatarHTML(author, 'avatar-md')}
    </a>
    <div class="comment-bubble spotlight-card">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
        <div style="display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap;">
          <a href="/u/${escapeHTML(author.username)}" style="font-family: var(--font-display); font-weight: 700; font-size: 0.95rem; color: var(--text-main); text-decoration: none;">
            ${escapeHTML(author.name)}
          </a>
          <span style="color: var(--text-muted); font-size: 0.78rem;">@${escapeHTML(author.username)}</span>
          <span style="color: var(--text-faint); font-size: 0.75rem;">&middot;</span>
          <span style="color: var(--text-muted); font-size: 0.75rem;" title="${fullDate}">${time}</span>
        </div>

        ${comment.canDelete ? `
          <button type="button" class="btn-icon comment-delete-btn" title="Delete comment" aria-label="Delete comment" style="width: 28px; height: 28px; color: var(--coral-500);">
            ${icons.trash()}
          </button>
        ` : ''}
      </div>

      <div style="font-size: 0.96rem; color: var(--text-main); line-height: 1.55; word-break: break-word; white-space: pre-line;">
        ${linkify(comment.text)}
      </div>
    </div>
  `;

  const deleteBtn = item.querySelector('.comment-delete-btn');
  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      const confirmed = await confirmModal({
        title: 'Delete Reply?',
        message: 'This cannot be undone and will remove your reply from this discussion.',
        confirmText: 'Delete',
        confirmDanger: true,
      });

      if (!confirmed) return;

      try {
        await api.delete(`/comments/${comment._id}`);
        item.style.transition = 'all 0.25s ease';
        item.style.opacity = '0';
        item.style.transform = 'translateY(-6px)';
        setTimeout(() => {
          item.remove();
          if (typeof onDeleted === 'function') onDeleted(comment._id);
        }, 250);
        showToast('Reply deleted', 'info');
      } catch (err) {
        showToast(err.message || 'Failed to delete reply', 'error');
      }
    };
  }

  return item;
};

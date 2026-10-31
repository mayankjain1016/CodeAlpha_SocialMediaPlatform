import { api } from '../core/api.js';
import { renderAvatarHTML } from '../core/avatar.js';
import { icons } from '../core/icons.js';
import { escapeHTML, timeAgo, formatFullDate } from '../core/utils.js';
import { confirmModal } from '../core/modal.js';
import { showToast } from '../core/toast.js';

export const renderCommentItem = (comment, { onDeleted = null } = {}) => {
  const item = document.createElement('div');
  item.className = 'comment-item';
  item.id = `comment-${comment._id}`;
  item.style.display = 'flex';
  item.style.gap = '12px';
  item.style.padding = '14px 16px';
  item.style.borderBottom = '1px solid var(--border-subtle)';
  item.style.transition = 'background-color 0.15s ease';

  const author = comment.author || { name: 'User', username: 'user', avatarHue: 200 };
  const time = timeAgo(comment.createdAt);
  const fullDate = formatFullDate(comment.createdAt);

  item.innerHTML = `
    <a href="/u/${escapeHTML(author.username)}" style="flex-shrink: 0;" aria-label="${escapeHTML(author.name)}'s profile">
      ${renderAvatarHTML(author, 'avatar-sm')}
    </a>
    <div style="flex: 1; min-width: 0;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <a href="/u/${escapeHTML(author.username)}" style="font-weight: 700; font-size: 0.85rem; color: var(--text-main); text-decoration: none;">
            ${escapeHTML(author.name)}
          </a>
          <span style="color: var(--text-muted); font-size: 0.75rem;">@${escapeHTML(author.username)}</span>
          <span style="color: var(--text-faint); font-size: 0.75rem;">&middot;</span>
          <span style="color: var(--text-muted); font-size: 0.75rem;" title="${fullDate}">${time}</span>
        </div>

        ${comment.canDelete ? `
          <button class="btn-icon comment-delete-btn" title="Delete comment" aria-label="Delete comment" style="width: 28px; height: 28px; color: var(--text-faint);">
            ${icons.trash()}
          </button>
        ` : ''}
      </div>

      <p style="font-size: 0.92rem; color: var(--text-main); margin: 0; line-height: 1.45; word-break: break-word; white-space: pre-line;">
        ${escapeHTML(comment.text)}
      </p>
    </div>
  `;

  const deleteBtn = item.querySelector('.comment-delete-btn');
  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      const confirmed = await confirmModal({
        title: 'Delete Comment?',
        message: 'Are you sure you want to delete this reply?',
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
        showToast('Comment deleted', 'info');
      } catch (err) {
        showToast(err.message || 'Failed to delete comment', 'error');
      }
    };
  }

  return item;
};

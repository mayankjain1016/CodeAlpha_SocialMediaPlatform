import { api } from '../core/api.js';
import { getCurrentUser, isAuthenticated } from '../core/auth.js';
import { renderAvatarHTML } from '../core/avatar.js';
import { escapeHTML } from '../core/utils.js';
import { openGuestModal } from '../core/modal.js';
import { showToast } from '../core/toast.js';

export const renderUserCard = (user, { onFollowToggled = null } = {}) => {
  const card = document.createElement('div');
  card.className = 'user-card';
  card.style.padding = '12px 16px';
  card.style.borderBottom = '1px solid var(--border-subtle)';

  const currentUserId = getCurrentUser()?._id;
  const isMe = currentUserId && user._id === currentUserId;

  card.innerHTML = `
    <a href="/u/${escapeHTML(user.username)}" class="user-card-info" style="text-decoration: none; flex: 1;">
      ${renderAvatarHTML(user, 'avatar-md')}
      <div class="user-card-text">
        <span class="user-card-name">${escapeHTML(user.name)}</span>
        <span class="user-card-handle">@${escapeHTML(user.username)}</span>
        ${user.bio ? `<span style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">${escapeHTML(user.bio)}</span>` : ''}
      </div>
    </a>

    ${!isMe ? `
      <button class="btn btn-secondary btn-sm btn-follow ${user.isFollowing ? 'following' : ''}" data-user-id="${user._id}">
        ${user.isFollowing ? 'Following' : 'Follow'}
      </button>
    ` : ''}
  `;

  const followBtn = card.querySelector('.btn-follow');
  if (followBtn) {
    followBtn.onclick = async (e) => {
      e.preventDefault();
      if (!isAuthenticated()) {
        openGuestModal('follow people');
        return;
      }

      followBtn.disabled = true;
      try {
        const res = await api.post(`/users/${user._id}/follow`);
        user.isFollowing = res.following;

        if (res.following) {
          followBtn.textContent = 'Following';
          followBtn.classList.add('following');
        } else {
          followBtn.textContent = 'Follow';
          followBtn.classList.remove('following');
        }

        if (typeof onFollowToggled === 'function') {
          onFollowToggled(user._id, res.following, res.followersCount);
        }
      } catch (err) {
        showToast(err.message || 'Follow action failed', 'error');
      } finally {
        followBtn.disabled = false;
      }
    };
  }

  return card;
};

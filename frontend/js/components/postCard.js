import { api } from '../core/api.js';
import { getCurrentUser, isAuthenticated } from '../core/auth.js';
import { renderAvatarHTML } from '../core/avatar.js';
import { icons } from '../core/icons.js';
import { linkify, escapeHTML, timeAgo, formatFullDate, formatCount } from '../core/utils.js';
import { playLikeAnimation, playBookmarkAnimation, rollCount } from '../core/motion.js';
import { openGuestModal, confirmModal } from '../core/modal.js';
import { showToast } from '../core/toast.js';
import { openLightbox } from './lightbox.js';

export const renderPostCard = (post, { onPostDeleted = null } = {}) => {
  const card = document.createElement('article');
  card.className = 'post-card';
  card.id = `post-${post._id}`;

  const currentUserId = getCurrentUser()?._id;
  const isAuthor = currentUserId && post.author?._id === currentUserId;

  const author = post.author || { name: 'Anonymous', username: 'unknown', avatarHue: 210 };
  const safeText = post.text ? linkify(post.text) : '';
  const timeLabel = timeAgo(post.createdAt);
  const fullDate = formatFullDate(post.createdAt);

  card.innerHTML = `
    <a href="/u/${escapeHTML(author.username)}" class="post-card-avatar" aria-label="${escapeHTML(author.name)}'s profile">
      ${renderAvatarHTML(author, 'avatar-md')}
    </a>

    <div class="post-card-main">
      <div class="post-card-header">
        <div class="post-card-author">
          <a href="/u/${escapeHTML(author.username)}" class="post-author-name">
            ${escapeHTML(author.name)}
          </a>
          <span class="post-author-handle">@${escapeHTML(author.username)}</span>
          <span style="color: var(--text-faint);">&middot;</span>
          <a href="/post/${post._id}" class="post-time" title="${fullDate}">
            ${timeLabel}
          </a>
        </div>

        ${isAuthor ? `
          <div style="position: relative;">
            <button class="btn-icon post-more-btn" title="More options" aria-label="Post options">
              ${icons.more()}
            </button>
            <div class="post-dropdown-menu" style="display: none; position: absolute; right: 0; top: 100%; background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-md); box-shadow: var(--shadow-md); z-index: 20; min-width: 140px; padding: 4px;">
              <button class="btn btn-ghost btn-sm post-delete-btn" style="width: 100%; justify-content: flex-start; color: var(--red-500);">
                ${icons.trash('nav-icon')}
                <span>Delete</span>
              </button>
            </div>
          </div>
        ` : ''}
      </div>

      ${safeText ? `
        <div class="post-card-text">
          ${safeText}
        </div>
      ` : ''}

      ${post.image ? `
        <div class="post-card-media" title="Click to enlarge image">
          <img src="${escapeHTML(post.image)}" alt="Post image" loading="lazy">
        </div>
      ` : ''}

      <div class="post-actions-row">
        <!-- Reply / Comments -->
        <a href="/post/${post._id}" class="action-item action-reply" aria-label="Reply to post">
          <span class="action-icon">${icons.message()}</span>
          <span class="action-count">${formatCount(post.commentsCount)}</span>
        </a>

        <!-- Like -->
        <button class="action-item action-like ${post.likedByMe ? 'liked' : ''}" aria-label="Like post" data-liked="${post.likedByMe}">
          <span class="action-icon">${icons.heart()}</span>
          <span class="action-count count-roll">${formatCount(post.likesCount)}</span>
        </button>

        <!-- Bookmark -->
        <button class="action-item action-bookmark ${post.bookmarkedByMe ? 'bookmarked' : ''}" aria-label="Bookmark post" data-bookmarked="${post.bookmarkedByMe}">
          <span class="action-icon">${icons.bookmark()}</span>
        </button>

        <!-- Share -->
        <button class="action-item action-share" aria-label="Share post">
          <span class="action-icon">${icons.share()}</span>
        </button>
      </div>
    </div>
  `;

  // Attach Lightbox click
  const mediaEl = card.querySelector('.post-card-media img');
  if (mediaEl) {
    mediaEl.onclick = (e) => {
      e.stopPropagation();
      openLightbox(post.image, post.text || 'Post image');
    };
  }

  // Like Action Handler
  const likeBtn = card.querySelector('.action-like');
  const likeCountEl = likeBtn.querySelector('.action-count');

  likeBtn.onclick = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated()) {
      openGuestModal('like posts');
      return;
    }

    likeBtn.disabled = true;
    try {
      const res = await api.post(`/posts/${post._id}/like`);
      post.likedByMe = res.liked;
      post.likesCount = res.likesCount;

      likeBtn.dataset.liked = String(res.liked);
      if (res.liked) {
        likeBtn.classList.add('liked');
      } else {
        likeBtn.classList.remove('liked');
      }

      playLikeAnimation(likeBtn, res.liked);
      rollCount(likeCountEl, res.likesCount);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      likeBtn.disabled = false;
    }
  };

  // Bookmark Action Handler
  const bookmarkBtn = card.querySelector('.action-bookmark');
  bookmarkBtn.onclick = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated()) {
      openGuestModal('save bookmarks');
      return;
    }

    bookmarkBtn.disabled = true;
    try {
      const res = await api.post(`/posts/${post._id}/bookmark`);
      post.bookmarkedByMe = res.bookmarked;

      bookmarkBtn.dataset.bookmarked = String(res.bookmarked);
      if (res.bookmarked) {
        bookmarkBtn.classList.add('bookmarked');
        showToast('Saved to your Bookmarks', 'success');
      } else {
        bookmarkBtn.classList.remove('bookmarked');
        showToast('Removed from Bookmarks', 'info');
      }

      playBookmarkAnimation(bookmarkBtn, res.bookmarked);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      bookmarkBtn.disabled = false;
    }
  };

  // Share Action Handler
  const shareBtn = card.querySelector('.action-share');
  shareBtn.onclick = (e) => {
    e.stopPropagation();
    const postUrl = `${window.location.origin}/post/${post._id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl).then(() => {
        showToast('Link copied to clipboard!', 'success');
      }).catch(() => {
        showToast(`Post link: ${postUrl}`, 'info');
      });
    } else {
      showToast(`Post link: ${postUrl}`, 'info');
    }
  };

  // More options & Delete Handler
  const moreBtn = card.querySelector('.post-more-btn');
  const dropdownMenu = card.querySelector('.post-dropdown-menu');
  const deleteBtn = card.querySelector('.post-delete-btn');

  if (moreBtn && dropdownMenu && deleteBtn) {
    moreBtn.onclick = (e) => {
      e.stopPropagation();
      const isVisible = dropdownMenu.style.display === 'block';
      dropdownMenu.style.display = isVisible ? 'none' : 'block';
    };

    document.addEventListener('click', (e) => {
      if (!moreBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.style.display = 'none';
      }
    });

    deleteBtn.onclick = async (e) => {
      e.stopPropagation();
      dropdownMenu.style.display = 'none';

      const confirmed = await confirmModal({
        title: 'Delete Post?',
        message: 'This cannot be undone and will remove this post from your profile and feed.',
        confirmText: 'Delete',
        confirmDanger: true,
      });

      if (!confirmed) return;

      try {
        await api.delete(`/posts/${post._id}`);
        // Smooth collapse animation
        card.classList.add('collapsing-card');
        setTimeout(() => {
          card.remove();
          if (typeof onPostDeleted === 'function') {
            onPostDeleted(post._id);
          }
        }, 320);
        showToast('Post deleted', 'info');
      } catch (err) {
        showToast(err.message || 'Failed to delete post', 'error');
      }
    };
  }

  // Click entire card to navigate to post detail (except when clicking a link or button)
  card.onclick = (e) => {
    if (e.target.closest('a, button, input, .post-card-media')) return;
    window.location.href = `/post/${post._id}`;
  };

  return card;
};

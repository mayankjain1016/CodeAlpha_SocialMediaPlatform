import { api } from '../core/api.js';
import { getCurrentUser, isAuthenticated } from '../core/auth.js';
import { renderAvatarHTML } from '../core/avatar.js';
import { icons } from '../core/icons.js';
import { linkify, escapeHTML, timeAgo, formatFullDate, formatCount } from '../core/utils.js';
import { playLikeAnimation, playBookmarkAnimation, rollCount, triggerDoubleTapHeart } from '../core/motion.js';
import { openGuestModal, confirmModal } from '../core/modal.js';
import { showToast } from '../core/toast.js';
import { openLightbox } from './lightbox.js';

export const renderPostCard = (post, { onPostDeleted = null } = {}) => {
  const card = document.createElement('article');
  card.className = 'post-card spotlight-card';
  card.id = `post-${post._id}`;

  const currentUserId = getCurrentUser()?._id;
  const isAuthor = currentUserId && post.author?._id === currentUserId;

  const author = post.author || { name: 'Anonymous', username: 'unknown', avatarHue: 175 };
  const safeText = post.text ? linkify(post.text) : '';
  const timeLabel = timeAgo(post.createdAt);
  const fullDate = formatFullDate(post.createdAt);

  card.innerHTML = `
    <div class="post-card-header">
      <div class="post-card-author-info">
        <a href="/u/${escapeHTML(author.username)}" class="post-card-avatar" aria-label="${escapeHTML(author.name)}'s profile">
          ${renderAvatarHTML(author, 'avatar-md')}
        </a>
        <div style="min-width: 0;">
          <div style="display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap;">
            <a href="/u/${escapeHTML(author.username)}" class="post-author-name">
              ${escapeHTML(author.name)}
            </a>
            <span class="post-author-handle">@${escapeHTML(author.username)}</span>
          </div>
          <div class="post-time-meta" title="${fullDate}">
            ${timeLabel}
          </div>
        </div>
      </div>

      ${isAuthor ? `
        <div style="position: relative;">
          <button type="button" class="btn-icon post-more-btn" title="More options" aria-label="Post options">
            ${icons.more()}
          </button>
          <div class="post-dropdown-menu" style="display: none; position: absolute; right: 0; top: 100%; background: var(--bg-surface); border: 1px solid var(--hairline-strong); border-radius: var(--radius-md); box-shadow: var(--shadow-floating); z-index: 20; min-width: 140px; padding: 4px;">
            <button type="button" class="btn btn-ghost btn-sm post-delete-btn" style="width: 100%; justify-content: flex-start; color: var(--coral-500);">
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
      <div class="post-card-media" title="Click to view image in full resolution">
        <img src="${escapeHTML(post.image)}" alt="Post image" loading="lazy">
      </div>
    ` : ''}

    <div class="post-actions-row">
      <!-- Reply / Comments Pill -->
      <a href="/post/${post._id}" class="action-pill-btn action-reply" aria-label="Reply to post">
        ${icons.message()}
        <span class="action-count">${formatCount(post.commentsCount)}</span>
      </a>

      <!-- Like Pill -->
      <button type="button" class="action-pill-btn action-like ${post.likedByMe ? 'liked' : ''}" aria-label="Like post" data-liked="${post.likedByMe}">
        ${icons.heart()}
        <span class="action-count count-roll">${formatCount(post.likesCount)}</span>
      </button>

      <!-- Bookmark Pill -->
      <button type="button" class="action-pill-btn action-bookmark ${post.bookmarkedByMe ? 'bookmarked' : ''}" aria-label="Bookmark post" data-bookmarked="${post.bookmarkedByMe}">
        ${icons.bookmark()}
      </button>

      <!-- Share Pill -->
      <button type="button" class="action-pill-btn action-share" aria-label="Share post">
        ${icons.share()}
      </button>
    </div>
  `;

  // Attach Lightbox click
  const mediaEl = card.querySelector('.post-card-media img');
  if (mediaEl) {
    mediaEl.onclick = (e) => {
      e.stopPropagation();
      openLightbox(post.image, post.text || 'Sangam post image');
    };
  }

  // Double Click / Double Tap Heart Burst on Media or Text
  const attachDoubleTap = (targetEl) => {
    if (!targetEl) return;
    let lastTap = 0;
    targetEl.addEventListener('pointerdown', (e) => {
      const now = Date.now();
      if (now - lastTap < 300) {
        // Double tap detected
        triggerDoubleTapHeart(card, async () => {
          if (!post.likedByMe && isAuthenticated()) {
            try {
              const res = await api.post(`/posts/${post._id}/like`);
              post.likedByMe = res.liked;
              post.likesCount = res.likesCount;
              likeBtn.dataset.liked = String(res.liked);
              likeBtn.classList.add('liked');
              playLikeAnimation(likeBtn, true);
              rollCount(likeCountEl, res.likesCount);
            } catch (_) {}
          }
        });
      }
      lastTap = now;
    });
  };

  const textEl = card.querySelector('.post-card-text');
  if (textEl) attachDoubleTap(textEl);
  if (mediaEl) attachDoubleTap(mediaEl);

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
        message: 'This cannot be undone and will permanently remove this post from Sangam.',
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
    if (e.target.closest('a, button, input, .post-card-media, .post-dropdown-menu')) return;
    window.location.href = `/post/${post._id}`;
  };

  return card;
};

import { api } from '../core/api.js';
import { getCurrentUser, isAuthenticated } from '../core/auth.js';
import { renderAvatarHTML } from '../core/avatar.js';
import { icons } from '../core/icons.js';
import { linkify, escapeHTML, timeAgo, formatFullDate, formatCount } from '../core/utils.js';
import { openGuestModal, confirmModal } from '../core/modal.js';
import { showToast } from '../core/toast.js';
import { openLightbox } from './lightbox.js';
import { attachReactions, REACTION_MAP } from './reactions.js';

export const renderPostCard = (post, { onPostDeleted = null } = {}) => {
  const card = document.createElement('article');
  card.className = 'post-card';
  card.id = `post-${post._id}`;

  const currentUserId = getCurrentUser()?._id;
  const isAuthor = currentUserId && post.author?._id === currentUserId;
  const author = post.author || { name: 'Anonymous', username: 'unknown' };
  const safeText = post.text ? linkify(post.text) : '';
  const timeLabel = timeAgo(post.createdAt);
  const fullDate = formatFullDate(post.createdAt);

  // Normalize reaction state from backend
  const isLiked = Boolean(post.likedByMe || (post.myReaction && post.myReaction !== null));
  const myReaction = post.myReaction || (isLiked ? 'like' : null);
  post.isLiked = isLiked;
  post.myReaction = myReaction;

  const reactionMeta = myReaction ? (REACTION_MAP[myReaction] || REACTION_MAP.like) : null;

  // Build Reaction Summary
  const totalReactions = post.likesCount || 0;
  const summary = post.reactionSummary || {};
  const topReactions = Object.entries(summary)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => REACTION_MAP[type]?.emoji || '❤️');

  let iconsHtml = topReactions.map(emoji => `<span class="reaction-icon-mini">${emoji}</span>`).join('');
  let summaryLabel = `${totalReactions} ${totalReactions === 1 ? 'reaction' : 'reactions'}`;
  if (isLiked && myReaction) {
    summaryLabel = totalReactions === 1 ? 'You reacted' : `You and ${totalReactions - 1} other${totalReactions > 2 ? 's' : ''}`;
  }

  card.innerHTML = `
    <!-- Post Header -->
    <div class="post-header">
      <a href="/u/${escapeHTML(author.username)}" class="post-author-link" aria-label="${escapeHTML(author.name)}'s profile">
        ${renderAvatarHTML(author, 'avatar-sm')}
        <div class="post-author-meta">
          <div class="post-author-name-row">
            <span class="post-author-name">${escapeHTML(author.name)}</span>
            <span class="post-author-handle">@${escapeHTML(author.username)}</span>
          </div>
          <span class="post-time-meta" title="${fullDate}">${timeLabel}</span>
        </div>
      </a>

      ${isAuthor ? `
        <div style="position: relative;">
          <button type="button" class="btn-icon post-options-menu-btn" title="More options" aria-label="Post options">
            ${icons.more()}
          </button>
          <div class="post-dropdown-menu" style="display: none; position: absolute; right: 0; top: 100%; background: var(--bg-surface); border: 1px solid var(--border-hairline); border-radius: var(--rad-md); box-shadow: var(--shadow-floating); z-index: 20; min-width: 130px; padding: 4px;">
            <button type="button" class="btn btn-ghost btn-sm post-delete-btn" style="width: 100%; justify-content: flex-start; color: #EF4444;">
              ${icons.trash('nav-icon')}
              <span>Delete</span>
            </button>
          </div>
        </div>
      ` : ''}
    </div>

    <!-- Post Text Content -->
    ${safeText ? `
      <div class="post-body">
        ${safeText}
      </div>
    ` : ''}

    <!-- Edge-to-Edge Media (Instagram Style) -->
    ${post.image ? `
      <div class="post-media-container" title="Double tap to like, click to enlarge">
        <img src="${escapeHTML(post.image)}" alt="Post image" class="post-media-img" loading="lazy" />
        <div class="double-tap-heart">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="#EF4444" stroke="#FFFFFF" stroke-width="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </div>
      </div>
    ` : ''}

    <!-- Actions Bar (Like / Reactions, Comment, Bookmark, Share) -->
    <div class="post-actions-bar">
      <div class="post-actions-left">
        <!-- Reaction Wrapper with Facebook Popup -->
        <div class="reaction-btn-wrapper">
          <div class="reaction-bar-popup" aria-label="Choose reaction">
            <button type="button" class="reaction-emoji-btn" data-reaction-type="like" title="Like">👍</button>
            <button type="button" class="reaction-emoji-btn" data-reaction-type="love" title="Love">❤️</button>
            <button type="button" class="reaction-emoji-btn" data-reaction-type="haha" title="Haha">😂</button>
            <button type="button" class="reaction-emoji-btn" data-reaction-type="wow" title="Wow">😮</button>
            <button type="button" class="reaction-emoji-btn" data-reaction-type="sad" title="Sad">😢</button>
          </div>

          <button type="button" class="post-action-btn post-action-like ${isLiked ? 'liked' : ''}" aria-label="Like or react">
            ${isLiked && reactionMeta ? `
              <span style="font-size: 1.15rem; line-height: 1;">${reactionMeta.emoji}</span>
              <span style="color: ${reactionMeta.color}; font-weight: 700;">${reactionMeta.label}</span>
            ` : `
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span>Like</span>
            `}
          </button>
        </div>

        <!-- Comment Button -->
        <a href="/post/${post._id}" class="post-action-btn" aria-label="View or write comments">
          ${icons.message()}
          <span>${formatCount(post.commentsCount || 0)}</span>
        </a>

        <!-- Share Button -->
        <button type="button" class="post-action-btn post-action-share" aria-label="Share post">
          ${icons.share()}
        </button>
      </div>

      <!-- Bookmark Button -->
      <button type="button" class="post-action-btn post-action-bookmark ${post.bookmarkedByMe ? 'bookmarked' : ''}" aria-label="Save bookmark">
        ${icons.bookmark()}
      </button>
    </div>

    <!-- Reaction Summary Strip -->
    <div class="post-reaction-summary" style="${totalReactions > 0 ? 'display: flex;' : 'display: none;'}">
      <div class="reaction-icons-cluster">
        ${iconsHtml}
      </div>
      <span>${summaryLabel}</span>
    </div>

    <!-- Inline Comment Input Row (Instagram Style) -->
    <div class="post-inline-comment">
      ${renderAvatarHTML(getCurrentUser(), 'avatar-xs')}
      <input type="text" class="inline-comment-input" placeholder="Add a comment..." aria-label="Add a comment" />
      <button type="button" class="inline-comment-submit">Post</button>
    </div>
  `;

  // Attach Reaction Bar Logic
  attachReactions(card, post);

  // Attach Double Tap Heart Burst on Media
  const mediaContainer = card.querySelector('.post-media-container');
  const heartAnim = card.querySelector('.double-tap-heart');
  if (mediaContainer && heartAnim) {
    let lastTap = 0;
    mediaContainer.addEventListener('pointerdown', async (e) => {
      const now = Date.now();
      if (now - lastTap < 320) {
        // Trigger heart burst
        heartAnim.classList.remove('animate');
        void heartAnim.offsetWidth;
        heartAnim.classList.add('animate');

        if (!post.isLiked && isAuthenticated()) {
          try {
            const res = await api.post(`/posts/${post._id}/like`, { type: 'love' });
            post.isLiked = res.isLiked;
            post.myReaction = res.myReaction;
            post.reactionSummary = res.reactionSummary;
            post.likesCount = res.likesCount;
            const likeBtn = card.querySelector('.post-action-like');
            if (likeBtn) {
              likeBtn.classList.add('liked');
              likeBtn.innerHTML = `
                <span style="font-size: 1.15rem; line-height: 1;">❤️</span>
                <span style="color: var(--reaction-love); font-weight: 700;">Love</span>
              `;
            }
          } catch (_) {}
        }
      }
      lastTap = now;
    });

    const imgEl = mediaContainer.querySelector('img');
    if (imgEl) {
      imgEl.addEventListener('click', (e) => {
        // Only open lightbox if not a double tap
        setTimeout(() => {
          if (Date.now() - lastTap > 350) {
            openLightbox(post.image, post.text || 'Sangam post image');
          }
        }, 340);
      });
    }
  }

  // Bookmark Toggle
  const bookmarkBtn = card.querySelector('.post-action-bookmark');
  if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!isAuthenticated()) {
        openGuestModal('save posts to your bookmarks');
        return;
      }
      try {
        const res = await api.post(`/posts/${post._id}/bookmark`);
        post.bookmarkedByMe = res.bookmarked;
        if (res.bookmarked) {
          bookmarkBtn.classList.add('bookmarked');
          showToast('Saved to your Bookmarks');
        } else {
          bookmarkBtn.classList.remove('bookmarked');
          showToast('Removed from Bookmarks');
        }
      } catch (err) {
        showToast(err.message || 'Failed to update bookmark');
      }
    });
  }

  // Share / Copy Link
  const shareBtn = card.querySelector('.post-action-share');
  if (shareBtn) {
    shareBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = `${window.location.origin}/post/${post._id}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          showToast('Post link copied to clipboard!');
        }).catch(() => {
          showToast(url);
        });
      } else {
        showToast(url);
      }
    });
  }

  // Inline Comment Submission
  const commentInput = card.querySelector('.inline-comment-input');
  const commentSubmit = card.querySelector('.inline-comment-submit');

  if (commentInput && commentSubmit) {
    commentInput.addEventListener('input', () => {
      if (commentInput.value.trim().length > 0) {
        commentSubmit.classList.add('ready');
      } else {
        commentSubmit.classList.remove('ready');
      }
    });

    const submitComment = async () => {
      const text = commentInput.value.trim();
      if (!text) return;
      if (!isAuthenticated()) {
        openGuestModal('join the conversation with a comment');
        return;
      }

      try {
        commentSubmit.disabled = true;
        await api.post(`/posts/${post._id}/comments`, { text });
        commentInput.value = '';
        commentSubmit.classList.remove('ready');
        commentSubmit.disabled = false;
        post.commentsCount = (post.commentsCount || 0) + 1;
        showToast('Comment posted!');
      } catch (err) {
        commentSubmit.disabled = false;
        showToast(err.message || 'Failed to post comment');
      }
    };

    commentSubmit.addEventListener('click', submitComment);
    commentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitComment();
      }
    });
  }

  // Author Delete Option
  const moreBtn = card.querySelector('.post-options-menu-btn');
  const dropdownMenu = card.querySelector('.post-dropdown-menu');
  const deleteBtn = card.querySelector('.post-delete-btn');

  if (moreBtn && dropdownMenu && deleteBtn) {
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = dropdownMenu.style.display === 'block';
      dropdownMenu.style.display = isVisible ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
      if (!moreBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.style.display = 'none';
      }
    });

    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      dropdownMenu.style.display = 'none';

      const confirmed = await confirmModal({
        title: 'Delete Post?',
        message: 'This cannot be undone and will permanently remove this post.',
        confirmText: 'Delete',
        confirmDanger: true,
      });

      if (!confirmed) return;

      try {
        await api.delete(`/posts/${post._id}`);
        card.style.transition = 'all 0.3s ease-out';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
          card.remove();
          if (onPostDeleted) onPostDeleted(post._id);
        }, 300);
        showToast('Post deleted');
      } catch (err) {
        showToast(err.message || 'Failed to delete post');
      }
    });
  }

  // Click entire card to view post details (unless clicking an interactive child)
  card.addEventListener('click', (e) => {
    if (e.target.closest('a, button, input, .post-media-container, .post-dropdown-menu, .reaction-bar-popup')) return;
    window.location.href = `/post/${post._id}`;
  });

  return card;
};

import { api } from '../core/api.js';
import { isAuthenticated } from '../core/auth.js';
import { openGuestModal } from '../core/modal.js';
import { showToast } from '../core/toast.js';

export const REACTION_MAP = {
  like: { label: 'Like', emoji: '👍', color: 'var(--reaction-like)' },
  love: { label: 'Love', emoji: '❤️', color: 'var(--reaction-love)' },
  haha: { label: 'Haha', emoji: '😂', color: 'var(--reaction-haha)' },
  wow:  { label: 'Wow',  emoji: '😮', color: 'var(--reaction-wow)' },
  sad:  { label: 'Sad',  emoji: '😢', color: 'var(--reaction-sad)' }
};

/**
 * Attach Facebook-style reactions to a post element
 */
export const attachReactions = (postEl, postData, onUpdate) => {
  const reactionWrapper = postEl.querySelector('.reaction-btn-wrapper');
  if (!reactionWrapper) return;

  const likeBtn = reactionWrapper.querySelector('.post-action-like');
  const popup = reactionWrapper.querySelector('.reaction-bar-popup');
  if (!likeBtn || !popup) return;

  // Single click toggle default 'like' or 'love'
  likeBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!isAuthenticated()) {
      openGuestModal('react to posts');
      return;
    }

    const currentReaction = postData.myReaction;
    // If already reacted, clicking like removes it
    const reactionType = currentReaction ? currentReaction : 'love';

    try {
      const res = await api.post(`/posts/${postData._id}/like`, { type: reactionType });
      postData.isLiked = res.isLiked;
      postData.myReaction = res.myReaction;
      postData.reactionSummary = res.reactionSummary;
      postData.likesCount = res.likesCount;

      updatePostReactionUI(postEl, postData);
      if (onUpdate) onUpdate(postData);
    } catch (err) {
      showToast(err.message || 'Failed to update reaction');
    }
  });

  // Reaction Emoji clicks
  const emojiBtns = popup.querySelectorAll('.reaction-emoji-btn');
  emojiBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!isAuthenticated()) {
        openGuestModal('react to posts');
        return;
      }

      const type = btn.dataset.reactionType;
      try {
        const res = await api.post(`/posts/${postData._id}/like`, { type });
        postData.isLiked = res.isLiked;
        postData.myReaction = res.myReaction;
        postData.reactionSummary = res.reactionSummary;
        postData.likesCount = res.likesCount;

        updatePostReactionUI(postEl, postData);
        if (onUpdate) onUpdate(postData);
      } catch (err) {
        showToast(err.message || 'Failed to update reaction');
      }
    });
  });
};

/**
 * Update the UI for reactions on a post
 */
export const updatePostReactionUI = (postEl, postData) => {
  const likeBtn = postEl.querySelector('.post-action-like');
  const summaryEl = postEl.querySelector('.post-reaction-summary');

  if (likeBtn) {
    if (postData.isLiked && postData.myReaction) {
      const reactionMeta = REACTION_MAP[postData.myReaction] || REACTION_MAP.like;
      likeBtn.classList.add('liked');
      likeBtn.innerHTML = `
        <span style="font-size: 1.15rem; line-height: 1;">${reactionMeta.emoji}</span>
        <span style="color: ${reactionMeta.color}; font-weight: 700;">${reactionMeta.label}</span>
      `;
    } else {
      likeBtn.classList.remove('liked');
      likeBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <span>Like</span>
      `;
    }
  }

  // Update reaction summary strip
  if (summaryEl) {
    const total = postData.likesCount || 0;
    if (total === 0) {
      summaryEl.style.display = 'none';
      summaryEl.innerHTML = '';
      return;
    }

    summaryEl.style.display = 'flex';
    const summary = postData.reactionSummary || {};
    // Extract top non-zero reactions
    const topReactions = Object.entries(summary)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => REACTION_MAP[type]?.emoji || '❤️');

    let iconsHtml = topReactions.map(emoji => `<span class="reaction-icon-mini">${emoji}</span>`).join('');

    let labelText = `${total} ${total === 1 ? 'reaction' : 'reactions'}`;
    if (postData.isLiked && postData.myReaction) {
      if (total === 1) {
        labelText = 'You reacted';
      } else {
        labelText = `You and ${total - 1} other${total > 2 ? 's' : ''}`;
      }
    }

    summaryEl.innerHTML = `
      <div class="reaction-icons-cluster">
        ${iconsHtml}
      </div>
      <span>${labelText}</span>
    `;
  }
};

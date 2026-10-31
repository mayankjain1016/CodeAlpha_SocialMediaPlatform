import { renderAppShell } from '../core/shell.js';
import { api } from '../core/api.js';
import { isAuthenticated } from '../core/auth.js';
import { renderPostCard } from '../components/postCard.js';
import { renderFeedSkeletons } from '../components/skeletons.js';
import { icons } from '../core/icons.js';
import { staggerEntrance } from '../core/motion.js';

const streamEl = document.getElementById('bookmarks-stream');

export const initBookmarksPage = async () => {
  renderAppShell('bookmarks');

  if (!isAuthenticated()) {
    streamEl.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-state-svg">${icons.bookmark()}</div>
        <h3 style="font-family: var(--font-display); font-size: 1.3rem; margin-bottom: 6px;">Save posts for later</h3>
        <p style="color: var(--text-secondary); max-width: 360px; margin: 0 auto 16px; font-size: 0.9rem;">
          Log in to build your private collection of articles, insights, and code snippets.
        </p>
        <a href="/login" class="btn btn-primary btn-sm">Log In</a>
      </div>
    `;
    return;
  }

  await loadBookmarks();
};

const loadBookmarks = async () => {
  streamEl.innerHTML = renderFeedSkeletons(3);

  try {
    const data = await api.get('/posts/bookmarks?limit=30');
    const items = data.items || [];

    if (items.length === 0) {
      streamEl.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-state-svg">
            <svg viewBox="0 0 140 140" fill="none" width="100%" height="100%">
              <rect x="36" y="24" width="68" height="92" rx="12" stroke="var(--hairline-strong)" stroke-width="2"/>
              <path d="M50 24V78L70 64L90 78V24" fill="var(--teal-500)" opacity="0.9"/>
              <line x1="48" y1="92" x2="92" y2="92" stroke="var(--marigold-400)" stroke-width="3" stroke-linecap="round"/>
              <line x1="48" y1="102" x2="76" y2="102" stroke="var(--hairline-strong)" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </div>
          <h3 style="font-family: var(--font-display); font-size: 1.3rem; margin-bottom: 6px;">Your collection is empty</h3>
          <p style="color: var(--text-secondary); max-width: 340px; margin: 0 auto 16px; font-size: 0.9rem;">
            When you see something worth coming back to, click the bookmark pill on the post to save it here.
          </p>
          <a href="/explore" class="btn btn-secondary btn-sm">Explore Streams</a>
        </div>
      `;
      return;
    }

    streamEl.innerHTML = '';
    const fragment = document.createDocumentFragment();
    items.forEach(post => {
      fragment.appendChild(renderPostCard(post, {
        onPostDeleted: () => loadBookmarks()
      }));
    });
    streamEl.appendChild(fragment);

    staggerEntrance(streamEl);
  } catch (err) {
    streamEl.innerHTML = `<div style="padding: 32px; text-align: center; color: var(--coral-500);"><p>${err.message}</p></div>`;
  }
};

initBookmarksPage();

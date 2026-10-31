import { renderAppShell } from '../core/shell.js';
import { api } from '../core/api.js';
import { isAuthenticated } from '../core/auth.js';
import { renderPostCard } from '../components/postCard.js';
import { renderFeedSkeletons } from '../components/skeletons.js';
import { icons } from '../core/icons.js';
import { staggerEntrance } from '../core/motion.js';

const streamEl = document.getElementById('bookmarks-stream');

const initBookmarksPage = async () => {
  renderAppShell('bookmarks');

  if (!isAuthenticated()) {
    streamEl.innerHTML = `
      <div style="padding: 48px 24px; text-align: center;">
        <h3 style="margin-bottom: 8px;">Save posts for later</h3>
        <p style="color: var(--text-secondary); max-width: 340px; margin: 0 auto 16px;">Log in to bookmark posts, code snippets, and stories.</p>
        <a href="/login" class="btn btn-primary">Log In</a>
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
        <div style="padding: 64px 24px; text-align: center; color: var(--text-secondary);">
          <div style="width: 48px; height: 48px; margin: 0 auto 16px; border-radius: var(--radius-full); background: var(--bg-surface-subtle); display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
            ${icons.bookmark('nav-icon')}
          </div>
          <h3 style="margin-bottom: 6px; color: var(--text-main);">Save posts for later</h3>
          <p style="max-width: 320px; margin: 0 auto;">Don’t let the good stuff get away! Tap the bookmark icon on any post to save it here.</p>
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
    streamEl.innerHTML = `<div style="padding: 32px; text-align: center; color: var(--red-500);"><p>${err.message}</p></div>`;
  }
};

initBookmarksPage();

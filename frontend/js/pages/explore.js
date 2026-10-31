import { renderAppShell } from '../core/shell.js';
import { api } from '../core/api.js';
import { renderAvatarHTML } from '../core/avatar.js';
import { icons } from '../core/icons.js';
import { staggerEntrance } from '../core/motion.js';
import { debounce, escapeHTML, linkify } from '../core/utils.js';
import { openLightbox } from '../components/lightbox.js';

let activeTag = null;
let nextCursor = null;
let isLoading = false;
let hasReachedEnd = false;

const masonryEl = document.getElementById('explore-masonry-stream');
const sentinelEl = document.getElementById('explore-sentinel');
const chipsContainer = document.getElementById('topic-chips-container');
const searchInput = document.getElementById('explore-search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const peopleResults = document.getElementById('explore-people-results');

export const initExplorePage = async () => {
  renderAppShell('explore');

  // Read URL query param ?tag=
  const urlParams = new URLSearchParams(window.location.search);
  const tagParam = urlParams.get('tag');
  if (tagParam && tagParam !== 'all') {
    activeTag = tagParam.replace(/^#/, '').toLowerCase();
  }

  syncChipState();
  setupListeners();
  await loadExplorePosts(true);
};

const syncChipState = () => {
  if (!chipsContainer) return;
  const targetTag = activeTag || 'all';
  chipsContainer.querySelectorAll('.topic-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tag === targetTag);
  });
};

const setupListeners = () => {
  // Topic Chip click
  if (chipsContainer) {
    chipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.topic-chip');
      if (!chip) return;
      const tag = chip.dataset.tag;
      if (tag === 'all') {
        activeTag = null;
        window.history.pushState({}, '', '/explore');
      } else {
        activeTag = tag;
        window.history.pushState({}, '', `/explore?tag=${encodeURIComponent(tag)}`);
      }
      syncChipState();
      loadExplorePosts(true);
    });
  }

  // Clear search input button
  if (clearSearchBtn && searchInput) {
    clearSearchBtn.onclick = () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      peopleResults.style.display = 'none';
      peopleResults.innerHTML = '';
      activeTag = null;
      loadExplorePosts(true);
    };
  }

  // Search input handler (people + tag filtering)
  const onSearch = debounce(async (query) => {
    const trimmed = query.trim();
    if (!trimmed) {
      if (clearSearchBtn) clearSearchBtn.style.display = 'none';
      if (peopleResults) {
        peopleResults.style.display = 'none';
        peopleResults.innerHTML = '';
      }
      return;
    }

    if (clearSearchBtn) clearSearchBtn.style.display = 'block';

    // If starts with #, filter stream directly
    if (trimmed.startsWith('#')) {
      activeTag = trimmed.replace(/^#/, '').toLowerCase();
      syncChipState();
      loadExplorePosts(true);
      return;
    }

    try {
      const data = await api.get(`/users/search?q=${encodeURIComponent(trimmed)}`);
      const users = data.users || [];
      if (users.length > 0 && peopleResults) {
        peopleResults.innerHTML = `
          <div style="padding: 6px 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">People</div>
          ${users.map(u => `
            <a href="/u/${escapeHTML(u.username)}" style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: var(--radius-md); text-decoration: none; color: var(--text-main); transition: background var(--dur-fast) ease;" class="dropdown-item">
              ${renderAvatarHTML(u, 'avatar-xs')}
              <div>
                <div style="font-weight: 700; font-size: 0.88rem;">${escapeHTML(u.name)}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">@${escapeHTML(u.username)}</div>
              </div>
            </a>
          `).join('')}
        `;
        peopleResults.style.display = 'block';
      } else if (peopleResults) {
        peopleResults.style.display = 'none';
      }
    } catch (_) {
      if (peopleResults) peopleResults.style.display = 'none';
    }
  }, 220);

  if (searchInput) {
    searchInput.addEventListener('input', (e) => onSearch(e.target.value));
  }

  // Infinite scroll
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading && !hasReachedEnd) {
      loadExplorePosts(false);
    }
  }, { rootMargin: '240px' });
  if (sentinelEl) observer.observe(sentinelEl);
};

const renderExploreTile = (post) => {
  const tile = document.createElement('article');
  tile.className = 'explore-tile spotlight-card';
  tile.id = `explore-${post._id}`;

  const author = post.author || { name: 'Anonymous', username: 'unknown', avatarHue: 175 };

  if (post.image) {
    tile.innerHTML = `
      <div class="explore-tile-img-wrap">
        <img src="${escapeHTML(post.image)}" alt="Explore post image" loading="lazy">
        <div class="explore-tile-overlay">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            ${renderAvatarHTML(author, 'avatar-xs')}
            <span style="font-weight: 700; font-size: 0.88rem; text-shadow: 0 1px 4px rgba(0,0,0,0.6);">${escapeHTML(author.name)}</span>
          </div>
          ${post.text ? `<p style="font-size: 0.84rem; line-height: 1.35; margin: 0 0 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; opacity: 0.95;">${escapeHTML(post.text)}</p>` : ''}
          <div style="display: flex; gap: 14px; font-size: 0.78rem; font-weight: 600;">
            <span style="display: flex; align-items: center; gap: 4px;">${icons.heart()} ${post.likesCount || 0}</span>
            <span style="display: flex; align-items: center; gap: 4px;">${icons.message()} ${post.commentsCount || 0}</span>
          </div>
        </div>
      </div>
    `;

    const imgEl = tile.querySelector('img');
    if (imgEl) {
      imgEl.onclick = (e) => {
        e.stopPropagation();
        openLightbox(post.image, post.text || 'Sangam Explore Image');
      };
    }
  } else {
    tile.innerHTML = `
      <div class="explore-tile-content">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
          ${renderAvatarHTML(author, 'avatar-xs')}
          <div style="min-width: 0;">
            <div style="font-family: var(--font-display); font-weight: 700; font-size: 0.9rem; color: var(--text-main);">${escapeHTML(author.name)}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">@${escapeHTML(author.username)}</div>
          </div>
        </div>
        <div style="font-size: 0.95rem; line-height: 1.55; color: var(--text-main); margin-bottom: 14px;">
          ${linkify(post.text || '')}
        </div>
        <div style="display: flex; align-items: center; gap: 16px; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); border-top: 1px solid var(--hairline); padding-top: 10px;">
          <span style="display: flex; align-items: center; gap: 4px;">${icons.heart()} ${post.likesCount || 0}</span>
          <span style="display: flex; align-items: center; gap: 4px;">${icons.message()} ${post.commentsCount || 0}</span>
        </div>
      </div>
    `;
  }

  // Navigate to post detail when clicking tile
  tile.onclick = (e) => {
    if (e.target.closest('a, button, .explore-tile-img-wrap img')) return;
    window.location.href = `/post/${post._id}`;
  };

  return tile;
};

const loadExplorePosts = async (reset = false) => {
  if (!masonryEl) return;
  if (isLoading) return;
  if (!reset && hasReachedEnd) return;

  isLoading = true;

  if (reset) {
    nextCursor = null;
    hasReachedEnd = false;
    masonryEl.innerHTML = `
      <div class="explore-tile skeleton" style="height: 240px;"></div>
      <div class="explore-tile skeleton" style="height: 180px;"></div>
      <div class="explore-tile skeleton" style="height: 300px;"></div>
      <div class="explore-tile skeleton" style="height: 210px;"></div>
    `;
    if (sentinelEl) sentinelEl.style.display = 'block';
  }

  try {
    let url = `/posts/explore?limit=12${nextCursor ? `&cursor=${nextCursor}` : ''}`;
    if (activeTag) {
      url += `&tag=${encodeURIComponent(activeTag)}`;
    }

    const data = await api.get(url);
    const items = data.items || [];
    nextCursor = data.nextCursor;

    if (reset) masonryEl.innerHTML = '';

    if (items.length === 0 && reset) {
      masonryEl.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1; width: 100%; margin: 24px auto;">
          <div class="empty-state-svg">${icons.compass()}</div>
          <h3 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; margin: 0 0 6px 0;">No streams found</h3>
          <p style="color: var(--text-secondary); max-width: 340px; margin: 0 auto; font-size: 0.9rem;">
            ${activeTag ? `No conversations tagged #${escapeHTML(activeTag)} yet. Be the first to spark a topic!` : 'Explore streams are quiet right now.'}
          </p>
        </div>
      `;
      if (sentinelEl) sentinelEl.style.display = 'none';
      hasReachedEnd = true;
    } else {
      const fragment = document.createDocumentFragment();
      items.forEach(post => {
        fragment.appendChild(renderExploreTile(post));
      });
      masonryEl.appendChild(fragment);

      staggerEntrance(masonryEl, '.explore-tile');

      if (!nextCursor) {
        hasReachedEnd = true;
        if (sentinelEl) sentinelEl.innerHTML = `<span style="color: var(--text-faint); font-size: 0.82rem;">You've reached the confluence of all streams</span>`;
      } else {
        if (sentinelEl) sentinelEl.innerHTML = `<span class="btn-spinner" style="display: inline-block;"></span>`;
      }
    }
  } catch (err) {
    if (reset) {
      masonryEl.innerHTML = `<div style="padding: 32px; text-align: center; color: var(--coral-500);"><p>${err.message}</p></div>`;
    }
    if (sentinelEl) sentinelEl.style.display = 'none';
  } finally {
    isLoading = false;
  }
};

initExplorePage();

import { renderAppShell } from '../core/shell.js';
import { api } from '../core/api.js';
import { renderPostCard } from '../components/postCard.js';
import { renderUserCard } from '../components/userCard.js';
import { renderFeedSkeletons } from '../components/skeletons.js';
import { staggerEntrance } from '../core/motion.js';
import { debounce, escapeHTML } from '../core/utils.js';

let activeTag = null;
let nextCursor = null;
let isLoading = false;
let hasReachedEnd = false;

const streamEl = document.getElementById('explore-posts-stream');
const sentinelEl = document.getElementById('explore-sentinel');
const trendingStrip = document.getElementById('trending-strip');
const activeTagChip = document.getElementById('active-tag-chip');
const chipTagName = document.getElementById('chip-tag-name');
const clearTagBtn = document.getElementById('clear-tag-btn');
const searchInput = document.getElementById('explore-search-input');
const peopleResults = document.getElementById('explore-people-results');

const initExplorePage = async () => {
  renderAppShell('explore');

  // Read URL query param ?tag=
  const urlParams = new URLSearchParams(window.location.search);
  const tagParam = urlParams.get('tag');
  if (tagParam) {
    activeTag = tagParam.replace(/^#/, '').toLowerCase();
  }

  updateTagChip();
  setupListeners();
  await loadTrendingStrip();
  await loadExplorePosts(true);
};

const updateTagChip = () => {
  if (activeTag) {
    chipTagName.textContent = `#${activeTag}`;
    activeTagChip.style.display = 'inline-flex';
  } else {
    activeTagChip.style.display = 'none';
  }
};

const setupListeners = () => {
  clearTagBtn.onclick = () => {
    activeTag = null;
    window.history.pushState({}, '', '/explore');
    updateTagChip();
    loadExplorePosts(true);
  };

  // Search input inside explore page
  const onSearch = debounce(async (query) => {
    const trimmed = query.trim();
    if (!trimmed) {
      peopleResults.style.display = 'none';
      peopleResults.innerHTML = '';
      return;
    }

    try {
      const data = await api.get(`/users/search?q=${encodeURIComponent(trimmed)}`);
      const users = data.users || [];
      if (users.length > 0) {
        peopleResults.innerHTML = users.map(u => renderUserCard(u).outerHTML).join('');
        peopleResults.style.display = 'block';
      } else {
        peopleResults.style.display = 'none';
      }
    } catch (e) {
      peopleResults.style.display = 'none';
    }
  }, 250);

  searchInput.addEventListener('input', (e) => onSearch(e.target.value));

  // Infinite scroll
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading && !hasReachedEnd) {
      loadExplorePosts(false);
    }
  }, { rootMargin: '200px' });
  observer.observe(sentinelEl);
};

const loadTrendingStrip = async () => {
  try {
    const data = await api.get('/trending');
    const tags = data.trending || [];
    trendingStrip.innerHTML = tags.map(t => `
      <button class="btn btn-secondary btn-sm trend-pill ${activeTag === t.tag ? 'btn-primary' : ''}" data-tag="${escapeHTML(t.tag)}" style="border-radius: var(--radius-full); white-space: nowrap;">
        #${escapeHTML(t.tag)}
      </button>
    `).join('');

    trendingStrip.querySelectorAll('.trend-pill').forEach(btn => {
      btn.onclick = () => {
        const tag = btn.dataset.tag;
        if (activeTag === tag) return;
        activeTag = tag;
        window.history.pushState({}, '', `/explore?tag=${encodeURIComponent(tag)}`);
        updateTagChip();
        trendingStrip.querySelectorAll('.trend-pill').forEach(b => {
          b.classList.toggle('btn-primary', b.dataset.tag === activeTag);
          b.classList.toggle('btn-secondary', b.dataset.tag !== activeTag);
        });
        loadExplorePosts(true);
      };
    });
  } catch (e) {
    trendingStrip.innerHTML = '';
  }
};

const loadExplorePosts = async (reset = false) => {
  if (isLoading) return;
  if (!reset && hasReachedEnd) return;

  isLoading = true;

  if (reset) {
    nextCursor = null;
    hasReachedEnd = false;
    streamEl.innerHTML = renderFeedSkeletons(4);
    sentinelEl.style.display = 'block';
  }

  try {
    let url = `/posts/explore?limit=12${nextCursor ? `&cursor=${nextCursor}` : ''}`;
    if (activeTag) {
      url += `&tag=${encodeURIComponent(activeTag)}`;
    }

    const data = await api.get(url);
    const items = data.items || [];
    nextCursor = data.nextCursor;

    if (reset) streamEl.innerHTML = '';

    if (items.length === 0 && reset) {
      streamEl.innerHTML = `
        <div style="padding: 48px 24px; text-align: center; color: var(--text-secondary);">
          <h3 style="margin-bottom: 8px; color: var(--text-main);">No posts found</h3>
          <p style="max-width: 320px; margin: 0 auto;">${activeTag ? `No posts matching #${escapeHTML(activeTag)} yet.` : 'Explore is fresh and quiet right now.'}</p>
        </div>
      `;
      sentinelEl.style.display = 'none';
      hasReachedEnd = true;
    } else {
      const fragment = document.createDocumentFragment();
      items.forEach(post => {
        fragment.appendChild(renderPostCard(post));
      });
      streamEl.appendChild(fragment);

      staggerEntrance(streamEl);

      if (!nextCursor) {
        hasReachedEnd = true;
        sentinelEl.innerHTML = `<span style="color: var(--text-faint);">End of explore feed</span>`;
      } else {
        sentinelEl.innerHTML = `<span class="btn-spinner" style="display: inline-block; border-color: var(--border-medium); border-top-color: var(--primary);"></span>`;
      }
    }
  } catch (err) {
    if (reset) {
      streamEl.innerHTML = `<div style="padding: 32px; text-align: center; color: var(--red-500);"><p>${err.message}</p></div>`;
    }
    sentinelEl.style.display = 'none';
  } finally {
    isLoading = false;
  }
};

initExplorePage();

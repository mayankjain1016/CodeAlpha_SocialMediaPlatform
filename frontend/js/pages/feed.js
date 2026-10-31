import { renderAppShell } from '../core/shell.js';
import { api } from '../core/api.js';
import { isAuthenticated } from '../core/auth.js';
import { renderPostCard } from '../components/postCard.js';
import { initComposer } from '../components/composer.js';
import { renderFeedSkeletons } from '../components/skeletons.js';
import { staggerEntrance } from '../core/motion.js';

let activeTab = 'following'; // 'following' | 'explore'
let nextCursor = null;
let isLoading = false;
let hasReachedEnd = false;

const streamEl = document.getElementById('posts-stream');
const sentinelEl = document.getElementById('feed-sentinel');
const tabFollowing = document.getElementById('tab-following');
const tabExplore = document.getElementById('tab-explore');
const tabIndicator = document.getElementById('feed-tab-indicator');
const composerMount = document.getElementById('composer-mount');

const initFeedPage = async () => {
  renderAppShell('home');

  // If user is guest, default tab to explore
  if (!isAuthenticated()) {
    activeTab = 'explore';
    tabFollowing.classList.remove('active');
    tabFollowing.setAttribute('aria-selected', 'false');
    tabExplore.classList.add('active');
    tabExplore.setAttribute('aria-selected', 'true');
    composerMount.style.display = 'none';
  } else {
    // Mount composer for authenticated user
    initComposer(composerMount, {
      onSuccess: (newPost) => {
        // Prepend to stream with animation
        const card = renderPostCard(newPost);
        card.classList.add('animate-rise');
        streamEl.prepend(card);
      }
    });
  }

  updateTabIndicator();
  setupTabListeners();
  setupInfiniteScroll();

  await loadPosts(true);
};

const updateTabIndicator = () => {
  const activeBtn = activeTab === 'following' ? tabFollowing : tabExplore;
  if (!activeBtn || !tabIndicator) return;
  tabIndicator.style.width = `${activeBtn.offsetWidth}px`;
  tabIndicator.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
};

const setupTabListeners = () => {
  window.addEventListener('resize', updateTabIndicator);

  tabFollowing.onclick = () => {
    if (activeTab === 'following') return;
    activeTab = 'following';
    tabFollowing.classList.add('active');
    tabFollowing.setAttribute('aria-selected', 'true');
    tabExplore.classList.remove('active');
    tabExplore.setAttribute('aria-selected', 'false');
    updateTabIndicator();
    loadPosts(true);
  };

  tabExplore.onclick = () => {
    if (activeTab === 'explore') return;
    activeTab = 'explore';
    tabExplore.classList.add('active');
    tabExplore.setAttribute('aria-selected', 'true');
    tabFollowing.classList.remove('active');
    tabFollowing.setAttribute('aria-selected', 'false');
    updateTabIndicator();
    loadPosts(true);
  };
};

const loadPosts = async (reset = false) => {
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
    let endpoint = '';
    if (activeTab === 'following') {
      if (!isAuthenticated()) {
        streamEl.innerHTML = `
          <div style="padding: 48px 24px; text-align: center;">
            <h3 style="margin-bottom: 8px;">Welcome to Sangam</h3>
            <p style="color: var(--text-secondary); max-width: 360px; margin: 0 auto 16px;">Log in to follow other builders and personalize your home feed.</p>
            <a href="/login" class="btn btn-primary">Log In</a>
          </div>
        `;
        sentinelEl.style.display = 'none';
        isLoading = false;
        return;
      }
      endpoint = `/posts/feed?limit=10${nextCursor ? `&cursor=${nextCursor}` : ''}`;
    } else {
      endpoint = `/posts/explore?limit=10${nextCursor ? `&cursor=${nextCursor}` : ''}`;
    }

    const data = await api.get(endpoint);
    const items = data.items || [];
    nextCursor = data.nextCursor;

    if (reset) {
      streamEl.innerHTML = '';
    }

    if (items.length === 0 && reset) {
      streamEl.innerHTML = `
        <div style="padding: 48px 24px; text-align: center; color: var(--text-secondary);">
          <h3 style="margin-bottom: 8px; color: var(--text-main);">No posts yet</h3>
          <p style="max-width: 340px; margin: 0 auto;">Follow people or share what is on your mind to get your feed rolling!</p>
        </div>
      `;
      sentinelEl.style.display = 'none';
      hasReachedEnd = true;
    } else {
      const fragment = document.createDocumentFragment();
      items.forEach(post => {
        const card = renderPostCard(post);
        fragment.appendChild(card);
      });
      streamEl.appendChild(fragment);

      staggerEntrance(streamEl);

      if (!nextCursor) {
        hasReachedEnd = true;
        sentinelEl.innerHTML = `<span style="color: var(--text-faint);">You’re all caught up!</span>`;
      } else {
        sentinelEl.innerHTML = `<span class="btn-spinner" style="display: inline-block; border-color: var(--border-medium); border-top-color: var(--primary);"></span>`;
      }
    }
  } catch (err) {
    if (reset) {
      streamEl.innerHTML = `
        <div style="padding: 32px 24px; text-align: center; color: var(--red-500);">
          <p>${err.message || 'Failed to load posts'}</p>
          <button class="btn btn-secondary btn-sm" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
    sentinelEl.style.display = 'none';
  } finally {
    isLoading = false;
  }
};

const setupInfiniteScroll = () => {
  const observer = new IntersectionObserver((entries) => {
    const target = entries[0];
    if (target.isIntersecting && !isLoading && !hasReachedEnd) {
      loadPosts(false);
    }
  }, {
    rootMargin: '200px',
  });

  observer.observe(sentinelEl);
};

initFeedPage();

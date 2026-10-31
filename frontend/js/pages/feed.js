import { renderAppShell } from '../core/shell.js';
import { api } from '../core/api.js';
import { isAuthenticated, getCurrentUser } from '../core/auth.js';
import { renderPostCard } from '../components/postCard.js';
import { initComposer } from '../components/composer.js';
import { renderFeedSkeletons } from '../components/skeletons.js';
import { renderAvatarHTML } from '../core/avatar.js';
import { countUp, staggerEntrance } from '../core/motion.js';
import { icons } from '../core/icons.js';
import { escapeHTML } from '../core/utils.js';

let activeTab = 'following'; // 'following' | 'explore'
let nextCursor = null;
let isLoading = false;
let hasReachedEnd = false;

const pageRoot = document.getElementById('feed-page-root');

export const initFeedPage = async () => {
  renderAppShell('home');

  if (!isAuthenticated()) {
    renderGuestLanding();
  } else {
    renderAuthenticatedFeed();
  }
};

/**
 * Guest Landing Page ("/")
 */
const renderGuestLanding = async () => {
  pageRoot.innerHTML = `
    <!-- Signature Hero Section -->
    <section class="guest-hero-section">
      <div class="guest-hero-grid">
        <div class="guest-hero-copy">
          <div class="hero-pill-badge">
            <span>✨</span>
            <span>Sangam 2.0 &middot; Where rivers meet</span>
          </div>
          <h1 class="hero-headline">
            Where conversations <span class="hero-headline-highlight">meet.<svg class="hero-underline-svg" viewBox="0 0 260 16" fill="none"><path d="M6 10C50 3 170 3 254 11" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/></svg></span>
          </h1>
          <p class="hero-subtitle">
            An editorial-grade social space for builders, thinkers, and storytellers. Two distinct streams converging into genuine confluence &mdash; without algorithmic noise.
          </p>
          <div class="hero-cta-group">
            <a href="/register" class="btn btn-primary btn-lg">Join Sangam</a>
            <a href="#explore-stream" class="btn btn-secondary btn-lg" id="guest-explore-cta">Explore as guest</a>
          </div>
        </div>

        <!-- Drifting Marquee Columns -->
        <div class="hero-marquee-wrap" aria-hidden="true">
          <div class="marquee-col marquee-col-up" id="marquee-left">
            <div class="marquee-post-card">
              <div style="font-weight: 700; margin-bottom: 4px;">Aarav Sharma</div>
              <div style="color: var(--text-secondary); line-height: 1.4;">Writing code that feels like poetry. The frontend Renaissance is here with pure CSS and canvas. #webdev</div>
            </div>
            <div class="marquee-post-card">
              <div style="font-weight: 700; margin-bottom: 4px;">Priya Nair</div>
              <div style="color: var(--text-secondary); line-height: 1.4;">Nothing beats sunrise over Marine Drive with a hot chai. Mumbai mornings recharge the soul. #mumbai</div>
            </div>
            <div class="marquee-post-card">
              <div style="font-weight: 700; margin-bottom: 4px;">Rohan Gupta</div>
              <div style="color: var(--text-secondary); line-height: 1.4;">Just closed our seed round for climate-tech in Bengaluru! Grateful for early believers. #startups</div>
            </div>
            <div class="marquee-post-card">
              <div style="font-weight: 700; margin-bottom: 4px;">Aarav Sharma</div>
              <div style="color: var(--text-secondary); line-height: 1.4;">Writing code that feels like poetry. The frontend Renaissance is here with pure CSS and canvas. #webdev</div>
            </div>
          </div>
          <div class="marquee-col marquee-col-down" id="marquee-right">
            <div class="marquee-post-card">
              <div style="font-weight: 700; margin-bottom: 4px;">Ananya Iyer</div>
              <div style="color: var(--text-secondary); line-height: 1.4;">Filter coffee + fresh masala dosa in Matunga. Sunday mornings done right. #foodie</div>
            </div>
            <div class="marquee-post-card">
              <div style="font-weight: 700; margin-bottom: 4px;">Dev Patel</div>
              <div style="color: var(--text-secondary); line-height: 1.4;">Unbeaten at Wankhede! That final over yorker had the whole stadium holding its breath. #cricket</div>
            </div>
            <div class="marquee-post-card">
              <div style="font-weight: 700; margin-bottom: 4px;">Meera Rao</div>
              <div style="color: var(--text-secondary); line-height: 1.4;">The Western Ghats in full monsoon glory. Every bend in the trail is breathtaking. #travel</div>
            </div>
            <div class="marquee-post-card">
              <div style="font-weight: 700; margin-bottom: 4px;">Ananya Iyer</div>
              <div style="color: var(--text-secondary); line-height: 1.4;">Filter coffee + fresh masala dosa in Matunga. Sunday mornings done right. #foodie</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Live Stats Strip with Count-Up -->
    <div class="landing-stats-strip">
      <div class="stat-metric-card">
        <div class="stat-metric-number" id="stat-posts">0</div>
        <div class="stat-metric-label">Conversations Shared</div>
      </div>
      <div class="stat-metric-card">
        <div class="stat-metric-number" id="stat-creators">0</div>
        <div class="stat-metric-label">Active Builders</div>
      </div>
      <div class="stat-metric-card">
        <div class="stat-metric-number" id="stat-streams">0</div>
        <div class="stat-metric-label">Knowledge Streams</div>
      </div>
    </div>

    <!-- Feature Tiles -->
    <div class="feature-tiles-grid">
      <div class="feature-tile">
        <div class="feature-tile-icon">${icons.trending()}</div>
        <div class="feature-tile-title">Warm Human Design</div>
        <p class="feature-tile-desc">Crafted with bespoke paper & midnight palettes, fluid typography, and 60fps spring transitions. Not an X clone.</p>
      </div>
      <div class="feature-tile">
        <div class="feature-tile-icon">${icons.sparkles()}</div>
        <div class="feature-tile-title">Generative Identity</div>
        <p class="feature-tile-desc">Every creator receives a locally synthesized SVG confluence avatar and rich gradient banner presets.</p>
      </div>
      <div class="feature-tile">
        <div class="feature-tile-icon">${icons.command()}</div>
        <div class="feature-tile-title">Command Speed</div>
        <p class="feature-tile-desc">Instant search palette with ⌘K, double-tap heart bursts, photo zoom lightbox, and zero layout shift.</p>
      </div>
    </div>

    <!-- Live Explore Feed Below -->
    <div id="explore-stream" style="padding-top: var(--space-4);">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5);">
        <div>
          <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; margin: 0 0 4px 0;">Live From The Stream</h2>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0;">Explore public thoughts, code insights, and stories.</p>
        </div>
        <a href="/explore" class="btn btn-secondary btn-sm">View All Topics</a>
      </div>

      <div class="bento-grid">
        <main class="col-center" style="grid-column: 1 / span 8;">
          <section id="posts-stream" aria-label="Explore posts stream"></section>
          <div id="feed-sentinel" style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
            <span class="btn-spinner" style="display: inline-block;"></span>
          </div>
        </main>
        <aside class="col-right" style="grid-column: span 4; display: block;"></aside>
      </div>
    </div>
  `;

  // Animate Count-ups
  countUp(document.getElementById('stat-posts'), 1840, 1100);
  countUp(document.getElementById('stat-creators'), 420, 1100);
  countUp(document.getElementById('stat-streams'), 28, 900);

  // Smooth scroll CTA
  const exploreCta = document.getElementById('guest-explore-cta');
  if (exploreCta) {
    exploreCta.onclick = (e) => {
      e.preventDefault();
      document.getElementById('explore-stream')?.scrollIntoView({ behavior: 'smooth' });
    };
  }

  // Populate Right Column Bento Cards for Guest
  const rightCol = pageRoot.querySelector('.col-right');
  if (rightCol) {
    renderAppShell('home'); // re-runs shell widgets
  }

  // Load Explore Posts
  activeTab = 'explore';
  setupInfiniteScroll();
  await loadPosts(true);
};

/**
 * Authenticated User 12-Column Bento Home Feed
 */
const renderAuthenticatedFeed = async () => {
  pageRoot.innerHTML = `
    <div class="bento-grid">
      <!-- Left Column: Sticky Profile Mini Card -->
      <aside class="col-left" aria-label="Profile Shortcuts"></aside>

      <!-- Center Column: Stories, Composer, Tabs, Post Stream -->
      <main class="col-center" id="main-content">
        <!-- Spotlight Stories Row (Rotating Gradient Rings) -->
        <section class="spotlight-stories-bar" id="spotlight-mount" aria-label="Spotlight Creators"></section>

        <!-- Inline Post Composer Card -->
        <section id="composer-mount" aria-label="Create Post"></section>

        <!-- Feed Tabs (Following / Explore) with sliding indicator -->
        <div class="sliding-tabs-bar" role="tablist">
          <button class="sliding-tab-item active" id="tab-following" role="tab" aria-selected="true">Following</button>
          <button class="sliding-tab-item" id="tab-explore" role="tab" aria-selected="false">Explore Streams</button>
          <div class="sliding-tab-active-bar" id="feed-tab-indicator"></div>
        </div>

        <!-- Post Stream -->
        <section id="posts-stream" aria-label="Post stream"></section>

        <!-- Infinite Scroll Sentinel -->
        <div id="feed-sentinel" style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
          <span class="btn-spinner" style="display: inline-block;"></span>
        </div>
      </main>

      <!-- Right Column: Bento Cards (Trending & Who to Follow) -->
      <aside class="col-right" aria-label="Trending and suggestions"></aside>
    </div>
  `;

  // Re-run AppShell to mount left profile card & right bento widgets
  renderAppShell('home');

  // Mount Spotlight Stories
  mountSpotlightStories();

  // Mount Composer Card
  const composerMount = document.getElementById('composer-mount');
  initComposer(composerMount, {
    onSuccess: (newPost) => {
      const streamEl = document.getElementById('posts-stream');
      const card = renderPostCard(newPost);
      card.classList.add('animate-rise');
      streamEl.prepend(card);
    }
  });

  // Setup Tabs
  setupTabListeners();

  // Setup Infinite Scroll
  setupInfiniteScroll();

  // Load Following Posts initially
  activeTab = 'following';
  await loadPosts(true);
};

/**
 * Spotlight Story Row (Rotating Gradient Rings)
 */
const mountSpotlightStories = async () => {
  const mount = document.getElementById('spotlight-mount');
  if (!mount) return;

  try {
    const data = await api.get('/users/suggestions');
    const users = (data.users || []).slice(0, 8);

    if (users.length === 0) {
      mount.style.display = 'none';
      return;
    }

    mount.innerHTML = users.map(user => `
      <a href="/u/${escapeHTML(user.username)}" class="story-circle-item" title="${escapeHTML(user.name)}">
        <div class="avatar-story-ring">
          ${renderAvatarHTML(user, 'avatar-md')}
        </div>
        <span class="story-username">${escapeHTML(user.name.split(' ')[0])}</span>
      </a>
    `).join('');
  } catch (_) {
    mount.style.display = 'none';
  }
};

const updateTabIndicator = () => {
  const tabFollowing = document.getElementById('tab-following');
  const tabExplore = document.getElementById('tab-explore');
  const tabIndicator = document.getElementById('feed-tab-indicator');
  if (!tabFollowing || !tabExplore || !tabIndicator) return;

  const activeBtn = activeTab === 'following' ? tabFollowing : tabExplore;
  tabIndicator.style.width = `${activeBtn.offsetWidth}px`;
  tabIndicator.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
};

const setupTabListeners = () => {
  const tabFollowing = document.getElementById('tab-following');
  const tabExplore = document.getElementById('tab-explore');
  if (!tabFollowing || !tabExplore) return;

  window.addEventListener('resize', updateTabIndicator);
  setTimeout(updateTabIndicator, 50);

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
  const streamEl = document.getElementById('posts-stream');
  const sentinelEl = document.getElementById('feed-sentinel');
  if (!streamEl) return;

  if (isLoading) return;
  if (!reset && hasReachedEnd) return;

  isLoading = true;

  if (reset) {
    nextCursor = null;
    hasReachedEnd = false;
    streamEl.innerHTML = renderFeedSkeletons(4);
    if (sentinelEl) sentinelEl.style.display = 'block';
  }

  try {
    let endpoint = '';
    if (activeTab === 'following') {
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
        <div class="empty-state-card">
          <div class="empty-state-svg">${icons.compass()}</div>
          <h3 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; margin: 0 0 6px 0;">No conversations yet</h3>
          <p style="color: var(--text-secondary); max-width: 360px; margin: 0 0 16px 0; font-size: 0.9rem;">
            ${activeTab === 'following' ? 'Follow more builders or share what is on your mind to illuminate your feed!' : 'Be the first to share an idea on Sangam.'}
          </p>
          ${activeTab === 'following' ? `<button class="btn btn-secondary btn-sm" id="empty-explore-btn">Switch to Explore</button>` : ''}
        </div>
      `;

      const emptySwitchBtn = streamEl.querySelector('#empty-explore-btn');
      if (emptySwitchBtn) {
        emptySwitchBtn.onclick = () => {
          const tabExplore = document.getElementById('tab-explore');
          if (tabExplore) tabExplore.click();
        };
      }

      if (sentinelEl) sentinelEl.style.display = 'none';
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
        if (sentinelEl) sentinelEl.innerHTML = `<span style="color: var(--text-faint); font-size: 0.82rem;">You're caught up with all streams</span>`;
      } else {
        if (sentinelEl) sentinelEl.innerHTML = `<span class="btn-spinner" style="display: inline-block;"></span>`;
      }
    }
  } catch (err) {
    if (reset) {
      streamEl.innerHTML = `
        <div style="padding: 32px 24px; text-align: center; color: var(--coral-500);">
          <p>${err.message || 'Failed to load streams'}</p>
          <button class="btn btn-secondary btn-sm" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
    if (sentinelEl) sentinelEl.style.display = 'none';
  } finally {
    isLoading = false;
  }
};

const setupInfiniteScroll = () => {
  const sentinelEl = document.getElementById('feed-sentinel');
  if (!sentinelEl) return;

  const observer = new IntersectionObserver((entries) => {
    const target = entries[0];
    if (target.isIntersecting && !isLoading && !hasReachedEnd) {
      loadPosts(false);
    }
  }, {
    rootMargin: '240px',
  });

  observer.observe(sentinelEl);
};

// Start
initFeedPage();

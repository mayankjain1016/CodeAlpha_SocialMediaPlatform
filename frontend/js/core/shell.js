import { getCurrentUser, isAuthenticated, clearAuth } from './auth.js';
import { toggleTheme, getCurrentTheme } from './theme.js';
import { icons } from './icons.js';
import { renderAvatarHTML } from './avatar.js';
import { api } from './api.js';
import { escapeHTML } from './utils.js';
import { openGuestModal, openModal, closeModal } from './modal.js';
import { initComposer } from '../components/composer.js';

let unreadPollInterval = null;

/**
 * Render the Topbar, Navigation Rails, Mobile Bottom Dock, and Guest Banner
 */
export const renderAppShell = (activeTab = 'home') => {
  const user = getCurrentUser();
  const loggedIn = isAuthenticated();
  const theme = getCurrentTheme();

  // 1. Top Navigation Bar (YouTube style centered search & profile tools)
  const topbar = document.querySelector('.app-topbar') || document.querySelector('header');
  if (topbar) {
    topbar.className = 'app-topbar';
    topbar.innerHTML = `
      <div class="topbar-container">
        <!-- Brand -->
        <a href="/" class="topbar-brand" aria-label="Sangam Home">
          <div class="brand-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="8" cy="12" r="5" stroke="#FFFFFF" stroke-width="2" />
              <circle cx="16" cy="12" r="5" stroke="#FFFFFF" stroke-width="2" />
              <path d="M8 8C9.5 10 14.5 10 16 8M8 16C9.5 14 14.5 14 16 16" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" />
            </svg>
          </div>
          <span class="brand-wordmark">Sangam</span>
        </a>

        <!-- Centered Rounded Search Bar (YouTube Style) -->
        <div class="topbar-search-wrap">
          <span class="search-icon-left">${icons.search()}</span>
          <input 
            type="search" 
            class="topbar-search" 
            id="global-search-input" 
            placeholder="Search creators, topics, or stories..." 
            autocomplete="off" 
            aria-label="Search" 
          />
          <kbd class="search-kbd-hint">⌘K</kbd>
          <div class="search-dropdown-menu" id="search-dropdown-results" style="display: none;"></div>
        </div>

        <!-- Right Action Tools -->
        <div class="topbar-actions">
          ${loggedIn ? `
            <button class="btn-create-top" id="topbar-create-btn" aria-label="Create new post">
              ${icons.plus()}
              <span>Create</span>
            </button>
          ` : ''}

          <!-- Theme Toggle -->
          <button class="btn-icon" id="theme-toggle-btn" title="Toggle theme" aria-label="Toggle theme">
            ${theme === 'dark' ? icons.sun() : icons.moon()}
          </button>

          <!-- Notification Bell -->
          ${loggedIn ? `
            <a href="/notifications" class="topbar-bell-btn" id="topbar-bell-link" aria-label="Notifications">
              ${activeTab === 'notifications' ? icons.bellFilled() : icons.bell()}
              <span class="bell-badge" id="topbar-unread-badge" style="display: none;">0</span>
            </a>
          ` : ''}

          <!-- User Menu / Guest Buttons -->
          ${loggedIn && user ? `
            <div style="position: relative;">
              <button id="user-menu-trigger" class="btn-icon" style="padding: 2px;" aria-label="Open user menu" aria-expanded="false">
                ${renderAvatarHTML(user, 'avatar-sm')}
              </button>
              <div id="user-menu-dropdown" style="display: none; position: absolute; right: 0; top: calc(100% + 8px); width: 220px; background: var(--bg-surface); border: 1px solid var(--border-hairline); border-radius: var(--rad-md); box-shadow: var(--shadow-floating); padding: 8px; z-index: 150;">
                <a href="/u/${escapeHTML(user.username)}" style="display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: var(--rad-sm); text-decoration: none; color: var(--text-main);" class="dropdown-item">
                  ${renderAvatarHTML(user, 'avatar-xs')}
                  <div style="min-width: 0;">
                    <div style="font-weight: 700; font-size: 0.9rem; line-height: 1.2;">${escapeHTML(user.name)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">@${escapeHTML(user.username)}</div>
                  </div>
                </a>
                <div style="height: 1px; background: var(--border-hairline); margin: 6px 0;"></div>
                <a href="/bookmarks" style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: var(--rad-sm); text-decoration: none; color: var(--text-main); font-size: 0.85rem;">
                  ${icons.bookmark('nav-icon')}
                  <span>Saved Bookmarks</span>
                </a>
                <div style="height: 1px; background: var(--border-hairline); margin: 6px 0;"></div>
                <button id="logout-btn" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: var(--rad-sm); color: #EF4444; font-weight: 600; font-size: 0.85rem; background: transparent; border: none; cursor: pointer;">
                  ${icons.logout()}
                  <span>Log out</span>
                </button>
              </div>
            </div>
          ` : `
            <div style="display: flex; align-items: center; gap: 8px;">
              <a href="/login" class="btn btn-secondary btn-sm">Log in</a>
              <a href="/register" class="btn btn-gradient btn-sm">Join</a>
            </div>
          `}
        </div>
      </div>
    `;
  }

  // 2. Left Rail Desktop Navigation
  const leftRail = document.querySelector('.left-rail');
  if (leftRail) {
    leftRail.innerHTML = `
      <a href="/" class="nav-link ${activeTab === 'home' ? 'active' : ''}">
        ${activeTab === 'home' ? icons.homeFilled() : icons.home()}
        <span>Home</span>
      </a>
      <a href="/explore" class="nav-link ${activeTab === 'explore' ? 'active' : ''}">
        ${activeTab === 'explore' ? icons.exploreFilled() : icons.explore()}
        <span>Explore</span>
      </a>
      <a href="/notifications" class="nav-link ${activeTab === 'notifications' ? 'active' : ''}" id="left-rail-notif-link" style="position: relative;">
        ${activeTab === 'notifications' ? icons.bellFilled() : icons.bell()}
        <span>Notifications</span>
        <span class="bell-badge" id="left-rail-unread-badge" style="display: none; position: static; margin-left: auto;">0</span>
      </a>
      <a href="/bookmarks" class="nav-link ${activeTab === 'bookmarks' ? 'active' : ''}">
        ${activeTab === 'bookmarks' ? icons.bookmarkFilled() : icons.bookmark()}
        <span>Saved</span>
      </a>
      <a href="${loggedIn && user ? `/u/${user.username}` : '/login'}" class="nav-link ${activeTab === 'profile' ? 'active' : ''}">
        ${activeTab === 'profile' ? icons.userFilled() : icons.user()}
        <span>Profile</span>
      </a>

      ${loggedIn ? `
        <button class="btn btn-gradient btn-lg" id="left-rail-compose-btn" style="width: 100%; margin-top: 14px; gap: 8px;">
          ${icons.plus()}
          <span>Post</span>
        </button>
      ` : ''}
    `;

    const composeBtn = leftRail.querySelector('#left-rail-compose-btn');
    if (composeBtn) {
      composeBtn.addEventListener('click', () => initComposer());
    }
  }

  // 3. Right Rail Desktop Widgets (Trending & Suggested Creators)
  const rightRail = document.querySelector('.right-rail');
  if (rightRail) {
    renderRightRailWidgets(rightRail);
  }

  // 4. Mobile Fixed Bottom Navbar
  let bottomNav = document.querySelector('.bottom-navbar');
  if (!bottomNav) {
    bottomNav = document.createElement('nav');
    bottomNav.className = 'bottom-navbar';
    document.body.appendChild(bottomNav);
  }

  bottomNav.innerHTML = `
    <a href="/" class="bottom-nav-item ${activeTab === 'home' ? 'active' : ''}" aria-label="Home">
      ${activeTab === 'home' ? icons.homeFilled() : icons.home()}
    </a>
    <a href="/explore" class="bottom-nav-item ${activeTab === 'explore' ? 'active' : ''}" aria-label="Explore">
      ${activeTab === 'explore' ? icons.exploreFilled() : icons.explore()}
    </a>
    <button class="bottom-nav-create" id="bottom-create-btn" aria-label="Create Post">
      ${icons.plus()}
    </button>
    <a href="/notifications" class="bottom-nav-item ${activeTab === 'notifications' ? 'active' : ''}" aria-label="Notifications" style="position: relative;">
      ${activeTab === 'notifications' ? icons.bellFilled() : icons.bell()}
      <span class="bell-badge" id="bottom-unread-badge" style="display: none; top: 2px; right: 2px;">0</span>
    </a>
    <a href="${loggedIn && user ? `/u/${user.username}` : '/login'}" class="bottom-nav-item ${activeTab === 'profile' ? 'active' : ''}" aria-label="Profile">
      ${activeTab === 'profile' ? icons.userFilled() : icons.user()}
    </a>
  `;

  const bottomCreateBtn = bottomNav.querySelector('#bottom-create-btn');
  if (bottomCreateBtn) {
    bottomCreateBtn.addEventListener('click', () => {
      if (!loggedIn) {
        openGuestModal('create posts');
        return;
      }
      initComposer();
    });
  }

  // 5. Slim Guest Join Floating Banner
  if (!loggedIn) {
    ensureGuestBanner();
  } else {
    removeGuestBanner();
  }

  // Attach search and user dropdown listeners
  attachTopShellListeners();

  // Notification badge polling
  if (loggedIn) {
    updateUnreadBadge();
    if (!unreadPollInterval) {
      unreadPollInterval = setInterval(updateUnreadBadge, 30000);
    }
  }
};

/**
 * Render Right Rail Widgets
 */
const renderRightRailWidgets = async (container) => {
  container.innerHTML = `
    <!-- Trending Topics Widget -->
    <div class="widget-card" id="widget-trending">
      <div class="widget-title">
        <span>Trending on Sangam</span>
        ${icons.trending()}
      </div>
      <div class="widget-list" id="trending-items-list">
        <div style="font-size: var(--text-xs); color: var(--text-muted); padding: 8px 0;">Loading trending topics...</div>
      </div>
    </div>

    <!-- Suggested Creators Widget -->
    <div class="widget-card" id="widget-creators">
      <div class="widget-title">
        <span>Who to follow</span>
        ${icons.user()}
      </div>
      <div class="widget-list" id="suggested-creators-list">
        <div style="font-size: var(--text-xs); color: var(--text-muted); padding: 8px 0;">Finding creators...</div>
      </div>
    </div>

    <!-- Micro Footer -->
    <div style="padding: 0 4px; font-size: var(--text-2xs); color: var(--text-muted); line-height: 1.6;">
      <a href="/explore" style="color: inherit; text-decoration: none;">Explore</a> &middot;
      <a href="/login" style="color: inherit; text-decoration: none;">Privacy</a> &middot;
      <a href="/register" style="color: inherit; text-decoration: none;">Terms</a> &middot;
      <span>&copy; 2026 Sangam &middot; CodeAlpha</span>
    </div>
  `;

  // Fetch Trending
  try {
    const res = await api.get('/trending');
    const items = res.trending || [];
    const listEl = container.querySelector('#trending-items-list');
    if (listEl) {
      if (items.length === 0) {
        listEl.innerHTML = `<div style="font-size: var(--text-xs); color: var(--text-muted);">No trends yet.</div>`;
      } else {
        listEl.innerHTML = items.slice(0, 5).map(item => `
          <a href="/explore?tag=${encodeURIComponent(item.tag)}" class="trending-item">
            <div>
              <div class="trending-tag">#${escapeHTML(item.tag)}</div>
              <div class="trending-count">${item.count} conversations</div>
            </div>
            <span style="color: var(--primary); font-size: 13px;">↗</span>
          </a>
        `).join('');
      }
    }
  } catch (_) {}

  // Fetch Suggestions
  try {
    const res = await api.get('/users/suggestions');
    const users = (res.users || []).slice(0, 4);
    const listEl = container.querySelector('#suggested-creators-list');
    if (listEl) {
      if (users.length === 0) {
        listEl.innerHTML = `<div style="font-size: var(--text-xs); color: var(--text-muted);">No suggestions right now.</div>`;
      } else {
        listEl.innerHTML = users.map(u => `
          <div class="suggested-user-row">
            <a href="/u/${escapeHTML(u.username)}" class="user-snippet-link">
              ${renderAvatarHTML(u, 'avatar-xs')}
              <div class="user-snippet-info">
                <span class="user-snippet-name">${escapeHTML(u.name)}</span>
                <span class="user-snippet-handle">@${escapeHTML(u.username)}</span>
              </div>
            </a>
            <button class="btn btn-secondary btn-sm btn-follow-widget" data-user-id="${u._id}">Follow</button>
          </div>
        `).join('');

        listEl.querySelectorAll('.btn-follow-widget').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!isAuthenticated()) {
              openGuestModal('follow creators');
              return;
            }
            btn.disabled = true;
            try {
              const r = await api.post(`/users/${btn.dataset.userId}/follow`);
              btn.textContent = r.following ? 'Following' : 'Follow';
              btn.classList.toggle('following', r.following);
            } catch (_) {
            } finally {
              btn.disabled = false;
            }
          });
        });
      }
    }
  } catch (_) {}
};

/**
 * Top Shell Listeners: Theme, Search, User Menu, Logout
 */
const attachTopShellListeners = () => {
  // Theme Toggle
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.onclick = () => {
      const nextTheme = toggleTheme();
      themeBtn.innerHTML = nextTheme === 'dark' ? icons.sun() : icons.moon();
    };
  }

  // Topbar Create Post Button
  const topCreateBtn = document.getElementById('topbar-create-btn');
  if (topCreateBtn) {
    topCreateBtn.onclick = () => {
      if (!isAuthenticated()) {
        openGuestModal('create posts');
        return;
      }
      initComposer();
    };
  }

  // User Dropdown Menu
  const userTrigger = document.getElementById('user-menu-trigger');
  const userDropdown = document.getElementById('user-menu-dropdown');
  if (userTrigger && userDropdown) {
    userTrigger.onclick = (e) => {
      e.stopPropagation();
      const isVisible = userDropdown.style.display === 'block';
      userDropdown.style.display = isVisible ? 'none' : 'block';
    };

    document.addEventListener('click', (e) => {
      if (!userTrigger.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.style.display = 'none';
      }
    });
  }

  // Logout Button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      clearAuth();
      window.location.href = '/';
    };
  }

  // Search Input & Suggestions (YouTube style)
  setupSearchInput();
};

/**
 * Setup Centered Search Bar with Suggestions Overlay
 */
const setupSearchInput = () => {
  const searchInput = document.getElementById('global-search-input');
  const dropdown = document.getElementById('search-dropdown-results');
  if (!searchInput || !dropdown) return;

  let debounceTimer = null;

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim();

    if (!query) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        const users = (res.users || []).slice(0, 3);
        const posts = (res.posts || []).slice(0, 3);

        if (users.length === 0 && posts.length === 0) {
          dropdown.innerHTML = `
            <div style="padding: 12px; font-size: var(--text-xs); color: var(--text-muted); text-align: center;">
              No results found for "${escapeHTML(query)}"
            </div>
          `;
          dropdown.style.display = 'flex';
          return;
        }

        let html = '';
        if (users.length > 0) {
          html += `<div class="search-section-title">People</div>`;
          users.forEach(u => {
            html += `
              <a href="/u/${escapeHTML(u.username)}" class="search-result-item">
                ${renderAvatarHTML(u, 'avatar-xs')}
                <div>
                  <div style="font-weight: 700; font-size: var(--text-xs);">${escapeHTML(u.name)}</div>
                  <div style="font-size: var(--text-2xs); color: var(--text-muted);">@${escapeHTML(u.username)}</div>
                </div>
              </a>
            `;
          });
        }

        if (posts.length > 0) {
          html += `<div class="search-section-title">Conversations</div>`;
          posts.forEach(p => {
            html += `
              <a href="/post/${p._id}" class="search-result-item">
                <span style="color: var(--primary);">#</span>
                <div style="font-size: var(--text-xs); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${escapeHTML(p.text || 'View conversation')}
                </div>
              </a>
            `;
          });
        }

        dropdown.innerHTML = html;
        dropdown.style.display = 'flex';
      } catch (_) {
        dropdown.style.display = 'none';
      }
    }, 200);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = searchInput.value.trim();
      if (q) {
        window.location.href = `/explore?q=${encodeURIComponent(q)}`;
      }
    }
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });

  // Global Ctrl+K / ⌘K shortcut
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });
};

/**
 * Slim Guest Join Floating Banner
 */
const ensureGuestBanner = () => {
  let banner = document.getElementById('guest-join-banner');
  if (banner) return;

  banner = document.createElement('div');
  banner.id = 'guest-join-banner';
  banner.className = 'guest-join-banner';
  banner.innerHTML = `
    <div class="guest-banner-text">
      <span class="guest-banner-title">Don't miss what's happening.</span>
      <span class="guest-banner-subtitle">People on Sangam are the first to know. Join now to react, post stories, and connect.</span>
    </div>
    <div class="guest-banner-actions">
      <a href="/login" class="btn btn-banner-login btn-sm">Log in</a>
      <a href="/register" class="btn btn-banner-join btn-sm">Sign up</a>
    </div>
  `;
  document.body.appendChild(banner);
};

const removeGuestBanner = () => {
  const banner = document.getElementById('guest-join-banner');
  if (banner) banner.remove();
};

/**
 * Update unread notifications badge
 */
export const updateUnreadBadge = async () => {
  if (!isAuthenticated()) return;

  try {
    const res = await api.get('/notifications/unread-count');
    const count = res.unreadCount || 0;

    const badges = [
      document.getElementById('topbar-unread-badge'),
      document.getElementById('left-rail-unread-badge'),
      document.getElementById('bottom-unread-badge')
    ];

    badges.forEach(b => {
      if (b) {
        if (count > 0) {
          b.textContent = count > 99 ? '99+' : count;
          b.style.display = 'flex';
        } else {
          b.style.display = 'none';
        }
      }
    });
  } catch (_) {}
};

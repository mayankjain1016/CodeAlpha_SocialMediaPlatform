import { getCurrentUser, isAuthenticated, clearAuth } from './auth.js';
import { toggleTheme, getCurrentTheme } from './theme.js';
import { icons } from './icons.js';
import { renderAvatarHTML } from './avatar.js';
import { api } from './api.js';
import { debounce, escapeHTML } from './utils.js';
import { initButtonRipples, initHeaderScrollWatcher } from './motion.js';
import { openGuestModal, openModal, closeModal } from './modal.js';

let unreadPollInterval = null;
let lastUnreadCount = 0;

export const renderAppShell = (activeTab = 'home') => {
  const user = getCurrentUser();
  const loggedIn = isAuthenticated();
  const theme = getCurrentTheme();

  // Left Nav markup
  const navContainer = document.querySelector('.shell-nav');
  if (navContainer) {
    navContainer.innerHTML = `
      <div class="nav-top-section">
        <a href="/" class="brand-link" aria-label="Sangam Home">
          <svg class="brand-logo-svg" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="9" fill="#0B0F14"/>
            <circle cx="12" cy="16" r="6.5" stroke="#3B82F6" stroke-width="2.2" stroke-linecap="round"/>
            <circle cx="20" cy="16" r="6.5" stroke="#60A5FA" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M12 11.5C14.5 13.5 17.5 13.5 20 11.5M12 20.5C14.5 18.5 17.5 18.5 20 20.5" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" opacity="0.9"/>
            <circle cx="16" cy="16" r="1.75" fill="#60A5FA"/>
          </svg>
          <span class="brand-title">Sangam</span>
        </a>

        <ul class="nav-menu">
          <li>
            <a href="/" class="nav-item-link ${activeTab === 'home' ? 'active' : ''}">
              ${icons.home('nav-icon')}
              <span>Home</span>
            </a>
          </li>
          <li>
            <a href="/explore" class="nav-item-link ${activeTab === 'explore' ? 'active' : ''}">
              ${icons.explore('nav-icon')}
              <span>Explore</span>
            </a>
          </li>
          <li>
            <a href="/notifications" class="nav-item-link ${activeTab === 'notifications' ? 'active' : ''}" id="nav-notif-link">
              ${icons.bell('nav-icon')}
              <span>Notifications</span>
              <span class="nav-badge" id="nav-unread-badge" style="display: none;">0</span>
            </a>
          </li>
          <li>
            <a href="/bookmarks" class="nav-item-link ${activeTab === 'bookmarks' ? 'active' : ''}">
              ${icons.bookmark('nav-icon')}
              <span>Bookmarks</span>
            </a>
          </li>
          <li>
            <a href="${loggedIn && user ? `/u/${user.username}` : '/login'}" class="nav-item-link ${activeTab === 'profile' ? 'active' : ''}">
              ${icons.user('nav-icon')}
              <span>Profile</span>
            </a>
          </li>
        </ul>

        <button class="btn btn-primary nav-compose-btn" id="nav-compose-trigger" aria-label="Create new post">
          ${icons.plus('nav-icon')}
          <span>Post</span>
        </button>
      </div>

      <div class="nav-bottom-section">
        <button class="btn btn-ghost" id="theme-toggle-btn" style="justify-content: flex-start; padding: 10px 14px;" aria-label="Toggle visual theme">
          <span id="theme-icon-wrap">${theme === 'dark' ? icons.sun('nav-icon') : icons.moon('nav-icon')}</span>
          <span>${theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>

        ${loggedIn && user ? `
          <div class="user-card" style="padding: 8px 12px; border-radius: var(--radius-lg); background: var(--bg-surface-subtle);">
            <a href="/u/${user.username}" class="user-card-info" style="text-decoration: none;">
              ${renderAvatarHTML(user, 'avatar-sm')}
              <div class="user-card-text">
                <span class="user-card-name">${escapeHTML(user.name)}</span>
                <span class="user-card-handle">@${escapeHTML(user.username)}</span>
              </div>
            </a>
            <button class="btn-icon" id="logout-btn" title="Log out" aria-label="Log out">
              ${icons.logout()}
            </button>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <a href="/login" class="btn btn-primary" style="width: 100%;">Log In</a>
            <a href="/register" class="btn btn-secondary" style="width: 100%;">Sign Up</a>
          </div>
        `}
      </div>
    `;
  }

  // Right Sidebar markup
  const sidebarContainer = document.querySelector('.shell-sidebar');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = `
      <!-- User Search Widget -->
      <div class="search-container">
        <div class="search-input-wrap">
          <span class="search-icon">${icons.search()}</span>
          <input type="text" id="sidebar-search-input" class="search-input" placeholder="Search Sangam" autocomplete="off" aria-label="Search users on Sangam">
        </div>
        <div class="search-dropdown" id="sidebar-search-dropdown" role="listbox"></div>
      </div>

      <!-- Who to follow widget -->
      <div class="sidebar-widget" id="who-to-follow-widget">
        <h3 class="sidebar-widget-title">Who to follow</h3>
        <div id="who-to-follow-list" style="display: flex; flex-direction: column; gap: 8px;">
          <div class="skeleton" style="height: 48px;"></div>
          <div class="skeleton" style="height: 48px;"></div>
          <div class="skeleton" style="height: 48px;"></div>
        </div>
      </div>

      <!-- Trending Hashtags widget -->
      <div class="sidebar-widget" id="trending-widget">
        <h3 class="sidebar-widget-title">Trending for you</h3>
        <div id="trending-tags-list" style="display: flex; flex-direction: column; gap: 4px;">
          <div class="skeleton" style="height: 40px;"></div>
          <div class="skeleton" style="height: 40px;"></div>
          <div class="skeleton" style="height: 40px;"></div>
        </div>
      </div>

      <!-- Footer links -->
      <div class="sidebar-footer">
        <p>&copy; 2026 Sangam &middot; CodeAlpha Internship</p>
        <p><a href="/explore">Explore</a> &middot; <a href="/notifications">Activity</a> &middot; <a href="https://github.com" target="_blank" rel="noopener">Source</a></p>
      </div>
    `;
  }

  // Mobile Top Bar
  const mobileTop = document.querySelector('.mobile-top-bar');
  if (mobileTop) {
    mobileTop.innerHTML = `
      <a href="/" class="brand-link" style="padding: 0; margin: 0;">
        <svg class="brand-logo-svg" viewBox="0 0 32 32" fill="none" style="width: 28px; height: 28px;">
          <rect width="32" height="32" rx="8" fill="#0B0F14"/>
          <circle cx="12" cy="16" r="6" stroke="#3B82F6" stroke-width="2.2" stroke-linecap="round"/>
          <circle cx="20" cy="16" r="6" stroke="#60A5FA" stroke-width="2.2" stroke-linecap="round"/>
          <circle cx="16" cy="16" r="1.75" fill="#60A5FA"/>
        </svg>
        <span class="brand-title" style="font-size: 1.25rem;">Sangam</span>
      </a>
      <div style="display: flex; align-items: center; gap: 8px;">
        <button class="btn-icon" id="mobile-theme-toggle" aria-label="Toggle theme">
          ${theme === 'dark' ? icons.sun() : icons.moon()}
        </button>
        ${loggedIn && user ? `
          <a href="/u/${user.username}" aria-label="My profile">
            ${renderAvatarHTML(user, 'avatar-xs')}
          </a>
        ` : `
          <a href="/login" class="btn btn-primary btn-sm">Log In</a>
        `}
      </div>
    `;
  }

  // Mobile Bottom Bar
  const mobileBottom = document.querySelector('.mobile-bottom-bar');
  if (mobileBottom) {
    mobileBottom.innerHTML = `
      <a href="/" class="mobile-bottom-item ${activeTab === 'home' ? 'active' : ''}" aria-label="Home">
        ${icons.home('nav-icon')}
      </a>
      <a href="/explore" class="mobile-bottom-item ${activeTab === 'explore' ? 'active' : ''}" aria-label="Explore">
        ${icons.explore('nav-icon')}
      </a>
      <button class="mobile-bottom-item mobile-compose-trigger" id="mobile-compose-btn" aria-label="Create Post">
        ${icons.plus()}
      </button>
      <a href="/notifications" class="mobile-bottom-item ${activeTab === 'notifications' ? 'active' : ''}" id="mobile-notif-link" aria-label="Notifications">
        ${icons.bell('nav-icon')}
        <span class="nav-badge" id="mobile-unread-badge" style="display: none; top: 6px; left: 24px;">0</span>
      </a>
      <a href="${loggedIn && user ? `/u/${user.username}` : '/login'}" class="mobile-bottom-item ${activeTab === 'profile' ? 'active' : ''}" aria-label="Profile">
        ${icons.user('nav-icon')}
      </a>
    `;
  }

  // Attach Event Listeners
  attachShellListeners();

  // Load right sidebar data if present
  if (sidebarContainer) {
    loadSidebarData();
  }

  // Start notification unread badge polling if authenticated
  if (loggedIn) {
    updateUnreadBadge();
    if (!unreadPollInterval) {
      unreadPollInterval = setInterval(updateUnreadBadge, 30000);
    }
  }

  // Motion helpers
  initButtonRipples();
  initHeaderScrollWatcher();
};

const attachShellListeners = () => {
  // Theme Toggle buttons
  const themeBtn = document.getElementById('theme-toggle-btn');
  const mobileThemeBtn = document.getElementById('mobile-theme-toggle');

  const onToggleTheme = () => {
    const nextTheme = toggleTheme();
    const iconSvg = nextTheme === 'dark' ? icons.sun('nav-icon') : icons.moon('nav-icon');
    const label = nextTheme === 'dark' ? 'Light mode' : 'Dark mode';

    if (themeBtn) {
      const wrap = document.getElementById('theme-icon-wrap');
      if (wrap) wrap.innerHTML = iconSvg;
      const span = themeBtn.querySelector('span:last-child');
      if (span) span.textContent = label;
    }
    if (mobileThemeBtn) {
      mobileThemeBtn.innerHTML = nextTheme === 'dark' ? icons.sun() : icons.moon();
    }
  };

  if (themeBtn) themeBtn.onclick = onToggleTheme;
  if (mobileThemeBtn) mobileThemeBtn.onclick = onToggleTheme;

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      clearAuth();
      window.location.href = '/login';
    };
  }

  // Compose buttons
  const composeTriggers = document.querySelectorAll('#nav-compose-trigger, #mobile-compose-btn');
  composeTriggers.forEach(btn => {
    btn.onclick = () => {
      if (!isAuthenticated()) {
        openGuestModal('create a post');
        return;
      }
      // If composer is on page (like on home feed), focus it
      const textarea = document.querySelector('.composer-textarea');
      if (textarea) {
        textarea.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Otherwise, open bottom sheet modal composer
        openGlobalComposerModal();
      }
    };
  });

  // Search input live debounced dropdown
  const searchInput = document.getElementById('sidebar-search-input');
  const searchDropdown = document.getElementById('sidebar-search-dropdown');

  if (searchInput && searchDropdown) {
    const onSearch = debounce(async (query) => {
      const trimmed = query.trim();
      if (!trimmed) {
        searchDropdown.classList.remove('active');
        searchDropdown.innerHTML = '';
        return;
      }

      try {
        const data = await api.get(`/users/search?q=${encodeURIComponent(trimmed)}`);
        if (!data.users || data.users.length === 0) {
          searchDropdown.innerHTML = `<div style="padding: 14px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No users found for "${escapeHTML(trimmed)}"</div>`;
        } else {
          searchDropdown.innerHTML = data.users.map(u => `
            <a href="/u/${escapeHTML(u.username)}" class="search-result-item">
              ${renderAvatarHTML(u, 'avatar-sm')}
              <div style="display: flex; flex-direction: column; min-width: 0;">
                <span style="font-weight: 700; font-size: 0.85rem;">${escapeHTML(u.name)}</span>
                <span style="color: var(--text-muted); font-size: 0.75rem;">@${escapeHTML(u.username)}</span>
              </div>
            </a>
          `).join('');
        }
        searchDropdown.classList.add('active');
      } catch (e) {
        searchDropdown.classList.remove('active');
      }
    }, 250);

    searchInput.addEventListener('input', (e) => onSearch(e.target.value));

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.classList.remove('active');
      }
    });

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim() && searchDropdown.children.length > 0) {
        searchDropdown.classList.add('active');
      }
    });
  }
};

const loadSidebarData = async () => {
  // Load Who to Follow
  const followList = document.getElementById('who-to-follow-list');
  if (followList) {
    try {
      let users = [];
      if (isAuthenticated()) {
        const data = await api.get('/users/suggestions');
        users = data.users || [];
      } else {
        // Fallback for guests: search top users
        const data = await api.get('/users/search?q=a');
        users = (data.users || []).slice(0, 4);
      }

      if (users.length === 0) {
        followList.innerHTML = `<p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">No new suggestions right now.</p>`;
      } else {
        followList.innerHTML = users.map(u => `
          <div class="user-card" id="user-suggest-${u._id}">
            <a href="/u/${escapeHTML(u.username)}" class="user-card-info" style="text-decoration: none;">
              ${renderAvatarHTML(u, 'avatar-sm')}
              <div class="user-card-text">
                <span class="user-card-name">${escapeHTML(u.name)}</span>
                <span class="user-card-handle">@${escapeHTML(u.username)}</span>
              </div>
            </a>
            <button class="btn btn-secondary btn-sm btn-follow" data-user-id="${u._id}">Follow</button>
          </div>
        `).join('');

        // Attach follow handlers
        followList.querySelectorAll('.btn-follow').forEach(btn => {
          btn.onclick = async (e) => {
            e.preventDefault();
            if (!isAuthenticated()) {
              openGuestModal('follow users');
              return;
            }
            const userId = btn.dataset.userId;
            btn.disabled = true;
            try {
              const res = await api.post(`/users/${userId}/follow`);
              if (res.following) {
                btn.textContent = 'Following';
                btn.classList.add('following');
              } else {
                btn.textContent = 'Follow';
                btn.classList.remove('following');
              }
            } catch (err) {
              // ignore
            } finally {
              btn.disabled = false;
            }
          };
        });
      }
    } catch (err) {
      followList.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted);">Could not load suggestions.</p>`;
    }
  }

  // Load Trending Hashtags
  const trendingList = document.getElementById('trending-tags-list');
  if (trendingList) {
    try {
      const data = await api.get('/trending');
      const items = data.trending || [];
      if (items.length === 0) {
        trendingList.innerHTML = `<p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">No trending topics right now.</p>`;
      } else {
        trendingList.innerHTML = items.map(item => `
          <a href="/explore?tag=${encodeURIComponent(item.tag)}" class="trending-item">
            <span class="trending-meta">Trending in India</span>
            <span class="trending-tag">#${escapeHTML(item.tag)}</span>
            <span class="trending-meta">${item.count} post${item.count === 1 ? '' : 's'}</span>
          </a>
        `).join('');
      }
    } catch (err) {
      trendingList.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted);">Trending unavailable.</p>`;
    }
  }
};

export const updateUnreadBadge = async () => {
  if (!isAuthenticated()) return;
  try {
    const data = await api.get('/notifications/unread-count');
    const count = data.count || 0;
    const badges = document.querySelectorAll('#nav-unread-badge, #mobile-unread-badge');

    badges.forEach(badge => {
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : String(count);
        badge.style.display = 'inline-flex';
        if (count > lastUnreadCount) {
          badge.classList.remove('badge-pop');
          void badge.offsetWidth;
          badge.classList.add('badge-pop');
        }
      } else {
        badge.style.display = 'none';
      }
    });

    lastUnreadCount = count;
  } catch (err) {
    // silently catch badge check failures
  }
};

/**
 * Global composer modal for pages without inline composer or mobile trigger
 */
export const openGlobalComposerModal = () => {
  let modal = document.getElementById('global-composer-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'global-composer-modal';
    modal.className = 'modal-overlay bottom-sheet';
    modal.innerHTML = `
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="global-composer-title">
        <div class="modal-header">
          <h3 id="global-composer-title" class="modal-title">Create Post</h3>
          <button class="btn-icon modal-close-btn" aria-label="Close composer">${icons.x()}</button>
        </div>
        <div class="modal-body" style="padding: 0;">
          <div id="modal-composer-mount"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.modal-close-btn').onclick = () => closeModal(modal);
  }

  import('../components/composer.js').then(({ initComposer }) => {
    const mount = modal.querySelector('#modal-composer-mount');
    initComposer(mount, {
      onSuccess: () => {
        closeModal(modal);
        // If on home feed, refresh or prepend
        window.location.href = '/';
      }
    });
    openModal(modal);
  });
};

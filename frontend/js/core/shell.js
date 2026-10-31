import { getCurrentUser, isAuthenticated, clearAuth } from './auth.js';
import { toggleTheme, getCurrentTheme } from './theme.js';
import { icons } from './icons.js';
import { renderAvatarHTML } from './avatar.js';
import { api } from './api.js';
import { debounce, escapeHTML } from './utils.js';
import { initNavbarScrollWatcher, initCardSpotlights } from './motion.js';
import { openGuestModal, openModal, closeModal } from './modal.js';

let unreadPollInterval = null;
let lastUnreadCount = 0;

/**
 * Render the Floating Glass Pill Navbar & Shell System
 */
export const renderAppShell = (activeTab = 'home') => {
  const user = getCurrentUser();
  const loggedIn = isAuthenticated();
  const theme = getCurrentTheme();

  // Top Floating Pill Navbar
  const navbar = document.querySelector('.top-navbar');
  if (navbar) {
    navbar.innerHTML = `
      <!-- Brand -->
      <a href="/" class="nav-brand" aria-label="Sangam Home">
        <svg class="nav-logo-svg" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="10" fill="#14110F"/>
          <circle cx="12" cy="16" r="6.75" stroke="#0E7C86" stroke-width="2.2" stroke-linecap="round"/>
          <circle cx="20" cy="16" r="6.75" stroke="#FFA41B" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M12 11.5C14.2 13.8 17.8 13.8 20 11.5M12 20.5C14.2 18.2 17.8 18.2 20 20.5" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity="0.95"/>
          <circle cx="16" cy="16" r="2" fill="#FFA41B"/>
        </svg>
        <span class="nav-wordmark">Sangam</span>
      </a>

      <!-- Center Pill Navigation -->
      <nav class="nav-center-menu" aria-label="Primary Navigation">
        <div class="nav-sliding-indicator" id="nav-indicator"></div>
        <a href="/" class="nav-pill-item ${activeTab === 'home' ? 'active' : ''}" data-tab="home">
          ${activeTab === 'home' ? icons.homeFilled('nav-icon') : icons.home('nav-icon')}
          <span>Home</span>
        </a>
        <a href="/explore" class="nav-pill-item ${activeTab === 'explore' ? 'active' : ''}" data-tab="explore">
          ${activeTab === 'explore' ? icons.exploreFilled('nav-icon') : icons.explore('nav-icon')}
          <span>Explore</span>
        </a>
        <a href="/notifications" class="nav-pill-item ${activeTab === 'notifications' ? 'active' : ''}" data-tab="notifications" id="nav-notif-link">
          ${activeTab === 'notifications' ? icons.bellFilled('nav-icon') : icons.bell('nav-icon')}
          <span>Activity</span>
          <span class="nav-badge-pill" id="nav-unread-badge" style="display: none;">0</span>
        </a>
        <a href="/bookmarks" class="nav-pill-item ${activeTab === 'bookmarks' ? 'active' : ''}" data-tab="bookmarks">
          ${activeTab === 'bookmarks' ? icons.bookmarkFilled('nav-icon') : icons.bookmark('nav-icon')}
          <span>Saved</span>
        </a>
      </nav>

      <!-- Right Actions: Search (Ctrl+K), Theme, Avatar Menu -->
      <div class="nav-right-actions">
        <!-- Command Palette / Search Trigger -->
        <button class="nav-search-trigger" id="open-palette-btn" aria-label="Search or press Ctrl+K">
          ${icons.search()}
          <span class="search-text">Search</span>
          <kbd class="kbd-shortcut">⌘K</kbd>
        </button>

        <!-- Theme Toggle -->
        <button class="btn-icon" id="theme-toggle-btn" title="Toggle theme" aria-label="Toggle theme">
          ${theme === 'dark' ? icons.sun() : icons.moon()}
        </button>

        <!-- User Menu or Sign In -->
        ${loggedIn && user ? `
          <div style="position: relative;">
            <button id="user-menu-trigger" style="display: flex; align-items: center; border-radius: var(--radius-full); padding: 2px;" aria-label="Open user menu" aria-expanded="false">
              ${renderAvatarHTML(user, 'avatar-sm')}
            </button>
            <div id="user-menu-dropdown" style="display: none; position: absolute; right: 0; top: calc(100% + 12px); width: 220px; background: var(--bg-surface); border: 1px solid var(--hairline-strong); border-radius: var(--radius-md); box-shadow: var(--shadow-floating); padding: 8px; z-index: 100;">
              <a href="/u/${escapeHTML(user.username)}" style="display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: var(--radius-sm); text-decoration: none; color: var(--text-main);" class="dropdown-item">
                ${renderAvatarHTML(user, 'avatar-xs')}
                <div style="min-width: 0;">
                  <div style="font-weight: 700; font-size: 0.9rem; line-height: 1.2;">${escapeHTML(user.name)}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">@${escapeHTML(user.username)}</div>
                </div>
              </a>
              <div style="height: 1px; background: var(--hairline); margin: 6px 0;"></div>
              <button id="logout-btn" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: var(--radius-sm); color: var(--red-500); font-weight: 600; font-size: 0.85rem;" class="dropdown-item">
                ${icons.logout()}
                <span>Log out</span>
              </button>
            </div>
          </div>
        ` : `
          <div style="display: flex; gap: 8px;">
            <a href="/login" class="btn btn-secondary btn-sm">Log in</a>
            <a href="/register" class="btn btn-primary btn-sm">Join</a>
          </div>
        `}
      </div>
    `;

    positionNavIndicator();
  }

  // Mobile Floating Pill Bottom Dock
  const mobileDock = document.querySelector('.mobile-bottom-dock');
  if (mobileDock) {
    mobileDock.innerHTML = `
      <a href="/" class="dock-item ${activeTab === 'home' ? 'active' : ''}" aria-label="Home">
        ${activeTab === 'home' ? icons.homeFilled() : icons.home()}
      </a>
      <a href="/explore" class="dock-item ${activeTab === 'explore' ? 'active' : ''}" aria-label="Explore">
        ${activeTab === 'explore' ? icons.exploreFilled() : icons.explore()}
      </a>
      <button class="dock-compose-btn" id="dock-compose-trigger" aria-label="Create Post">
        ${icons.plus()}
      </button>
      <a href="/notifications" class="dock-item ${activeTab === 'notifications' ? 'active' : ''}" aria-label="Notifications" style="position: relative;">
        ${activeTab === 'notifications' ? icons.bellFilled() : icons.bell()}
        <span class="nav-badge-pill" id="mobile-unread-badge" style="display: none; position: absolute; top: 6px; right: 6px;">0</span>
      </a>
      <a href="${loggedIn && user ? `/u/${user.username}` : '/login'}" class="dock-item ${activeTab === 'profile' ? 'active' : ''}" aria-label="Profile">
        ${activeTab === 'profile' ? icons.userFilled() : icons.user()}
      </a>
    `;
  }

  // Setup Left Column Sticky Profile Mini Card if element exists
  const leftCol = document.querySelector('.col-left');
  if (leftCol && loggedIn && user) {
    renderLeftProfileCard(leftCol, user);
  }

  // Setup Right Column Bento Cards (Trending & Who to Follow)
  const rightCol = document.querySelector('.col-right');
  if (rightCol) {
    renderRightBentoCards(rightCol);
  }

  // Ensure Command Palette exists in DOM
  ensureCommandPalette();

  // Attach Listeners
  attachShellListeners();

  // Start notification unread badge polling
  if (loggedIn) {
    updateUnreadBadge();
    if (!unreadPollInterval) {
      unreadPollInterval = setInterval(updateUnreadBadge, 30000);
    }
  }

  // Initialize interactive motion
  initNavbarScrollWatcher();
  initCardSpotlights();
};

/**
 * Slide the active navbar pill indicator
 */
const positionNavIndicator = () => {
  const activeItem = document.querySelector('.nav-pill-item.active');
  const indicator = document.getElementById('nav-indicator');
  if (!activeItem || !indicator) return;

  indicator.style.width = `${activeItem.offsetWidth}px`;
  indicator.style.transform = `translateX(${activeItem.offsetLeft}px)`;
};

/**
 * Render Left Column Sticky Mini-Card
 */
const renderLeftProfileCard = (container, user) => {
  const presetClass = `banner-preset-${user.bannerPreset || 0}`;

  container.innerHTML = `
    <div class="bento-card spotlight-card" style="padding: 0; overflow: hidden;">
      <div class="${presetClass}" style="height: 80px; width: 100%;"></div>
      <div style="padding: 0 var(--space-4) var(--space-4); margin-top: -30px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px;">
          ${renderAvatarHTML(user, 'avatar-md', true)}
          <a href="/u/${escapeHTML(user.username)}" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 4px 12px; min-height: 28px;">
            Profile
          </a>
        </div>
        <a href="/u/${escapeHTML(user.username)}" style="font-family: var(--font-display); font-weight: 700; font-size: 1rem; color: var(--text-main); display: block; text-decoration: none;">
          ${escapeHTML(user.name)}
        </a>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">@${escapeHTML(user.username)}</div>
        ${user.bio ? `<p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escapeHTML(user.bio)}</p>` : ''}
        
        <div style="display: flex; gap: 14px; font-size: 0.8rem; padding-top: 10px; border-top: 1px solid var(--hairline);">
          <div><strong style="color: var(--text-main);">${user.followingCount || 0}</strong> <span style="color: var(--text-muted);">Following</span></div>
          <div><strong style="color: var(--text-main);">${user.followersCount || 0}</strong> <span style="color: var(--text-muted);">Followers</span></div>
        </div>
      </div>
    </div>

    <!-- Quick Navigation Shortcuts -->
    <div class="bento-card" style="padding: var(--space-4);">
      <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 8px;">
        Quick Streams
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <a href="/explore?tag=webdev" class="trending-bento-item" style="font-size: 0.85rem; font-weight: 600;">
          <span>#webdev</span>
          <span style="color: var(--accent-primary); font-size: 0.75rem;">↗</span>
        </a>
        <a href="/explore?tag=startups" class="trending-bento-item" style="font-size: 0.85rem; font-weight: 600;">
          <span>#startups</span>
          <span style="color: var(--accent-primary); font-size: 0.75rem;">↗</span>
        </a>
        <a href="/explore?tag=design" class="trending-bento-item" style="font-size: 0.85rem; font-weight: 600;">
          <span>#design</span>
          <span style="color: var(--accent-primary); font-size: 0.75rem;">↗</span>
        </a>
      </div>
    </div>
  `;
};

/**
 * Render Right Column Bento Cards (Trending & Who to Follow)
 */
const renderRightBentoCards = async (container) => {
  container.innerHTML = `
    <!-- Trending Bento Card with Sparklines -->
    <div class="bento-card spotlight-card" id="bento-trending-card">
      <div class="bento-card-title">
        ${icons.sparkles()}
        <span>Trending Streams</span>
      </div>
      <div id="bento-trending-list" style="display: flex; flex-direction: column; gap: 4px;">
        <div class="skeleton" style="height: 38px;"></div>
        <div class="skeleton" style="height: 38px;"></div>
        <div class="skeleton" style="height: 38px;"></div>
      </div>
    </div>

    <!-- Who to Follow Bento Card -->
    <div class="bento-card spotlight-card" id="bento-follow-card">
      <div class="bento-card-title">
        ${icons.user()}
        <span>Who to Follow</span>
      </div>
      <div id="bento-follow-list" style="display: flex; flex-direction: column; gap: 8px;">
        <div class="skeleton" style="height: 48px;"></div>
        <div class="skeleton" style="height: 48px;"></div>
      </div>
    </div>

    <!-- Discover Sangam Card -->
    <div class="bento-card" style="background: var(--gradient-confluence-glow); border: 1px solid var(--hairline-strong);">
      <div style="font-family: var(--font-display); font-weight: 800; font-size: 1.05rem; margin-bottom: 4px;">
        Where thoughts meet.
      </div>
      <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45; margin: 0 0 12px 0;">
        Pure speed, zero bloat, and warm typography designed for meaningful conversations.
      </p>
      <div style="font-size: 0.72rem; color: var(--text-muted);">
        &copy; 2026 Sangam &middot; CodeAlpha
      </div>
    </div>
  `;

  // Fetch Trending
  try {
    const data = await api.get('/trending');
    const items = data.trending || [];
    const listEl = container.querySelector('#bento-trending-list');
    if (listEl) {
      if (items.length === 0) {
        listEl.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted);">No trending topics yet.</div>`;
      } else {
        listEl.innerHTML = items.slice(0, 5).map(item => `
          <a href="/explore?tag=${encodeURIComponent(item.tag)}" class="trending-bento-item">
            <div>
              <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-main);">#${escapeHTML(item.tag)}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${item.count} conversations</div>
            </div>
            <div class="trending-sparkline-wrap">
              <span class="sparkline-bar" style="height: 12px;"></span>
              <span class="sparkline-bar" style="height: ${Math.min(22, 10 + item.count * 3)}px;"></span>
              <span class="sparkline-bar" style="height: 16px;"></span>
            </div>
          </a>
        `).join('');
      }
    }
  } catch (err) {
    // silently fail
  }

  // Fetch Who to Follow (uses updated /suggestions supporting both guests & authenticated users)
  try {
    const data = await api.get('/users/suggestions');
    const users = (data.users || []).slice(0, 4);
    const followListEl = container.querySelector('#bento-follow-list');
    if (followListEl) {
      if (users.length === 0) {
        followListEl.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted);">No suggestions right now.</div>`;
      } else {
        followListEl.innerHTML = users.map(u => `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <a href="/u/${escapeHTML(u.username)}" style="display: flex; align-items: center; gap: 10px; min-width: 0; text-decoration: none;">
              ${renderAvatarHTML(u, 'avatar-xs')}
              <div style="min-width: 0;">
                <div style="font-family: var(--font-display); font-weight: 700; font-size: 0.88rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(u.name)}</div>
                <div style="font-size: 0.72rem; color: var(--text-muted);">@${escapeHTML(u.username)}</div>
              </div>
            </a>
            <button class="btn btn-secondary btn-sm btn-follow" data-user-id="${u._id}">Follow</button>
          </div>
        `).join('');

        followListEl.querySelectorAll('.btn-follow').forEach(btn => {
          btn.onclick = async () => {
            if (!isAuthenticated()) {
              openGuestModal('follow people');
              return;
            }
            btn.disabled = true;
            try {
              const res = await api.post(`/users/${btn.dataset.userId}/follow`);
              btn.textContent = res.following ? 'Following' : 'Follow';
              btn.classList.toggle('following', res.following);
            } catch (e) {
              // ignore
            } finally {
              btn.disabled = false;
            }
          };
        });
      }
    }
  } catch (err) {
    // silently fail
  }
};

/**
 * Command Palette (Ctrl+K / ⌘K)
 */
const ensureCommandPalette = () => {
  let palette = document.getElementById('command-palette-modal');
  if (palette) return;

  palette = document.createElement('div');
  palette.id = 'command-palette-modal';
  palette.className = 'command-palette-overlay';
  palette.innerHTML = `
    <div class="command-palette-box" role="dialog" aria-modal="true" aria-label="Command search palette">
      <div class="palette-input-wrap">
        <span style="color: var(--text-muted); display: flex;">${icons.search()}</span>
        <input type="text" id="palette-search-input" class="palette-input" placeholder="Type a name, #hashtag, or page..." autocomplete="off">
        <kbd class="kbd-shortcut">ESC</kbd>
      </div>
      <div class="palette-results-list" id="palette-results">
        <div style="padding: 10px 14px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Quick Navigation</div>
        <a href="/" class="palette-item"><span>${icons.home()}</span><span>Home Feed</span></a>
        <a href="/explore" class="palette-item"><span>${icons.explore()}</span><span>Explore Topics</span></a>
        <a href="/notifications" class="palette-item"><span>${icons.bell()}</span><span>Activity</span></a>
        <a href="/bookmarks" class="palette-item"><span>${icons.bookmark()}</span><span>Saved Bookmarks</span></a>
      </div>
    </div>
  `;
  document.body.appendChild(palette);

  const input = palette.querySelector('#palette-search-input');
  const results = palette.querySelector('#palette-results');

  const onPaletteSearch = debounce(async (query) => {
    const q = query.trim();
    if (!q) {
      results.innerHTML = `
        <div style="padding: 10px 14px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Quick Navigation</div>
        <a href="/" class="palette-item"><span>${icons.home()}</span><span>Home Feed</span></a>
        <a href="/explore" class="palette-item"><span>${icons.explore()}</span><span>Explore Topics</span></a>
        <a href="/notifications" class="palette-item"><span>${icons.bell()}</span><span>Activity</span></a>
        <a href="/bookmarks" class="palette-item"><span>${icons.bookmark()}</span><span>Saved Bookmarks</span></a>
      `;
      return;
    }

    try {
      const data = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      const users = data.users || [];

      let html = `<div style="padding: 10px 14px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Search Results for "${escapeHTML(q)}"</div>`;

      // Tag match shortcut
      if (q.startsWith('#') || q.length > 2) {
        const cleanTag = q.replace(/^#/, '');
        html += `
          <a href="/explore?tag=${encodeURIComponent(cleanTag)}" class="palette-item">
            <span style="color: var(--accent-primary);">${icons.trending()}</span>
            <span>Explore <strong>#${escapeHTML(cleanTag)}</strong></span>
          </a>
        `;
      }

      if (users.length > 0) {
        html += users.map(u => `
          <a href="/u/${escapeHTML(u.username)}" class="palette-item">
            ${renderAvatarHTML(u, 'avatar-xs')}
            <div>
              <div style="font-weight: 700; font-size: 0.9rem;">${escapeHTML(u.name)}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">@${escapeHTML(u.username)}</div>
            </div>
          </a>
        `).join('');
      } else if (!q.startsWith('#')) {
        html += `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No people found matching "${escapeHTML(q)}"</div>`;
      }

      results.innerHTML = html;
    } catch (err) {
      // ignore
    }
  }, 200);

  input.addEventListener('input', (e) => onPaletteSearch(e.target.value));

  // Global keydown listener for Ctrl+K / Cmd+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openPalette();
    }
    if (e.key === 'Escape' && palette.classList.contains('active')) {
      closePalette();
    }
  });

  palette.onclick = (e) => {
    if (e.target === palette) closePalette();
  };
};

export const openPalette = () => {
  const palette = document.getElementById('command-palette-modal');
  if (!palette) return;
  palette.classList.add('active');
  const input = palette.querySelector('#palette-search-input');
  if (input) {
    input.value = '';
    input.focus();
  }
};

export const closePalette = () => {
  const palette = document.getElementById('command-palette-modal');
  if (palette) palette.classList.remove('active');
};

/**
 * Shell Event Listeners (Theme, Menus, Modals)
 */
const attachShellListeners = () => {
  // Theme toggle
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.onclick = () => {
      const nextTheme = toggleTheme();
      themeBtn.innerHTML = nextTheme === 'dark' ? icons.sun() : icons.moon();
    };
  }

  // Command palette search button
  const searchBtn = document.getElementById('open-palette-btn');
  if (searchBtn) {
    searchBtn.onclick = openPalette;
  }

  // User menu dropdown toggle
  const userTrigger = document.getElementById('user-menu-trigger');
  const userDropdown = document.getElementById('user-menu-dropdown');
  if (userTrigger && userDropdown) {
    userTrigger.onclick = (e) => {
      e.stopPropagation();
      const isOpen = userDropdown.style.display === 'block';
      userDropdown.style.display = isOpen ? 'none' : 'block';
    };

    document.addEventListener('click', (e) => {
      if (!userTrigger.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.style.display = 'none';
      }
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      clearAuth();
      window.location.href = '/';
    };
  }

  // Mobile compose button
  const dockCompose = document.getElementById('dock-compose-trigger');
  if (dockCompose) {
    dockCompose.onclick = () => {
      if (!isAuthenticated()) {
        openGuestModal('create a post');
        return;
      }
      const composerInput = document.querySelector('.composer-textarea');
      if (composerInput) {
        composerInput.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        openGlobalComposerModal();
      }
    };
  }
};

/**
 * Check unread notification count
 */
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
    // catch
  }
};

/**
 * Global composer bottom sheet modal for pages without inline composer
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
          <h3 id="global-composer-title" class="modal-title">Create Story</h3>
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
        window.location.href = '/';
      }
    });
    openModal(modal);
  });
};

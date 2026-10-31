import { renderAppShell } from '../core/shell.js';
import { api } from '../core/api.js';
import { getCurrentUser, isAuthenticated, setAuth } from '../core/auth.js';
import { renderAvatarHTML } from '../core/avatar.js';
import { renderPostCard } from '../components/postCard.js';
import { openGuestModal } from '../core/modal.js';
import { showToast } from '../core/toast.js';
import { escapeHTML } from '../core/utils.js';
import { openLightbox } from '../components/lightbox.js';

let profileUser = null;
let profilePosts = [];
let activeTab = 'grid'; // 'grid' or 'feed'

const heroMount = document.getElementById('profile-hero-mount');
const photoGridEl = document.getElementById('profile-photo-grid');
const feedStreamEl = document.getElementById('profile-feed-stream');
const loadingIndicator = document.getElementById('profile-loading');

export const initProfilePage = async () => {
  renderAppShell('profile');

  // Extract username from pathname /u/:username
  const pathParts = window.location.pathname.split('/');
  let username = '';
  const uIndex = pathParts.indexOf('u');
  if (uIndex !== -1 && pathParts[uIndex + 1]) {
    username = pathParts[uIndex + 1];
  } else {
    const params = new URLSearchParams(window.location.search);
    username = params.get('username') || '';
  }

  const currentUser = getCurrentUser();
  if (!username && currentUser) {
    username = currentUser.username;
  }

  if (!username) {
    window.location.href = '/login';
    return;
  }

  await loadUserProfile(username);
  setupProfileTabs();
  setupEditModal();
};

const loadUserProfile = async (username) => {
  if (loadingIndicator) loadingIndicator.style.display = 'block';

  try {
    const res = await api.get(`/users/${encodeURIComponent(username)}`);
    profileUser = res.user;

    renderProfileHero(profileUser);
    await loadUserPosts(username);
  } catch (err) {
    console.error('Failed to load profile:', err);
    if (heroMount) {
      heroMount.innerHTML = `
        <div style="background: var(--bg-surface); border: 1px solid var(--border-hairline); border-radius: var(--rad-lg); padding: 48px 20px; text-align: center;">
          <h2 style="font-weight: 800; margin-bottom: 8px;">User not found</h2>
          <p style="color: var(--text-muted); font-size: var(--text-sm);">The user @${escapeHTML(username)} does not exist or has been removed.</p>
          <a href="/" class="btn btn-primary btn-sm" style="margin-top: 16px;">Back to Home</a>
        </div>
      `;
    }
    if (loadingIndicator) loadingIndicator.style.display = 'none';
  }
};

const renderProfileHero = (user) => {
  if (!heroMount) return;

  const currentUser = getCurrentUser();
  const isMe = currentUser && (currentUser._id === user._id || currentUser.id === user._id);

  heroMount.innerHTML = `
    <div class="profile-header-card">
      <div class="profile-avatar-large-wrap">
        ${renderAvatarHTML(user, 'avatar-xl')}
      </div>

      <div class="profile-info-col">
        <div class="profile-name-action-row">
          <div>
            <h1 class="profile-display-name">${escapeHTML(user.name)}</h1>
            <div class="profile-username-tag">@${escapeHTML(user.username)}</div>
          </div>

          <div style="margin-left: auto;">
            ${isMe ? `
              <button type="button" class="btn btn-secondary btn-sm" id="edit-profile-trigger">
                Edit Profile
              </button>
            ` : `
              <button type="button" class="btn ${user.isFollowing ? 'btn-secondary following' : 'btn-primary'} btn-sm btn-follow" id="profile-follow-btn">
                <span>${user.isFollowing ? 'Following' : 'Follow'}</span>
              </button>
            `}
          </div>
        </div>

        <!-- Instagram Stats Row -->
        <div class="profile-stats-row">
          <div class="profile-stat-box">
            <span class="profile-stat-count" id="stat-posts-count">${user.postsCount || 0}</span>
            <span class="profile-stat-label">posts</span>
          </div>
          <div class="profile-stat-box">
            <span class="profile-stat-count" id="stat-followers-count">${user.followersCount || 0}</span>
            <span class="profile-stat-label">followers</span>
          </div>
          <div class="profile-stat-box">
            <span class="profile-stat-count">${user.followingCount || 0}</span>
            <span class="profile-stat-label">following</span>
          </div>
        </div>

        <!-- Bio text -->
        ${user.bio ? `
          <div class="profile-bio-text">${escapeHTML(user.bio)}</div>
        ` : ''}
      </div>
    </div>
  `;

  // Follow Button Toggle
  const followBtn = heroMount.querySelector('#profile-follow-btn');
  if (followBtn) {
    followBtn.addEventListener('click', async () => {
      if (!isAuthenticated()) {
        openGuestModal(`follow ${user.name}`);
        return;
      }
      followBtn.disabled = true;
      try {
        const res = await api.post(`/users/${user._id}/follow`);
        user.isFollowing = res.following;
        const followersCountEl = heroMount.querySelector('#stat-followers-count');
        if (followersCountEl) {
          followersCountEl.textContent = res.followersCount || user.followersCount;
        }

        if (res.following) {
          followBtn.className = 'btn btn-secondary btn-sm btn-follow following';
          followBtn.innerHTML = '<span>Following</span>';
        } else {
          followBtn.className = 'btn btn-primary btn-sm btn-follow';
          followBtn.innerHTML = '<span>Follow</span>';
        }
      } catch (err) {
        showToast(err.message || 'Action failed');
      } finally {
        followBtn.disabled = false;
      }
    });
  }

  // Edit Profile Trigger
  const editBtn = heroMount.querySelector('#edit-profile-trigger');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      openEditModal(user);
    });
  }
};

const loadUserPosts = async (username) => {
  try {
    const res = await api.get(`/users/${encodeURIComponent(username)}/posts`);
    profilePosts = res.posts || res.items || [];

    // Update posts count
    const postsCountEl = heroMount ? heroMount.querySelector('#stat-posts-count') : null;
    if (postsCountEl) postsCountEl.textContent = profilePosts.length;

    renderPhotoGrid(profilePosts);
    renderFeedList(profilePosts);

    if (loadingIndicator) loadingIndicator.style.display = 'none';
  } catch (err) {
    console.error('Failed to load user posts:', err);
    if (loadingIndicator) loadingIndicator.textContent = 'Error loading posts.';
  }
};

const renderPhotoGrid = (posts) => {
  if (!photoGridEl) return;
  photoGridEl.innerHTML = '';

  const mediaPosts = posts.filter(p => Boolean(p.image));

  if (mediaPosts.length === 0) {
    photoGridEl.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: var(--text-muted);">
        <div style="margin-bottom: 12px; color: var(--text-muted); display: flex; justify-content: center;">
          <svg class="icon icon-lg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
        </div>
        <div style="font-weight: 700; color: var(--text-main); font-size: var(--text-sm);">No Photos Yet</div>
        <div style="font-size: var(--text-xs);">When this creator shares photos, they will appear here.</div>
      </div>
    `;
    return;
  }

  mediaPosts.forEach(post => {
    const tile = document.createElement('div');
    tile.className = 'photo-grid-tile';
    tile.innerHTML = `
      <img src="${escapeHTML(post.image)}" alt="User photo" loading="lazy" />
      <div class="photo-grid-overlay">
        <span>❤️ ${post.likesCount || 0}</span>
        <span>💬 ${post.commentsCount || 0}</span>
      </div>
    `;

    tile.addEventListener('click', () => {
      openLightbox(post.image, post.text || 'Sangam photo');
    });

    photoGridEl.appendChild(tile);
  });
};

const renderFeedList = (posts) => {
  if (!feedStreamEl) return;
  feedStreamEl.innerHTML = '';

  if (posts.length === 0) {
    feedStreamEl.innerHTML = `
      <div style="padding: 40px 20px; text-align: center; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--rad-lg); border: 1px solid var(--border-hairline);">
        <div style="margin-bottom: 12px; color: var(--text-muted); display: flex; justify-content: center;">
          <svg class="icon icon-lg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
          </svg>
        </div>
        <div style="font-weight: 700; color: var(--text-main); font-size: var(--text-sm);">No Conversations Yet</div>
      </div>
    `;
    return;
  }

  posts.forEach(post => {
    const card = renderPostCard(post, {
      onPostDeleted: (deletedId) => {
        profilePosts = profilePosts.filter(p => p._id !== deletedId);
        renderPhotoGrid(profilePosts);
        renderFeedList(profilePosts);
      }
    });
    feedStreamEl.appendChild(card);
  });
};

const setupProfileTabs = () => {
  const tabGrid = document.getElementById('tab-grid');
  const tabFeed = document.getElementById('tab-feed');
  if (!tabGrid || !tabFeed) return;

  tabGrid.addEventListener('click', () => {
    activeTab = 'grid';
    tabGrid.classList.add('active');
    tabFeed.classList.remove('active');
    if (photoGridEl) photoGridEl.style.display = 'grid';
    if (feedStreamEl) feedStreamEl.style.display = 'none';
  });

  tabFeed.addEventListener('click', () => {
    activeTab = 'feed';
    tabFeed.classList.add('active');
    tabGrid.classList.remove('active');
    if (photoGridEl) photoGridEl.style.display = 'none';
    if (feedStreamEl) feedStreamEl.style.display = 'flex';
  });
};

const setupEditModal = () => {
  const modal = document.getElementById('edit-profile-modal');
  const closeBtn = document.getElementById('close-edit-modal');
  const cancelBtn = document.getElementById('cancel-edit-btn');
  const form = document.getElementById('edit-profile-form');

  if (!modal) return;

  const closeModalFn = () => {
    modal.style.display = 'none';
  };

  if (closeBtn) closeBtn.onclick = closeModalFn;
  if (cancelBtn) cancelBtn.onclick = closeModalFn;

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('edit-name').value.trim();
      const bio = document.getElementById('edit-bio').value.trim();

      if (!name) return;

      try {
        const res = await api.put('/users/profile', { name, bio });
        showToast('Profile updated!');
        closeModalFn();

        // Update local auth
        const current = getCurrentUser();
        if (current) {
          current.name = res.user.name;
          current.bio = res.user.bio;
          setAuth(localStorage.getItem('sangam_token'), current);
        }

        profileUser = res.user;
        renderProfileHero(profileUser);
      } catch (err) {
        showToast(err.message || 'Failed to update profile');
      }
    };
  }
};

const openEditModal = (user) => {
  const modal = document.getElementById('edit-profile-modal');
  if (!modal) return;

  const nameInput = document.getElementById('edit-name');
  const bioInput = document.getElementById('edit-bio');

  if (nameInput) nameInput.value = user.name || '';
  if (bioInput) bioInput.value = user.bio || '';

  modal.style.display = 'flex';
};

document.addEventListener('DOMContentLoaded', initProfilePage);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initProfilePage();
}

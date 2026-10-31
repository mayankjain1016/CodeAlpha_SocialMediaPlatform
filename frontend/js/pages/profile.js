import { renderAppShell } from '../core/shell.js';
import { api } from '../core/api.js';
import { getCurrentUser, isAuthenticated, updateCurrentUser } from '../core/auth.js';
import { renderAvatarHTML } from '../core/avatar.js';
import { renderPostCard } from '../components/postCard.js';
import { renderUserCard } from '../components/userCard.js';
import { renderFeedSkeletons } from '../components/skeletons.js';
import { icons } from '../core/icons.js';
import { escapeHTML } from '../core/utils.js';
import { countUp, staggerEntrance, initCardTilt } from '../core/motion.js';
import { openModal, closeModal, openGuestModal } from '../core/modal.js';
import { showToast } from '../core/toast.js';
import { openLightbox } from '../components/lightbox.js';

let profileUser = null;
let activeTab = 'posts'; // 'posts' | 'media'
let nextCursor = null;
let isLoading = false;
let hasReachedEnd = false;
let selectedBannerPreset = 0;

const heroMount = document.getElementById('profile-hero-mount');
const streamEl = document.getElementById('user-posts-stream');
const sentinelEl = document.getElementById('profile-sentinel');
const tabPosts = document.getElementById('tab-user-posts');
const tabMedia = document.getElementById('tab-user-media');
const tabIndicator = document.getElementById('profile-tab-indicator');

const editModal = document.getElementById('edit-profile-modal');
const editForm = document.getElementById('edit-profile-form');
const editNameInput = document.getElementById('edit-name');
const editBioInput = document.getElementById('edit-bio');
const editBioCount = document.getElementById('edit-bio-count');
const bannerPicker = document.getElementById('banner-preset-picker');

const userListModal = document.getElementById('user-list-modal');
const userListMount = document.getElementById('user-list-mount');
const userListTitle = document.getElementById('user-list-title');

const getUsernameFromPath = () => {
  const parts = window.location.pathname.split('/');
  return parts[2] || '';
};

export const initProfilePage = async () => {
  renderAppShell('profile');

  const username = getUsernameFromPath();
  if (!username) {
    window.location.href = '/';
    return;
  }

  updateTabIndicator();
  setupTabListeners();

  await loadProfile(username);
  await loadUserPosts(true);
};

const updateTabIndicator = () => {
  const activeBtn = activeTab === 'posts' ? tabPosts : tabMedia;
  if (!activeBtn || !tabIndicator) return;
  tabIndicator.style.width = `${activeBtn.offsetWidth}px`;
  tabIndicator.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
};

const setupTabListeners = () => {
  window.addEventListener('resize', updateTabIndicator);
  setTimeout(updateTabIndicator, 50);

  if (tabPosts) {
    tabPosts.onclick = () => {
      if (activeTab === 'posts') return;
      activeTab = 'posts';
      tabPosts.classList.add('active');
      tabPosts.setAttribute('aria-selected', 'true');
      tabMedia.classList.remove('active');
      tabMedia.setAttribute('aria-selected', 'false');
      updateTabIndicator();
      loadUserPosts(true);
    };
  }

  if (tabMedia) {
    tabMedia.onclick = () => {
      if (activeTab === 'media') return;
      activeTab = 'media';
      tabMedia.classList.add('active');
      tabMedia.setAttribute('aria-selected', 'true');
      tabPosts.classList.remove('active');
      tabPosts.setAttribute('aria-selected', 'false');
      updateTabIndicator();
      loadUserPosts(true);
    };
  }

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading && !hasReachedEnd) {
      loadUserPosts(false);
    }
  }, { rootMargin: '220px' });
  if (sentinelEl) observer.observe(sentinelEl);
};

const loadProfile = async (username) => {
  try {
    const data = await api.get(`/users/${encodeURIComponent(username)}`);
    profileUser = data.user;
    document.title = `${profileUser.name} (@${profileUser.username}) / Sangam`;
    renderHero();
  } catch (err) {
    if (heroMount) {
      heroMount.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-state-svg">${icons.user()}</div>
          <h3 style="font-family: var(--font-display); font-size: 1.3rem; margin-bottom: 6px;">Profile Not Found</h3>
          <p style="color: var(--text-secondary); margin-bottom: 16px;">This user does not exist or has been relocated.</p>
          <a href="/" class="btn btn-primary btn-sm">Return Home</a>
        </div>
      `;
    }
    if (sentinelEl) sentinelEl.style.display = 'none';
  }
};

const renderHero = () => {
  const u = profileUser;
  if (!u || !heroMount) return;

  const joinDate = new Date(u.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const presetClass = `banner-preset-${u.bannerPreset || 0}`;

  heroMount.innerHTML = `
    <div class="profile-bento-header spotlight-card" id="bento-profile-card">
      <!-- Generative Tall Banner -->
      <div class="${presetClass} profile-banner-hero"></div>

      <!-- Profile Details -->
      <div class="profile-header-body">
        <div class="profile-avatar-row">
          <div class="avatar-story-ring">
            ${renderAvatarHTML(u, 'avatar-xl')}
          </div>

          <div>
            ${u.isMe ? `
              <button type="button" class="btn btn-secondary" id="edit-profile-trigger">
                <span>Edit Profile</span>
              </button>
            ` : `
              <button type="button" class="btn btn-secondary btn-follow ${u.isFollowing ? 'following' : ''}" id="profile-follow-btn">
                <span>${u.isFollowing ? 'Following' : 'Follow'}</span>
              </button>
            `}
          </div>
        </div>

        <!-- Names & Verification -->
        <div>
          <h1 class="profile-display-name">${escapeHTML(u.name)}</h1>
          <div class="profile-handle-sub">@${escapeHTML(u.username)}</div>
        </div>

        <!-- Bio -->
        ${u.bio ? `
          <p class="profile-bio-text">${escapeHTML(u.bio)}</p>
        ` : ''}

        <!-- Meta row: Joined Date -->
        <div class="profile-meta-row">
          <span style="display: flex; align-items: center; gap: 6px;">
            ${icons.calendar()}
            <span>Joined ${joinDate}</span>
          </span>
        </div>

        <!-- Bento Stat Tiles with Count-up -->
        <div class="profile-stats-bento">
          <div class="profile-stat-box">
            <span class="profile-stat-val" id="stat-posts-val">0</span>
            <span class="profile-stat-key">Posts</span>
          </div>
          <button type="button" class="profile-stat-box" id="btn-view-followers" style="text-align: left; cursor: pointer; transition: background var(--dur-fast) ease;">
            <span class="profile-stat-val" id="stat-followers-val">0</span>
            <span class="profile-stat-key">Followers</span>
          </button>
          <button type="button" class="profile-stat-box" id="btn-view-following" style="text-align: left; cursor: pointer; transition: background var(--dur-fast) ease;">
            <span class="profile-stat-val" id="stat-following-val">0</span>
            <span class="profile-stat-key">Following</span>
          </button>
        </div>
      </div>
    </div>
  `;

  // Attach 3D pointer tilt on desktop
  const headerCard = heroMount.querySelector('#bento-profile-card');
  if (headerCard) {
    initCardTilt(headerCard);
  }

  // Count-up stats
  countUp(document.getElementById('stat-posts-val'), u.postsCount);
  countUp(document.getElementById('stat-followers-val'), u.followersCount);
  countUp(document.getElementById('stat-following-val'), u.followingCount);

  // Follow Button morphing
  const followBtn = document.getElementById('profile-follow-btn');
  if (followBtn) {
    followBtn.onclick = async () => {
      if (!isAuthenticated()) {
        openGuestModal('follow creators');
        return;
      }
      followBtn.disabled = true;
      try {
        const res = await api.post(`/users/${u._id}/follow`);
        u.isFollowing = res.following;
        u.followersCount = res.followersCount;

        if (res.following) {
          followBtn.textContent = 'Following';
          followBtn.classList.add('following');
        } else {
          followBtn.textContent = 'Follow';
          followBtn.classList.remove('following');
        }

        const followersVal = document.getElementById('stat-followers-val');
        if (followersVal) followersVal.textContent = res.followersCount.toLocaleString();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        followBtn.disabled = false;
      }
    };
  }

  // Edit Profile Trigger
  const editBtn = document.getElementById('edit-profile-trigger');
  if (editBtn) {
    editBtn.onclick = openEditModal;
  }

  // Community List Modals
  const followersBox = document.getElementById('btn-view-followers');
  if (followersBox) followersBox.onclick = () => openUserListModal('Followers');

  const followingBox = document.getElementById('btn-view-following');
  if (followingBox) followingBox.onclick = () => openUserListModal('Following');
};

const openEditModal = () => {
  editNameInput.value = profileUser.name;
  editBioInput.value = profileUser.bio || '';
  editBioCount.textContent = `${editBioInput.value.length}/160`;
  selectedBannerPreset = profileUser.bannerPreset || 0;

  // Render 8 banner presets picker
  bannerPicker.innerHTML = Array(8).fill(0).map((_, i) => `
    <div class="banner-preset-${i} preset-swatch ${i === selectedBannerPreset ? 'active' : ''}" data-preset="${i}" style="height: 48px; border-radius: var(--radius-md); cursor: pointer; border: 2.5px solid ${i === selectedBannerPreset ? 'var(--accent-primary)' : 'transparent'}; transition: border 0.2s ease;"></div>
  `).join('');

  bannerPicker.querySelectorAll('.preset-swatch').forEach(swatch => {
    swatch.onclick = () => {
      selectedBannerPreset = parseInt(swatch.dataset.preset, 10);
      bannerPicker.querySelectorAll('.preset-swatch').forEach(s => {
        const isSelected = parseInt(s.dataset.preset, 10) === selectedBannerPreset;
        s.style.borderColor = isSelected ? 'var(--accent-primary)' : 'transparent';
      });
    };
  });

  editBioInput.oninput = () => {
    editBioCount.textContent = `${editBioInput.value.length}/160`;
  };

  openModal(editModal);

  editModal.querySelector('.modal-close-btn').onclick = () => closeModal(editModal);
  editModal.querySelector('.modal-cancel-btn').onclick = () => closeModal(editModal);

  editForm.onsubmit = async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('save-profile-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const res = await api.put('/users/me', {
        name: editNameInput.value.trim(),
        bio: editBioInput.value.trim(),
        bannerPreset: selectedBannerPreset,
      });

      profileUser.name = res.user.name;
      profileUser.bio = res.user.bio;
      profileUser.bannerPreset = res.user.bannerPreset;
      updateCurrentUser(res.user);

      renderHero();
      closeModal(editModal);
      showToast('Profile updated!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes';
    }
  };
};

const openUserListModal = async (type) => {
  userListTitle.textContent = type;
  userListMount.innerHTML = `
    <div style="padding: 16px;">
      <div class="skeleton" style="height: 48px; margin-bottom: 8px;"></div>
      <div class="skeleton" style="height: 48px; margin-bottom: 8px;"></div>
    </div>
  `;
  openModal(userListModal);

  userListModal.querySelector('.modal-close-btn').onclick = () => closeModal(userListModal);

  try {
    const endpoint = type === 'Followers'
      ? `/users/${profileUser.username}/followers`
      : `/users/${profileUser.username}/following`;

    const data = await api.get(endpoint);
    const users = data.users || [];

    if (users.length === 0) {
      userListMount.innerHTML = `
        <div style="padding: 36px 16px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
          No ${type.toLowerCase()} found yet.
        </div>
      `;
    } else {
      userListMount.innerHTML = '';
      users.forEach(u => {
        userListMount.appendChild(renderUserCard(u));
      });
    }
  } catch (err) {
    userListMount.innerHTML = `<div style="padding: 24px; color: var(--coral-500);">${err.message}</div>`;
  }
};

const loadUserPosts = async (reset = false) => {
  if (!streamEl) return;
  if (isLoading) return;
  if (!reset && hasReachedEnd) return;

  isLoading = true;

  if (reset) {
    nextCursor = null;
    hasReachedEnd = false;
    streamEl.innerHTML = renderFeedSkeletons(3);
    if (sentinelEl) sentinelEl.style.display = 'block';
  }

  try {
    const mediaParam = activeTab === 'media' ? '&mediaOnly=true' : '';
    const url = `/posts/user/${encodeURIComponent(getUsernameFromPath())}?limit=12${nextCursor ? `&cursor=${nextCursor}` : ''}${mediaParam}`;

    const data = await api.get(url);
    const items = data.items || [];
    nextCursor = data.nextCursor;

    if (reset) streamEl.innerHTML = '';

    if (items.length === 0 && reset) {
      streamEl.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-state-svg">${activeTab === 'media' ? icons.image() : icons.message()}</div>
          <h3 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; margin: 0 0 6px 0;">No ${activeTab} yet</h3>
          <p style="color: var(--text-secondary); max-width: 320px; margin: 0 auto; font-size: 0.9rem;">
            When @${escapeHTML(getUsernameFromPath())} publishes ${activeTab}, they will appear here.
          </p>
        </div>
      `;
      if (sentinelEl) sentinelEl.style.display = 'none';
      hasReachedEnd = true;
    } else {
      if (activeTab === 'media') {
        // Media Masonry Grid
        let grid = streamEl.querySelector('.media-masonry-grid');
        if (!grid) {
          grid = document.createElement('div');
          grid.className = 'media-masonry-grid';
          streamEl.appendChild(grid);
        }

        items.forEach(post => {
          if (!post.image) return;
          const item = document.createElement('div');
          item.className = 'media-grid-item';
          item.innerHTML = `<img src="${escapeHTML(post.image)}" alt="Media post" loading="lazy">`;
          item.onclick = () => openLightbox(post.image, post.text || 'Sangam media');
          grid.appendChild(item);
        });
      } else {
        const fragment = document.createDocumentFragment();
        items.forEach(post => {
          fragment.appendChild(renderPostCard(post, {
            onPostDeleted: () => {
              profileUser.postsCount = Math.max(0, profileUser.postsCount - 1);
              const postCountEl = document.getElementById('stat-posts-val');
              if (postCountEl) postCountEl.textContent = profileUser.postsCount;
            }
          }));
        });
        streamEl.appendChild(fragment);
      }

      staggerEntrance(streamEl);

      if (!nextCursor) {
        hasReachedEnd = true;
        if (sentinelEl) sentinelEl.innerHTML = `<span style="color: var(--text-faint); font-size: 0.82rem;">End of conversations</span>`;
      } else {
        if (sentinelEl) sentinelEl.innerHTML = `<span class="btn-spinner" style="display: inline-block;"></span>`;
      }
    }
  } catch (err) {
    if (reset) {
      streamEl.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--coral-500);"><p>${err.message}</p></div>`;
    }
    if (sentinelEl) sentinelEl.style.display = 'none';
  } finally {
    isLoading = false;
  }
};

initProfilePage();

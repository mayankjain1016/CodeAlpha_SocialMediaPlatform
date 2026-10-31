import { renderAppShell } from '../core/shell.js';
import { api } from '../core/api.js';
import { getCurrentUser, isAuthenticated, updateCurrentUser } from '../core/auth.js';
import { renderAvatarHTML } from '../core/avatar.js';
import { renderPostCard } from '../components/postCard.js';
import { renderUserCard } from '../components/userCard.js';
import { renderFeedSkeletons } from '../components/skeletons.js';
import { icons } from '../core/icons.js';
import { escapeHTML } from '../core/utils.js';
import { countUp, staggerEntrance } from '../core/motion.js';
import { openModal, closeModal, openGuestModal } from '../core/modal.js';
import { showToast } from '../core/toast.js';

let profileUser = null;
let activeTab = 'posts'; // 'posts' | 'media'
let nextCursor = null;
let isLoading = false;
let hasReachedEnd = false;
let selectedBannerPreset = 0;

const heroMount = document.getElementById('profile-hero');
const streamEl = document.getElementById('user-posts-stream');
const sentinelEl = document.getElementById('profile-sentinel');
const backBtn = document.getElementById('profile-back-btn');
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

// Extract username from URL path: /u/:username
const getUsernameFromPath = () => {
  const parts = window.location.pathname.split('/');
  return parts[2] || '';
};

const initProfilePage = async () => {
  renderAppShell('profile');

  const username = getUsernameFromPath();
  if (!username) {
    window.location.href = '/';
    return;
  }

  backBtn.onclick = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

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

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading && !hasReachedEnd) {
      loadUserPosts(false);
    }
  }, { rootMargin: '200px' });
  observer.observe(sentinelEl);
};

const loadProfile = async (username) => {
  try {
    const data = await api.get(`/users/${encodeURIComponent(username)}`);
    profileUser = data.user;

    // Update Header
    document.getElementById('header-profile-name').textContent = profileUser.name;
    document.getElementById('header-profile-postscount').textContent = `${profileUser.postsCount} post${profileUser.postsCount === 1 ? '' : 's'}`;
    document.title = `${profileUser.name} (@${profileUser.username}) / Sangam`;

    renderHero();
  } catch (err) {
    heroMount.innerHTML = `
      <div style="padding: 48px; text-align: center; color: var(--red-500);">
        <h3>User not found</h3>
        <p style="color: var(--text-muted); margin-bottom: 16px;">This account doesn't exist.</p>
        <a href="/" class="btn btn-secondary">Go Home</a>
      </div>
    `;
    sentinelEl.style.display = 'none';
  }
};

const renderHero = () => {
  const u = profileUser;
  const joinDate = new Date(u.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const presetClass = `banner-preset-${u.bannerPreset || 0}`;

  heroMount.innerHTML = `
    <!-- Top Banner -->
    <div class="${presetClass}" style="height: 180px; width: 100%; position: relative;"></div>

    <!-- Profile Details & Avatar -->
    <div style="padding: 0 16px 16px; position: relative;">
      <!-- Action row with avatar and button -->
      <div style="display: flex; align-items: flex-end; justify-content: space-between; margin-top: -48px; margin-bottom: 14px;">
        <div class="avatar-profile-ring">
          ${renderAvatarHTML(u, 'avatar-xl')}
        </div>

        <div>
          ${u.isMe ? `
            <button class="btn btn-secondary" id="edit-profile-trigger">
              Edit profile
            </button>
          ` : `
            <button class="btn btn-secondary btn-follow ${u.isFollowing ? 'following' : ''}" id="profile-follow-btn">
              ${u.isFollowing ? 'Following' : 'Follow'}
            </button>
          `}
        </div>
      </div>

      <!-- Names -->
      <div style="margin-bottom: 12px;">
        <h2 style="font-size: var(--text-xl); font-weight: 800; line-height: 1.1; margin-bottom: 2px;">
          ${escapeHTML(u.name)}
        </h2>
        <span style="color: var(--text-muted); font-size: 0.88rem;">@${escapeHTML(u.username)}</span>
      </div>

      <!-- Bio -->
      ${u.bio ? `
        <p style="font-size: 0.95rem; color: var(--text-main); line-height: 1.45; margin-bottom: 14px; word-break: break-word;">
          ${escapeHTML(u.bio)}
        </p>
      ` : ''}

      <!-- Joined info -->
      <div style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-muted); margin-bottom: 16px;">
        <span>${icons.calendar('nav-icon')}</span>
        <span>Joined ${joinDate}</span>
      </div>

      <!-- Counts with Count-Up & Modal trigger -->
      <div style="display: flex; gap: 20px; font-size: 0.88rem;">
        <button id="view-following-btn" style="color: var(--text-muted); display: flex; gap: 5px;">
          <strong id="following-count-val" style="color: var(--text-main);">0</strong> Following
        </button>
        <button id="view-followers-btn" style="color: var(--text-muted); display: flex; gap: 5px;">
          <strong id="followers-count-val" style="color: var(--text-main);">0</strong> Followers
        </button>
      </div>
    </div>
  `;

  // Animate count-up stats
  const followersEl = document.getElementById('followers-count-val');
  const followingEl = document.getElementById('following-count-val');
  countUp(followersEl, u.followersCount);
  countUp(followingEl, u.followingCount);

  // Attach Follow Toggle
  const followBtn = document.getElementById('profile-follow-btn');
  if (followBtn) {
    followBtn.onclick = async () => {
      if (!isAuthenticated()) {
        openGuestModal('follow people');
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

        followersEl.textContent = res.followersCount.toLocaleString();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        followBtn.disabled = false;
      }
    };
  }

  // Attach Edit Profile Modal trigger
  const editBtn = document.getElementById('edit-profile-trigger');
  if (editBtn) {
    editBtn.onclick = () => openEditModal();
  }

  // Attach Followers / Following Modals
  document.getElementById('view-followers-btn').onclick = () => openUserListModal('Followers');
  document.getElementById('view-following-btn').onclick = () => openUserListModal('Following');
};

const openEditModal = () => {
  editNameInput.value = profileUser.name;
  editBioInput.value = profileUser.bio || '';
  editBioCount.textContent = `${editBioInput.value.length}/160`;
  selectedBannerPreset = profileUser.bannerPreset || 0;

  // Render 8 banner presets picker
  bannerPicker.innerHTML = Array(8).fill(0).map((_, i) => `
    <div class="banner-preset-${i} preset-swatch ${i === selectedBannerPreset ? 'active' : ''}" data-preset="${i}" style="height: 44px; border-radius: var(--radius-sm); cursor: pointer; border: 2px solid ${i === selectedBannerPreset ? 'var(--primary)' : 'transparent'}; transition: border 0.15s ease;"></div>
  `).join('');

  bannerPicker.querySelectorAll('.preset-swatch').forEach(swatch => {
    swatch.onclick = () => {
      selectedBannerPreset = parseInt(swatch.dataset.preset, 10);
      bannerPicker.querySelectorAll('.preset-swatch').forEach(s => {
        const isSelected = parseInt(s.dataset.preset, 10) === selectedBannerPreset;
        s.style.borderColor = isSelected ? 'var(--primary)' : 'transparent';
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
        <div style="padding: 32px 16px; text-align: center; color: var(--text-muted);">
          No ${type.toLowerCase()} yet.
        </div>
      `;
    } else {
      userListMount.innerHTML = '';
      users.forEach(u => {
        userListMount.appendChild(renderUserCard(u));
      });
    }
  } catch (err) {
    userListMount.innerHTML = `<div style="padding: 24px; color: var(--red-500);">${err.message}</div>`;
  }
};

const loadUserPosts = async (reset = false) => {
  if (isLoading) return;
  if (!reset && hasReachedEnd) return;

  isLoading = true;

  if (reset) {
    nextCursor = null;
    hasReachedEnd = false;
    streamEl.innerHTML = renderFeedSkeletons(3);
    sentinelEl.style.display = 'block';
  }

  try {
    const mediaParam = activeTab === 'media' ? '&mediaOnly=true' : '';
    const url = `/posts/user/${encodeURIComponent(getUsernameFromPath())}?limit=10${nextCursor ? `&cursor=${nextCursor}` : ''}${mediaParam}`;

    const data = await api.get(url);
    const items = data.items || [];
    nextCursor = data.nextCursor;

    if (reset) streamEl.innerHTML = '';

    if (items.length === 0 && reset) {
      streamEl.innerHTML = `
        <div style="padding: 48px 24px; text-align: center; color: var(--text-secondary);">
          <h3 style="margin-bottom: 6px; color: var(--text-main);">No ${activeTab} yet</h3>
          <p style="max-width: 320px; margin: 0 auto;">When @${escapeHTML(getUsernameFromPath())} shares ${activeTab}, they will appear here.</p>
        </div>
      `;
      sentinelEl.style.display = 'none';
      hasReachedEnd = true;
    } else {
      const fragment = document.createDocumentFragment();
      items.forEach(post => {
        fragment.appendChild(renderPostCard(post, {
          onPostDeleted: () => {
            profileUser.postsCount = Math.max(0, profileUser.postsCount - 1);
            document.getElementById('header-profile-postscount').textContent = `${profileUser.postsCount} posts`;
          }
        }));
      });
      streamEl.appendChild(fragment);

      staggerEntrance(streamEl);

      if (!nextCursor) {
        hasReachedEnd = true;
        sentinelEl.innerHTML = `<span style="color: var(--text-faint);">End of posts</span>`;
      } else {
        sentinelEl.innerHTML = `<span class="btn-spinner" style="display: inline-block; border-color: var(--border-medium); border-top-color: var(--primary);"></span>`;
      }
    }
  } catch (err) {
    if (reset) {
      streamEl.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--red-500);"><p>${err.message}</p></div>`;
    }
    sentinelEl.style.display = 'none';
  } finally {
    isLoading = false;
  }
};

initProfilePage();

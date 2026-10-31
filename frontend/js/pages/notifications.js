import { renderAppShell, updateUnreadBadge } from '../core/shell.js';
import { api } from '../core/api.js';
import { isAuthenticated } from '../core/auth.js';
import { renderAvatarHTML } from '../core/avatar.js';
import { icons } from '../core/icons.js';
import { timeAgo, escapeHTML } from '../core/utils.js';
import { showToast } from '../core/toast.js';

const streamEl = document.getElementById('notif-stream');
const markAllBtn = document.getElementById('mark-all-read-btn');

const initNotificationsPage = async () => {
  renderAppShell('notifications');

  if (!isAuthenticated()) {
    streamEl.innerHTML = `
      <div style="padding: 48px 24px; text-align: center;">
        <h3 style="margin-bottom: 8px;">Activity on Sangam</h3>
        <p style="color: var(--text-secondary); max-width: 340px; margin: 0 auto 16px;">Log in to view interactions, likes, and replies to your posts.</p>
        <a href="/login" class="btn btn-primary">Log In</a>
      </div>
    `;
    markAllBtn.style.display = 'none';
    return;
  }

  markAllBtn.onclick = async () => {
    try {
      await api.post('/notifications/read-all');
      document.querySelectorAll('.notif-item.unread').forEach(el => {
        el.classList.remove('unread');
        el.style.backgroundColor = 'var(--bg-surface)';
      });
      updateUnreadBadge();
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  await loadNotifications();
};

const loadNotifications = async () => {
  streamEl.innerHTML = `
    <div style="padding: 16px;">
      <div class="skeleton" style="height: 56px; margin-bottom: 8px;"></div>
      <div class="skeleton" style="height: 56px; margin-bottom: 8px;"></div>
      <div class="skeleton" style="height: 56px; margin-bottom: 8px;"></div>
    </div>
  `;

  try {
    const data = await api.get('/notifications');
    const notifs = data.notifications || [];

    if (notifs.length === 0) {
      streamEl.innerHTML = `
        <div style="padding: 64px 24px; text-align: center; color: var(--text-secondary);">
          <div style="width: 48px; height: 48px; margin: 0 auto 16px; border-radius: var(--radius-full); background: var(--bg-surface-subtle); display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
            ${icons.bell('nav-icon')}
          </div>
          <h3 style="margin-bottom: 6px; color: var(--text-main);">No notifications yet</h3>
          <p style="max-width: 320px; margin: 0 auto;">When someone likes your posts, replies, or follows you, you’ll see it here.</p>
        </div>
      `;
      return;
    }

    // Split into Today vs Earlier
    const now = new Date();
    const todayNotifs = [];
    const earlierNotifs = [];

    notifs.forEach(n => {
      const date = new Date(n.createdAt);
      const isToday = (
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
      if (isToday) todayNotifs.push(n);
      else earlierNotifs.push(n);
    });

    let html = '';

    if (todayNotifs.length > 0) {
      html += `<div style="padding: 10px 16px; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); background: var(--bg-surface-subtle); text-transform: uppercase; letter-spacing: 0.05em;">Today</div>`;
      html += todayNotifs.map(n => renderNotificationRow(n)).join('');
    }

    if (earlierNotifs.length > 0) {
      html += `<div style="padding: 10px 16px; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); background: var(--bg-surface-subtle); text-transform: uppercase; letter-spacing: 0.05em;">Earlier</div>`;
      html += earlierNotifs.map(n => renderNotificationRow(n)).join('');
    }

    streamEl.innerHTML = html;
  } catch (err) {
    streamEl.innerHTML = `<div style="padding: 32px; text-align: center; color: var(--red-500);"><p>${err.message}</p></div>`;
  }
};

const renderNotificationRow = (n) => {
  const actor = n.actor || { name: 'Someone', username: 'user', avatarHue: 200 };
  const targetUrl = n.post ? `/post/${n.post._id}` : `/u/${actor.username}`;

  let iconSvg = '';
  let textDesc = '';
  let iconColor = 'var(--primary)';

  if (n.type === 'like') {
    iconSvg = icons.heart('nav-icon');
    iconColor = 'var(--coral-500)';
    textDesc = 'liked your post';
  } else if (n.type === 'comment') {
    iconSvg = icons.message('nav-icon');
    iconColor = 'var(--primary)';
    textDesc = 'commented on your post';
  } else if (n.type === 'follow') {
    iconSvg = icons.user('nav-icon');
    iconColor = 'var(--emerald-500)';
    textDesc = 'started following you';
  } else if (n.type === 'mention') {
    iconSvg = icons.sparkles('nav-icon');
    iconColor = 'var(--amber-500)';
    textDesc = 'mentioned you in a post';
  }

  const unreadBg = !n.read ? 'background-color: var(--primary-light);' : '';

  return `
    <a href="${targetUrl}" class="notif-item ${!n.read ? 'unread' : ''}" style="display: flex; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border-subtle); color: var(--text-main); text-decoration: none; transition: background-color 0.15s ease; ${unreadBg}">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0;">
        <span style="color: ${iconColor}; display: flex;">${iconSvg}</span>
      </div>

      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          ${renderAvatarHTML(actor, 'avatar-xs')}
          <span style="font-weight: 700; font-size: 0.88rem;">${escapeHTML(actor.name)}</span>
          <span style="color: var(--text-secondary); font-size: 0.88rem;">${textDesc}</span>
          <span style="color: var(--text-faint); font-size: 0.75rem; margin-left: auto;">${timeAgo(n.createdAt)}</span>
        </div>

        ${n.post && n.post.text ? `
          <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${escapeHTML(n.post.text)}
          </p>
        ` : ''}
      </div>
    </a>
  `;
};

initNotificationsPage();

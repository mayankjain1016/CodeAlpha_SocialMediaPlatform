import { renderAppShell, updateUnreadBadge } from '../core/shell.js';
import { api } from '../core/api.js';
import { isAuthenticated } from '../core/auth.js';
import { renderAvatarHTML } from '../core/avatar.js';
import { timeAgo, escapeHTML } from '../core/utils.js';
import { showToast } from '../core/toast.js';

const streamEl = document.getElementById('notif-stream');
const markAllBtn = document.getElementById('mark-all-read-btn');

export const initNotificationsPage = async () => {
  renderAppShell('notifications');

  if (!isAuthenticated()) {
    if (streamEl) {
      streamEl.innerHTML = `
        <div style="padding: 48px 20px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">🔔</div>
          <h2 style="font-weight: 800; font-size: var(--text-base); color: var(--text-main); margin-bottom: 6px;">Sign in to view notifications</h2>
          <p style="font-size: var(--text-xs); margin-bottom: 16px;">Connect with creators and see who reacts to your stories and conversations.</p>
          <a href="/login" class="btn btn-primary btn-sm">Log In</a>
        </div>
      `;
    }
    if (markAllBtn) markAllBtn.style.display = 'none';
    return;
  }

  if (markAllBtn) {
    markAllBtn.onclick = async () => {
      try {
        await api.post('/notifications/read-all');
        document.querySelectorAll('.notification-item.unread').forEach(el => {
          el.classList.remove('unread');
        });
        updateUnreadBadge();
        showToast('All notifications marked as read');
      } catch (err) {
        showToast(err.message || 'Action failed');
      }
    };
  }

  await loadNotifications();
};

const loadNotifications = async () => {
  if (!streamEl) return;
  streamEl.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: var(--text-xs);">Loading notifications...</div>`;

  try {
    const data = await api.get('/notifications');
    const notifs = data.notifications || [];

    if (notifs.length === 0) {
      streamEl.innerHTML = `
        <div style="padding: 48px 20px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 8px;">✨</div>
          <h2 style="font-weight: 800; font-size: var(--text-base); color: var(--text-main); margin-bottom: 6px;">All caught up!</h2>
          <p style="font-size: var(--text-xs);">No new notifications right now. Activity will appear here when people interact with you.</p>
        </div>
      `;
      if (markAllBtn) markAllBtn.style.display = 'none';
      return;
    }

    // Split Today vs Earlier
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
      html += `<div class="notification-group-header">Today</div>`;
      todayNotifs.forEach(n => {
        html += renderNotificationHTML(n);
      });
    }

    if (earlierNotifs.length > 0) {
      html += `<div class="notification-group-header">Earlier</div>`;
      earlierNotifs.forEach(n => {
        html += renderNotificationHTML(n);
      });
    }

    streamEl.innerHTML = html;
  } catch (err) {
    streamEl.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: var(--text-xs);">Failed to load notifications.</div>`;
  }
};

const renderNotificationHTML = (n) => {
  const actor = n.actor || { name: 'Someone', username: 'user' };
  const targetUrl = n.post ? `/post/${n.post._id || n.post}` : `/u/${actor.username}`;

  let badgeClass = 'badge-like';
  let badgeIcon = '❤️';
  let actionText = 'reacted to your post';

  if (n.type === 'like') {
    badgeClass = 'badge-like';
    badgeIcon = '❤️';
    actionText = 'reacted to your post';
  } else if (n.type === 'comment') {
    badgeClass = 'badge-comment';
    badgeIcon = '💬';
    actionText = 'commented on your post';
  } else if (n.type === 'follow') {
    badgeClass = 'badge-follow';
    badgeIcon = '👤';
    actionText = 'started following you';
  }

  return `
    <a href="${targetUrl}" class="notification-item ${!n.read ? 'unread' : ''}">
      <div class="notif-left-content">
        <div class="notif-avatar-badge-wrap">
          ${renderAvatarHTML(actor, 'avatar-md')}
          <span class="notif-type-badge ${badgeClass}">${badgeIcon}</span>
        </div>
        <div>
          <div class="notif-text">
            <strong>${escapeHTML(actor.name)}</strong> ${actionText}
          </div>
          <span class="notif-time">${timeAgo(n.createdAt)}</span>
        </div>
      </div>
      <div style="font-size: var(--text-xs); color: var(--text-muted);">↗</div>
    </a>
  `;
};

document.addEventListener('DOMContentLoaded', initNotificationsPage);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initNotificationsPage();
}

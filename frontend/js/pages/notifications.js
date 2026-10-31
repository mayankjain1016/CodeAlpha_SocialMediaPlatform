import { renderAppShell, updateUnreadBadge } from '../core/shell.js';
import { api } from '../core/api.js';
import { isAuthenticated } from '../core/auth.js';
import { renderAvatarHTML } from '../core/avatar.js';
import { icons } from '../core/icons.js';
import { timeAgo, escapeHTML } from '../core/utils.js';
import { showToast } from '../core/toast.js';

const streamEl = document.getElementById('notif-stream');
const markAllBtn = document.getElementById('mark-all-read-btn');

export const initNotificationsPage = async () => {
  renderAppShell('notifications');

  if (!isAuthenticated()) {
    streamEl.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-state-svg">${icons.bell()}</div>
        <h3 style="font-family: var(--font-display); font-size: 1.3rem; margin-bottom: 6px;">Sign in to view activity</h3>
        <p style="color: var(--text-secondary); max-width: 360px; margin: 0 auto 16px; font-size: 0.9rem;">
          Connect with builders, follow your favorite writers, and receive updates when people engage with your thoughts.
        </p>
        <a href="/login" class="btn btn-primary btn-sm">Log In</a>
      </div>
    `;
    if (markAllBtn) markAllBtn.style.display = 'none';
    return;
  }

  if (markAllBtn) {
    markAllBtn.onclick = async () => {
      try {
        await api.post('/notifications/read-all');
        document.querySelectorAll('.notif-card.unread').forEach(el => {
          el.classList.remove('unread');
          const dot = el.querySelector('.notif-unread-dot');
          if (dot) dot.remove();
        });
        updateUnreadBadge();
        showToast('All notifications marked as read', 'success');
      } catch (err) {
        showToast(err.message || 'Action failed', 'error');
      }
    };
  }

  await loadNotifications();
};

const loadNotifications = async () => {
  streamEl.innerHTML = `
    <div class="skeleton" style="height: 72px; margin-bottom: 12px; border-radius: var(--radius-lg);"></div>
    <div class="skeleton" style="height: 72px; margin-bottom: 12px; border-radius: var(--radius-lg);"></div>
    <div class="skeleton" style="height: 72px; margin-bottom: 12px; border-radius: var(--radius-lg);"></div>
  `;

  try {
    const data = await api.get('/notifications');
    const notifs = data.notifications || [];

    if (notifs.length === 0) {
      streamEl.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-state-svg">
            <svg viewBox="0 0 140 140" fill="none" width="100%" height="100%">
              <circle cx="70" cy="70" r="56" stroke="var(--hairline-strong)" stroke-width="2"/>
              <circle cx="70" cy="70" r="42" fill="var(--bg-surface-2)"/>
              <path d="M70 42C61.1634 42 54 49.1634 54 58V72L48 78V82H92V78L86 72V58C86 49.1634 78.8366 42 70 42Z" fill="var(--teal-500)"/>
              <path d="M64 86C64 89.3137 66.6863 92 70 92C73.3137 92 76 89.3137 76 86H64Z" fill="var(--marigold-400)"/>
            </svg>
          </div>
          <h3 style="font-family: var(--font-display); font-size: 1.3rem; margin-bottom: 6px;">All clear</h3>
          <p style="color: var(--text-secondary); max-width: 320px; margin: 0 auto; font-size: 0.9rem;">
            No new activity right now. When creators react or reply to your posts, you will find them here.
          </p>
        </div>
      `;
      if (markAllBtn) markAllBtn.style.display = 'none';
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
      html += `
        <div class="notif-section-group">
          <div class="notif-group-title">Today</div>
          ${todayNotifs.map(n => renderNotificationCard(n)).join('')}
        </div>
      `;
    }

    if (earlierNotifs.length > 0) {
      html += `
        <div class="notif-section-group">
          <div class="notif-group-title">Earlier</div>
          ${earlierNotifs.map(n => renderNotificationCard(n)).join('')}
        </div>
      `;
    }

    streamEl.innerHTML = html;
  } catch (err) {
    streamEl.innerHTML = `<div style="padding: 32px; text-align: center; color: var(--coral-500);"><p>${err.message}</p></div>`;
  }
};

const renderNotificationCard = (n) => {
  const actor = n.actor || { name: 'Someone', username: 'user', avatarHue: 175 };
  const targetUrl = n.post ? `/post/${n.post._id}` : `/u/${actor.username}`;

  let bubbleClass = 'notif-bubble-heart';
  let bubbleIcon = icons.heart();
  let actionText = 'liked your post';

  if (n.type === 'like') {
    bubbleClass = 'notif-bubble-heart';
    bubbleIcon = icons.heart();
    actionText = 'liked your post';
  } else if (n.type === 'comment') {
    bubbleClass = 'notif-bubble-comment';
    bubbleIcon = icons.message();
    actionText = 'replied to your conversation';
  } else if (n.type === 'follow') {
    bubbleClass = 'notif-bubble-follow';
    bubbleIcon = icons.user();
    actionText = 'started following your stream';
  } else if (n.type === 'mention') {
    bubbleClass = 'notif-bubble-comment';
    bubbleIcon = icons.sparkles();
    actionText = 'mentioned you in a post';
  }

  return `
    <a href="${targetUrl}" class="notif-card spotlight-card ${!n.read ? 'unread' : ''}" style="text-decoration: none; color: inherit;">
      ${!n.read ? `<span class="notif-unread-dot"></span>` : ''}
      <div class="notif-bubble ${bubbleClass}">
        ${bubbleIcon}
      </div>

      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 4px; flex-wrap: wrap;">
          ${renderAvatarHTML(actor, 'avatar-xs')}
          <span style="font-family: var(--font-display); font-weight: 700; font-size: 0.92rem; color: var(--text-main);">${escapeHTML(actor.name)}</span>
          <span style="font-size: 0.85rem; color: var(--text-secondary);">${actionText}</span>
          <span style="font-size: 0.72rem; color: var(--text-muted); margin-left: auto;">${timeAgo(n.createdAt)}</span>
        </div>

        ${n.post && n.post.text ? `
          <p style="font-size: 0.84rem; color: var(--text-muted); margin: 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            "${escapeHTML(n.post.text)}"
          </p>
        ` : ''}
      </div>
    </a>
  `;
};

initNotificationsPage();

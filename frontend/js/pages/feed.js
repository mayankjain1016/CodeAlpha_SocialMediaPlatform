import { renderAppShell } from '../core/shell.js';
import { api } from '../core/api.js';
import { isAuthenticated } from '../core/auth.js';
import { renderPostCard } from '../components/postCard.js';
import { renderStoriesRow } from '../components/stories.js';
import { renderCreatePostCard } from '../components/createPostCard.js';
import { renderTopicChips } from '../components/topicChips.js';
import { openGuestModal } from '../core/modal.js';

let activeTab = 'explore'; // 'explore' (For You) or 'following'
let currentTopic = '';
let nextCursor = null;
let isLoading = false;
let hasReachedEnd = false;

const feedStreamEl = document.getElementById('feed-stream');
const loadingIndicatorEl = document.getElementById('feed-loading');

export const initFeedPage = async () => {
  // Render Application Shell (Topbar, Left Rail, Right Rail, Bottom Dock, Guest Banner)
  renderAppShell('home');

  // 1. Mount Stories Row
  const storiesMount = document.getElementById('stories-mount');
  if (storiesMount) {
    renderStoriesRow(storiesMount);
  }

  // 2. Mount Facebook-style Create Post Card
  const createPostMount = document.getElementById('create-post-mount');
  if (createPostMount) {
    renderCreatePostCard(createPostMount, (newPost) => {
      // Prepend newly created post
      if (newPost && feedStreamEl) {
        const postCard = renderPostCard(newPost);
        feedStreamEl.prepend(postCard);
      }
    });
  }

  // 3. Mount YouTube-style Topic Filter Chips
  const topicChipsMount = document.getElementById('topic-chips-mount');
  if (topicChipsMount) {
    renderTopicChips(topicChipsMount, currentTopic, (selectedTopic) => {
      currentTopic = selectedTopic;
      refreshFeed();
    });
  }

  // 4. Setup For You / Following Tabs
  setupFeedTabs();

  // 5. Initial Feed Load
  await refreshFeed();

  // 6. Infinite Scroll Observer
  setupInfiniteScroll();
};

/**
 * Setup Feed Tabs (For You vs Following)
 */
const setupFeedTabs = () => {
  const forYouBtn = document.getElementById('tab-for-you');
  const followingBtn = document.getElementById('tab-following');
  if (!forYouBtn || !followingBtn) return;

  const updateTabUI = () => {
    if (activeTab === 'explore') {
      forYouBtn.classList.add('active');
      forYouBtn.style.color = 'var(--text-main)';
      forYouBtn.style.fontWeight = '700';
      forYouBtn.querySelector('.tab-indicator').style.display = 'block';

      followingBtn.classList.remove('active');
      followingBtn.style.color = 'var(--text-muted)';
      followingBtn.style.fontWeight = '600';
      followingBtn.querySelector('.tab-indicator').style.display = 'none';
    } else {
      followingBtn.classList.add('active');
      followingBtn.style.color = 'var(--text-main)';
      followingBtn.style.fontWeight = '700';
      followingBtn.querySelector('.tab-indicator').style.display = 'block';

      forYouBtn.classList.remove('active');
      forYouBtn.style.color = 'var(--text-muted)';
      forYouBtn.style.fontWeight = '600';
      forYouBtn.querySelector('.tab-indicator').style.display = 'none';
    }
  };

  forYouBtn.addEventListener('click', () => {
    if (activeTab === 'explore') return;
    activeTab = 'explore';
    updateTabUI();
    refreshFeed();
  });

  followingBtn.addEventListener('click', () => {
    if (!isAuthenticated()) {
      openGuestModal('view your personalized Following feed');
      return;
    }
    if (activeTab === 'following') return;
    activeTab = 'following';
    updateTabUI();
    refreshFeed();
  });
};

/**
 * Reset & Reload Feed Stream
 */
const refreshFeed = async () => {
  nextCursor = null;
  hasReachedEnd = false;
  if (feedStreamEl) feedStreamEl.innerHTML = '';
  await loadMorePosts();
};

/**
 * Fetch and append more posts
 */
const loadMorePosts = async () => {
  if (isLoading || hasReachedEnd) return;
  isLoading = true;

  if (loadingIndicatorEl) {
    loadingIndicatorEl.style.display = 'block';
    loadingIndicatorEl.textContent = 'Loading conversations...';
  }

  try {
    const endpoint = activeTab === 'following' ? '/posts/feed' : '/posts/explore';
    const params = new URLSearchParams();
    params.set('limit', '10');
    if (nextCursor) params.set('cursor', nextCursor);
    if (currentTopic) params.set('topic', currentTopic);

    const res = await api.get(`${endpoint}?${params.toString()}`);
    const posts = res.posts || res.items || [];
    nextCursor = res.nextCursor || null;

    if (posts.length === 0 && (!feedStreamEl.children.length)) {
      feedStreamEl.innerHTML = `
        <div style="background: var(--bg-surface); border: 1px solid var(--border-hairline); border-radius: var(--rad-lg); padding: 40px 20px; text-align: center; color: var(--text-muted);">
          <div style="margin-bottom: 12px; color: var(--text-muted); display: flex; justify-content: center;">
            <svg class="icon icon-lg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            </svg>
          </div>
          <div style="font-weight: 700; font-size: var(--text-base); color: var(--text-main); margin-bottom: 4px;">No posts found</div>
          <div style="font-size: var(--text-xs);">
            ${currentTopic ? `No conversations tagged with #${currentTopic} yet.` : 'Be the first to share a thought with the community!'}
          </div>
        </div>
      `;
      hasReachedEnd = true;
      if (loadingIndicatorEl) loadingIndicatorEl.style.display = 'none';
      return;
    }

    posts.forEach(post => {
      const card = renderPostCard(post, {
        onPostDeleted: () => {
          // Check if feed is now empty
          if (feedStreamEl.children.length === 0) {
            refreshFeed();
          }
        }
      });
      feedStreamEl.appendChild(card);
    });

    if (!nextCursor || posts.length < 10) {
      hasReachedEnd = true;
      if (loadingIndicatorEl) {
        loadingIndicatorEl.textContent = 'You are all caught up!';
      }
    } else {
      if (loadingIndicatorEl) loadingIndicatorEl.style.display = 'none';
    }

  } catch (err) {
    console.error('Failed to load feed:', err);
    if (loadingIndicatorEl) {
      loadingIndicatorEl.textContent = 'Unable to load feed. Tap to retry.';
      loadingIndicatorEl.onclick = () => loadMorePosts();
    }
  } finally {
    isLoading = false;
  }
};

/**
 * Setup Intersection Observer for Infinite Scrolling
 */
const setupInfiniteScroll = () => {
  if (!loadingIndicatorEl) return;

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading && !hasReachedEnd) {
      loadMorePosts();
    }
  }, { rootMargin: '300px' });

  observer.observe(loadingIndicatorEl);
};

// Auto-run when DOM is ready
document.addEventListener('DOMContentLoaded', initFeedPage);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initFeedPage();
}

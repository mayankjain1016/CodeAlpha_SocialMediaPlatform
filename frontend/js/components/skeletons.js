export const renderPostSkeleton = () => `
  <div class="post-card" style="opacity: 0.7; margin-bottom: var(--space-5);">
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
      <div class="skeleton skeleton-circle" style="width: 46px; height: 46px; flex-shrink: 0;"></div>
      <div style="flex: 1;">
        <div class="skeleton skeleton-text" style="width: 140px; height: 16px; margin-bottom: 6px;"></div>
        <div class="skeleton skeleton-text" style="width: 80px; height: 12px; margin: 0;"></div>
      </div>
    </div>
    <div class="skeleton skeleton-text" style="width: 95%; height: 16px; margin-bottom: 8px;"></div>
    <div class="skeleton skeleton-text" style="width: 75%; height: 16px; margin-bottom: 16px;"></div>
    <div style="display: flex; gap: 12px; padding-top: 10px; border-top: 1px solid var(--hairline);">
      <div class="skeleton" style="width: 58px; height: 26px; border-radius: var(--radius-full);"></div>
      <div class="skeleton" style="width: 58px; height: 26px; border-radius: var(--radius-full);"></div>
      <div class="skeleton" style="width: 36px; height: 26px; border-radius: var(--radius-full);"></div>
    </div>
  </div>
`;

export const renderFeedSkeletons = (count = 3) => {
  return Array(count).fill(0).map(() => renderPostSkeleton()).join('');
};

export const renderCommentSkeleton = () => `
  <div class="comment-item" style="opacity: 0.7;">
    <div class="comment-thread-line"></div>
    <div class="skeleton skeleton-circle" style="width: 44px; height: 44px; flex-shrink: 0; z-index: 2;"></div>
    <div class="comment-bubble" style="flex: 1;">
      <div class="skeleton skeleton-text" style="width: 120px; height: 14px; margin-bottom: 8px;"></div>
      <div class="skeleton skeleton-text" style="width: 85%; height: 14px;"></div>
    </div>
  </div>
`;

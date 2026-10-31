export const renderPostSkeleton = () => `
  <div class="post-card" style="opacity: 0.7;">
    <div class="skeleton skeleton-circle" style="width: 42px; height: 42px; flex-shrink: 0;"></div>
    <div class="post-card-main" style="width: 100%;">
      <div style="display: flex; gap: 10px; margin-bottom: 12px;">
        <div class="skeleton skeleton-text" style="width: 120px; height: 16px;"></div>
        <div class="skeleton skeleton-text" style="width: 70px; height: 16px;"></div>
      </div>
      <div class="skeleton skeleton-text" style="width: 90%; height: 14px; margin-bottom: 8px;"></div>
      <div class="skeleton skeleton-text" style="width: 70%; height: 14px; margin-bottom: 16px;"></div>
      <div style="display: flex; justify-content: space-between; max-width: 320px;">
        <div class="skeleton" style="width: 32px; height: 20px;"></div>
        <div class="skeleton" style="width: 32px; height: 20px;"></div>
        <div class="skeleton" style="width: 32px; height: 20px;"></div>
        <div class="skeleton" style="width: 32px; height: 20px;"></div>
      </div>
    </div>
  </div>
`;

export const renderFeedSkeletons = (count = 3) => {
  return Array(count).fill(0).map(() => renderPostSkeleton()).join('');
};

export const renderCommentSkeleton = () => `
  <div style="display: flex; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--border-subtle); opacity: 0.7;">
    <div class="skeleton skeleton-circle" style="width: 32px; height: 32px; flex-shrink: 0;"></div>
    <div style="flex: 1;">
      <div class="skeleton skeleton-text" style="width: 100px; height: 14px; margin-bottom: 8px;"></div>
      <div class="skeleton skeleton-text" style="width: 80%; height: 13px;"></div>
    </div>
  </div>
`;

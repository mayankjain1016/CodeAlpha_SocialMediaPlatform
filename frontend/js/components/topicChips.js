const DEFAULT_TOPICS = [
  'All',
  'Tech',
  'Cricket',
  'Startups',
  'Travel',
  'Food',
  'Music',
  'Fitness',
  'Photography',
  'Design'
];

/**
 * Render YouTube-style horizontal topic filter chips
 */
export const renderTopicChips = (containerEl, activeTopic = '', onTopicChange) => {
  if (!containerEl) return;

  const currentTopic = activeTopic ? activeTopic.toLowerCase() : 'all';

  const html = `
    <div class="topic-chips-bar" role="tablist" aria-label="Topic Filter">
      ${DEFAULT_TOPICS.map(topic => {
        const key = topic.toLowerCase();
        const isActive = (key === 'all' && (!currentTopic || currentTopic === 'all')) || key === currentTopic;
        return `
          <button 
            type="button" 
            role="tab" 
            aria-selected="${isActive}" 
            class="topic-chip ${isActive ? 'active' : ''}" 
            data-topic="${key === 'all' ? '' : key}">
            ${topic}
          </button>
        `;
      }).join('')}
    </div>
  `;

  containerEl.innerHTML = html;

  const chipBtns = containerEl.querySelectorAll('.topic-chip');
  chipBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      chipBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const selected = btn.dataset.topic;
      if (onTopicChange) onTopicChange(selected);
    });
  });
};

import { icons } from '../core/icons.js';
import { openModal, closeModal } from '../core/modal.js';

let lightboxOverlay = null;

const ensureLightbox = () => {
  if (!lightboxOverlay) {
    lightboxOverlay = document.createElement('div');
    lightboxOverlay.className = 'lightbox-overlay';
    lightboxOverlay.innerHTML = `
      <button class="lightbox-close" aria-label="Close image viewer">${icons.x()}</button>
      <img class="lightbox-img" src="" alt="Enlarged view">
    `;
    document.body.appendChild(lightboxOverlay);

    lightboxOverlay.querySelector('.lightbox-close').onclick = () => {
      closeModal(lightboxOverlay);
    };

    lightboxOverlay.onclick = (e) => {
      if (e.target === lightboxOverlay) {
        closeModal(lightboxOverlay);
      }
    };

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightboxOverlay.classList.contains('active')) {
        closeModal(lightboxOverlay);
      }
    });
  }
  return lightboxOverlay;
};

export const openLightbox = (imageUrl, altText = 'Post image') => {
  const box = ensureLightbox();
  const img = box.querySelector('.lightbox-img');
  img.src = imageUrl;
  img.alt = altText;
  openModal(box);
};

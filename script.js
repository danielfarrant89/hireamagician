/* ═══════════════════════════════════════════════════════════
   Dan Farrant – Close Up Magician
   script.js
═══════════════════════════════════════════════════════════ */

// ─── Footer year ─────────────────────────────────────────
document.getElementById('year').textContent = new Date().getFullYear();

// ─── Duplicate logo strip for seamless loop ─────────────
const scrollStrip = document.querySelector('.clients__scroll');
if (scrollStrip) {
  const logos = [...scrollStrip.children];
  logos.forEach(logo => scrollStrip.appendChild(logo.cloneNode(true)));
}

// ─── Scroll reveal ───────────────────────────────────────
const revealEls = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger siblings within the same parent
        const siblings = [...entry.target.parentElement.querySelectorAll('.reveal:not(.is-visible)')];
        const idx = siblings.indexOf(entry.target);
        const delay = Math.min(idx * 80, 320);
        setTimeout(() => entry.target.classList.add('is-visible'), delay);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

revealEls.forEach(el => observer.observe(el));

// ─── Video lightbox ──────────────────────────────────────
const lightbox       = document.getElementById('lightbox');
const lightboxIframe = document.getElementById('lightbox-iframe');
const lightboxClose  = document.getElementById('lightbox-close');

document.querySelectorAll('.video-card__thumb').forEach(thumb => {
  thumb.addEventListener('click', () => {
    const id = thumb.dataset.vimeo;
    lightboxIframe.src = `https://player.vimeo.com/video/${id}?autoplay=1&color=c3332b&title=0&byline=0&portrait=0`;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  });
});

function closeLightbox() {
  lightbox.hidden = true;
  lightboxIframe.src = '';
  document.body.style.overflow = '';
}

lightboxClose.addEventListener('click', closeLightbox);

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
});

// ─── Gallery lightbox ───────────────────────────────────
const galleryLB      = document.getElementById('gallery-lightbox');
const galleryLBImg   = document.getElementById('gallery-lightbox-img');
const galleryLBClose = document.getElementById('gallery-lightbox-close');
const galleryLBPrev  = document.getElementById('gallery-lightbox-prev');
const galleryLBNext  = document.getElementById('gallery-lightbox-next');
const galleryItems   = [...document.querySelectorAll('.gallery__item img')];
let galleryIndex = 0;

function openGallery(idx) {
  galleryIndex = idx;
  galleryLBImg.src = galleryItems[idx].src;
  galleryLBImg.alt = galleryItems[idx].alt;
  galleryLB.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeGallery() {
  galleryLB.hidden = true;
  galleryLBImg.src = '';
  document.body.style.overflow = '';
}

function galleryNav(dir) {
  galleryIndex = (galleryIndex + dir + galleryItems.length) % galleryItems.length;
  galleryLBImg.src = galleryItems[galleryIndex].src;
  galleryLBImg.alt = galleryItems[galleryIndex].alt;
}

galleryItems.forEach((img, i) => {
  img.parentElement.addEventListener('click', () => openGallery(i));
});

galleryLBClose.addEventListener('click', closeGallery);
galleryLBPrev.addEventListener('click', (e) => { e.stopPropagation(); galleryNav(-1); });
galleryLBNext.addEventListener('click', (e) => { e.stopPropagation(); galleryNav(1); });
galleryLB.addEventListener('click', (e) => { if (e.target === galleryLB) closeGallery(); });

document.addEventListener('keydown', (e) => {
  if (galleryLB.hidden) return;
  if (e.key === 'Escape') closeGallery();
  if (e.key === 'ArrowLeft') galleryNav(-1);
  if (e.key === 'ArrowRight') galleryNav(1);
});

// ─── Reviews show more ──────────────────────────────────
const reviewsMoreBtn = document.getElementById('reviews-more');
if (reviewsMoreBtn) {
  reviewsMoreBtn.addEventListener('click', () => {
    document.querySelector('.review-grid').classList.add('is-expanded');
    reviewsMoreBtn.parentElement.classList.add('is-hidden');
  });
}

// ─── Contact form feedback ───────────────────────────────
const form = document.querySelector('.contact-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Sending…';
    btn.disabled = true;

    try {
      const data = Object.fromEntries(new FormData(form));
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        form.innerHTML = `
          <div style="text-align:center; padding: 3rem 0; color: rgba(255,255,255,0.8);">
            <p style="font-family: var(--ff-display); font-size: 1.8rem; font-style: italic; margin-bottom: 1rem;">Thank you!</p>
            <p style="font-size: 0.9rem; color: rgba(255,255,255,0.5); letter-spacing: 0.04em;">I'll be in touch within 24 hours.</p>
          </div>`;
      } else {
        throw new Error('Form submission failed');
      }
    } catch {
      btn.textContent = original;
      btn.disabled = false;
      alert('Sorry, something went wrong. Please try again or email me directly.');
    }
  });
}

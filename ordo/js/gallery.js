(function () {
  const { $, $$, escapeHTML, showToast, loadJSON, imgFallback } = window.Ordo;

  let state = {
    images: [],
    categories: [],
    filtered: [],
    current: 0,
    category: 'all'
  };

  function renderCategories() {
    const tabs = $('#galleryTabs');
    if (!tabs) return;
    tabs.innerHTML = state.categories.map(c => `
      <button class="tab ${c.id === state.category ? 'active' : ''}"
              data-cat="${escapeHTML(c.id)}">
        ${escapeHTML(c.name)}
      </button>
    `).join('');

    $$('.tab', tabs).forEach(btn => {
      btn.addEventListener('click', () => {
        state.category = btn.dataset.cat;
        renderCategories();
        renderGrid();
      });
    });
  }

  function renderGrid() {
    const grid = $('#galleryGrid');
    if (!grid) return;

    state.filtered = state.category === 'all'
      ? state.images
      : state.images.filter(i => i.category === state.category);

    grid.innerHTML = state.filtered.map((img, idx) => `
      <div class="gallery-item reveal" data-idx="${idx}" role="button" tabindex="0"
           aria-label="Открыть фото: ${escapeHTML(img.alt)}">
        <img src="${escapeHTML(img.src)}" alt="${escapeHTML(img.alt)}" loading="lazy"
             onerror="window.Ordo.imgFallback(this)">
        <div class="gallery-caption">${escapeHTML(img.alt)}</div>
      </div>
    `).join('');

    $$('.gallery-item', grid).forEach(item => {
      item.addEventListener('click', () => openLightbox(Number(item.dataset.idx)));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(Number(item.dataset.idx));
        }
      });
    });
    document.dispatchEvent(new Event('ordo:reveal'));
  }

  function openLightbox(idx) {
    state.current = idx;
    const lb = $('#lightbox');
    if (!lb) return;
    state.returnFocus = document.activeElement;
    updateLightbox();
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const closeBtn = $('.lightbox-close', lb);
    if (closeBtn) closeBtn.focus();
  }

  function updateLightbox() {
    const img = state.filtered[state.current];
    if (!img) return;
    const el = $('#lightboxImage');
    const cap = $('#lightboxCaption');
    if (el) {
      el.src = img.src;
      el.alt = img.alt;
      el.onerror = () => imgFallback(el);
    }
    if (cap) cap.textContent = img.alt;
  }

  function closeLightbox() {
    const lb = $('#lightbox');
    if (!lb) return;
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (state.returnFocus && typeof state.returnFocus.focus === 'function') state.returnFocus.focus();
  }

  function next() {
    if (!state.filtered.length) return;
    state.current = (state.current + 1) % state.filtered.length;
    updateLightbox();
  }

  function prev() {
    if (!state.filtered.length) return;
    state.current = (state.current - 1 + state.filtered.length) % state.filtered.length;
    updateLightbox();
  }

  function initControls() {
    const lb = $('#lightbox');
    if (!lb) return;
    $('.lightbox-close', lb)?.addEventListener('click', closeLightbox);
    $('.lightbox-next', lb)?.addEventListener('click', next);
    $('.lightbox-prev', lb)?.addEventListener('click', prev);

    lb.addEventListener('click', (e) => {
      if (e.target === lb) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });

    // Свайпы
    let startX = 0;
    lb.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) {
        if (dx > 0) prev(); else next();
      }
    });
  }

  async function init() {
    const data = await loadJSON('data/gallery.json');
    if (!data) {
      const grid = $('#galleryGrid');
      if (grid) grid.innerHTML = '<p class="empty-state">Не удалось загрузить галерею. Запустите сайт через Live Server и попробуйте ещё раз.</p>';
      showToast('Не удалось загрузить галерею'); return;
    }
    state.images = data.images || [];
    state.categories = data.categories || [{ id: 'all', name: 'Все' }];
    renderCategories();
    renderGrid();
    initControls();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

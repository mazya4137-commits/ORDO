(function () {
  const { $, $$, escapeHTML, showToast, loadJSON, imgFallback } = window.Ordo;
  const FAV_KEY = 'ordo_favorites';

  function readFavorites() {
    try {
      const saved = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch { return []; }
  }

  let state = {
    items: [],
    categories: [],
    activeCategory: 'all',
    search: '',
    sort: 'default',
    favorites: new Set(readFavorites())
  };

  function saveFavorites() {
    try { localStorage.setItem(FAV_KEY, JSON.stringify([...state.favorites])); }
    catch { showToast('Не удалось сохранить избранное в этом браузере'); }
  }

  function renderCategories() {
    const tabs = $('#menuTabs');
    if (!tabs) return;
    tabs.innerHTML = state.categories.map(c => `
      <button class="tab ${c.id === state.activeCategory ? 'active' : ''}"
              data-cat="${escapeHTML(c.id)}"
              role="tab"
              aria-selected="${c.id === state.activeCategory}">
        ${escapeHTML(c.name)}
      </button>
    `).join('');

    $$('.tab', tabs).forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeCategory = btn.dataset.cat;
        renderCategories();
        renderItems();
      });
    });
  }

  function getFiltered() {
    let list = [...state.items];

    if (state.activeCategory !== 'all') {
      list = list.filter(i => i.category === state.activeCategory);
    }

    const q = state.search.trim().toLowerCase();
    if (q) {
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.description || '').toLowerCase().includes(q) ||
        (i.composition || '').toLowerCase().includes(q)
      );
    }

    if (state.sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (state.sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (state.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

    return list;
  }

  function renderItems() {
    const grid = $('#menuGrid');
    const count = $('#resultsCount');
    const empty = $('#emptyState');
    if (!grid) return;

    const list = getFiltered();

    if (count) count.textContent = `Найдено блюд: ${list.length}`;

    if (!list.length) {
      grid.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    grid.innerHTML = list.map(item => {
      const isFav = state.favorites.has(item.id);
      return `
        <article class="dish-card reveal" data-id="${Number(item.id)}">
          <div class="dish-image">
            <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}"
                 loading="lazy" onerror="window.Ordo.imgFallback(this)">
            ${item.featured ? '<span class="dish-badge">Фирменное</span>' : ''}
            <button class="fav-btn ${isFav ? 'active' : ''}"
                    data-fav="${Number(item.id)}"
                    aria-label="${isFav ? 'Убрать из избранного' : 'Добавить в избранное'}"
                    title="Избранное">♥</button>
          </div>
          <div class="dish-body">
            <h3>${escapeHTML(item.name)}</h3>
            <p class="dish-desc">${escapeHTML(item.description)}</p>
            <div class="dish-meta">
              <span>${escapeHTML(item.weight || '')}</span>
            </div>
            <div class="dish-meta">
              <span class="dish-price">${escapeHTML(item.price)} сом</span>
            </div>
            <button class="dish-details-btn" data-details="${Number(item.id)}">Подробнее</button>
          </div>
        </article>
      `;
    }).join('');

    // Избранное
    $$('[data-fav]', grid).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.fav);
        if (state.favorites.has(id)) {
          state.favorites.delete(id);
          btn.classList.remove('active');
          showToast('Удалено из избранного');
        } else {
          state.favorites.add(id);
          btn.classList.add('active');
          showToast('Добавлено в избранное');
        }
        saveFavorites();
      });
    });

    // Подробнее
    $$('[data-details]', grid).forEach(btn => {
      btn.addEventListener('click', () => {
        const item = state.items.find(i => i.id === Number(btn.dataset.details));
        if (item) openDishModal(item);
      });
    });

    document.dispatchEvent(new Event('ordo:reveal'));
  }

  function openDishModal(item) {
    const modal = $('#dishModal');
    const body = $('#dishModalBody');
    if (!modal || !body) return;

    body.innerHTML = `
      <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}"
           style="width:100%;border-radius:16px;margin-bottom:20px;aspect-ratio:4/3;object-fit:cover"
           onerror="window.Ordo.imgFallback(this)">
      <h2 style="margin-bottom:12px">${escapeHTML(item.name)}</h2>
      <p style="color:var(--text-light);margin-bottom:16px">${escapeHTML(item.description)}</p>
      <div class="form-group"><strong>Состав:</strong> ${escapeHTML(item.composition || '—')}</div>
      <div class="form-group"><strong>Вес/объём:</strong> ${escapeHTML(item.weight || '—')}</div>
      <div class="form-group"><strong>Цена:</strong> <span class="dish-price">${escapeHTML(item.price)} сом</span></div>
    `;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const closeBtn = $('.modal-close', modal);
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    const modal = $('#dishModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function initControls() {
    const search = $('#menuSearch');
    if (search) {
      search.addEventListener('input', (e) => {
        state.search = e.target.value;
        renderItems();
      });
    }

    const sort = $('#menuSort');
    if (sort) {
      sort.addEventListener('change', (e) => {
        state.sort = e.target.value;
        renderItems();
      });
    }

    const reset = $('#menuReset');
    if (reset) {
      reset.addEventListener('click', () => {
        state.activeCategory = 'all';
        state.search = '';
        state.sort = 'default';
        if (search) search.value = '';
        if (sort) sort.value = 'default';
        renderCategories();
        renderItems();
        showToast('Фильтры сброшены');
      });
    }

    // Модальное окно
    const modal = $('#dishModal');
    if (modal) {
      const closeBtn = $('.modal-close', modal);
      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
      });
    }
  }

  async function init() {
    const data = await loadJSON('data/menu.json');
    if (!data) {
      const empty = $('#emptyState');
      if (empty) { empty.textContent = 'Не удалось загрузить меню. Запустите сайт через Live Server и попробуйте ещё раз.'; empty.classList.remove('hidden'); }
      showToast('Не удалось загрузить меню');
      return;
    }
    state.items = data.items || [];
    state.categories = data.categories || [{ id: 'all', name: 'Все блюда' }];
    renderCategories();
    renderItems();
    initControls();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

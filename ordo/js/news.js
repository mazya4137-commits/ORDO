(function () {
  const { $, $$, escapeHTML, showToast, loadJSON, imgFallback } = window.Ordo;

  function formatDate(s) {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d)) return s;
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function renderNews(list, container) {
    if (!container) return;
    if (!list.length) {
      container.innerHTML = '<div class="empty-state">Пока новостей нет</div>';
      return;
    }
    container.innerHTML = list.map(n => `
      <article class="event-card reveal" data-id="${Number(n.id)}">
        <img src="${escapeHTML(n.image)}" alt="${escapeHTML(n.title)}" loading="lazy"
             onerror="window.Ordo.imgFallback(this)">
        <div class="event-body">
          <div class="event-date">${escapeHTML(formatDate(n.date))}
            ${n.demo ? '<span class="demo-badge">демо</span>' : ''}
          </div>
          <h3 style="margin-bottom:8px">${escapeHTML(n.title)}</h3>
          <p style="color:var(--text-light);margin-bottom:14px">${escapeHTML(n.excerpt)}</p>
          <button class="btn btn-outline" data-open="${Number(n.id)}">Читать полностью</button>
        </div>
      </article>
    `).join('');

    $$('[data-open]', container).forEach(btn => {
      btn.addEventListener('click', () => {
        const item = list.find(i => i.id === Number(btn.dataset.open));
        if (item) openNewsModal(item);
      });
    });
    document.dispatchEvent(new Event('ordo:reveal'));
  }

  function openNewsModal(item) {
    const modal = $('#newsModal');
    const body = $('#newsModalBody');
    if (!modal || !body) return;

    body.innerHTML = `
      <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}"
           style="width:100%;border-radius:16px;margin-bottom:20px;aspect-ratio:16/9;object-fit:cover"
           onerror="window.Ordo.imgFallback(this)">
      <div class="event-date">${escapeHTML(formatDate(item.date))}${item.demo ? ' <span class="demo-badge">демо</span>' : ''}</div>
      <h2 id="newsModalTitle" style="margin:12px 0">${escapeHTML(item.title)}</h2>
      <p style="color:var(--text-light);margin-bottom:16px">${escapeHTML(item.excerpt)}</p>
      <div style="line-height:1.7">${escapeHTML(item.content)}</div>
    `;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('.modal-close', modal)?.focus();
  }

  function closeNewsModal() {
    const modal = $('#newsModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function initModal() {
    const modal = $('#newsModal');
    if (!modal) return;
    $('.modal-close', modal)?.addEventListener('click', closeNewsModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeNewsModal(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeNewsModal();
    });
  }

  async function init() {
    const data = await loadJSON('data/news.json');
    if (!data) {
      const grid = $('#newsGrid');
      if (grid) grid.innerHTML = '<p class="empty-state">Не удалось загрузить новости. Запустите сайт через Live Server и попробуйте ещё раз.</p>';
      showToast('Не удалось загрузить новости'); return;
    }
    const list = data.news || [];

    // Страница новостей — все
    renderNews(list, $('#newsGrid'));
    // Главная — последние 3
    renderNews(list.slice(0, 3), $('#homeNewsGrid'));

    initModal();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

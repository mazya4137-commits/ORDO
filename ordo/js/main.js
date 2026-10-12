/* ===== Утилиты ===== */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* Безопасный вывод текста */
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* Toast-уведомление */
function showToast(message, duration = 3000) {
  let toast = $('#toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

/* Загрузка JSON с обработкой ошибок */
async function loadJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Ошибка загрузки', path, err);
    return null;
  }
}

/* Заглушка изображения */
const FALLBACK_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
  '<rect width="400" height="300" fill="#e8e0d3"/>' +
  '<text x="200" y="150" text-anchor="middle" fill="#B99557" font-size="20" font-family="serif">Ордо</text>' +
  '</svg>'
);

function imgFallback(img) {
  img.onerror = null;
  img.src = FALLBACK_IMG;
}

/* ===== Мобильная навигация ===== */
function initNav() {
  const burger = $('#burger');
  const nav = $('#mainNav');
  const overlay = $('#navOverlay');
  if (!burger || !nav) return;

  const close = () => {
    burger.classList.remove('active');
    nav.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  const open = () => {
    burger.classList.add('active');
    nav.classList.add('open');
    if (overlay) overlay.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  burger.addEventListener('click', () => {
    if (nav.classList.contains('open')) close();
    else open();
  });

  if (overlay) overlay.addEventListener('click', close);

  $$('a', nav).forEach(a => a.addEventListener('click', close));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('open')) close();
  });
}

/* ===== Активная ссылка ===== */
function setActiveNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  $$('.main-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path) a.classList.add('active');
  });
}

/* ===== Reveal on scroll ===== */
let revealObserver = null;

function observeReveals(items) {
  const pending = items.filter(item => !item.classList.contains('visible'));
  if (!pending.length) return;
  if (!('IntersectionObserver' in window)) {
    pending.forEach(i => i.classList.add('visible'));
    return;
  }
  if (!revealObserver) revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  pending.forEach(i => revealObserver.observe(i));
}

function initReveal() {
  observeReveals($$('.reveal'));
  document.addEventListener('ordo:reveal', () => observeReveals($$('.reveal')));
}

/* ===== Настройки ресторана в футере/шапке ===== */
async function applySettings() {
  const settings = await loadJSON('data/settings.json');
  if (!settings) return;
  window.ORDO_SETTINGS = settings;

  // Телефон / WhatsApp / Instagram в контактах
  $$('[data-setting]').forEach(el => {
    const key = el.dataset.setting;
    const val = settings[key];
    if (val) {
      el.textContent = val;
      if (el.tagName === 'A') el.href = el.dataset.hrefPrefix ? el.dataset.hrefPrefix + val : val;
    }
  });
}

/* ===== Год в футере ===== */
function setYear() {
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
}

/* ===== Инициализация ===== */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  setActiveNav();
  initReveal();
  applySettings();
  setYear();
});

/* Глобальный экспорт */
window.Ordo = { $, $$, escapeHTML, showToast, loadJSON, imgFallback, FALLBACK_IMG };

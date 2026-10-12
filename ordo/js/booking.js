(function () {
  const { $, $$, escapeHTML, showToast, loadJSON } = window.Ordo;

  let settings = null;

  function todayStr() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function setMinDate() {
    const dateInput = $('#bookingDate');
    if (dateInput) dateInput.min = todayStr();
  }

  function validatePhone(v) {
    return /^[+\d][\d\s\-()]{7,}$/.test(v.trim());
  }

  function clearErrors(form) {
    $$('.form-group', form).forEach(g => g.classList.remove('invalid'));
  }

  function showError(field, msg) {
    const group = field.closest('.form-group');
    if (group) {
      group.classList.add('invalid');
      const err = $('.error', group);
      if (err) err.textContent = msg;
    }
  }

  function validateForm(form) {
    clearErrors(form);
    let ok = true;

    const name = $('#bookingName');
    const phone = $('#bookingPhone');
    const date = $('#bookingDate');
    const time = $('#bookingTime');
    const guests = $('#bookingGuests');

    if (!name.value.trim()) { showError(name, 'Укажите имя'); ok = false; }

    if (!phone.value.trim()) {
      showError(phone, 'Укажите телефон'); ok = false;
    } else if (!validatePhone(phone.value)) {
      showError(phone, 'Некорректный номер телефона'); ok = false;
    }

    if (!date.value) {
      showError(date, 'Выберите дату'); ok = false;
    } else {
      const today = new Date(); today.setHours(0,0,0,0);
      const chosen = new Date(date.value + 'T00:00:00');
      if (chosen < today) {
        showError(date, 'Дата уже прошла'); ok = false;
      }
    }

    if (!time.value) {
      showError(time, 'Выберите время'); ok = false;
    } else if (settings && settings.workingHours) {
      const t = time.value;
      if (t < settings.workingHours.open || t > settings.workingHours.close) {
        showError(time, `Работаем с ${settings.workingHours.open} до ${settings.workingHours.close}`);
        ok = false;
      }
    }

    const g = Number(guests.value);
    if (!guests.value || g < 1 || g > 500) {
      showError(guests, 'Укажите количество гостей от 1 до 500');
      ok = false;
    }

    return ok;
  }

  function buildMessage() {
    const name = $('#bookingName').value.trim();
    const phone = $('#bookingPhone').value.trim();
    const date = $('#bookingDate').value;
    const time = $('#bookingTime').value;
    const guests = $('#bookingGuests').value;
    const comment = $('#bookingComment').value.trim();
    const eventType = $('#eventType')?.value;
    const details = [eventType ? `Тип события: ${eventType}` : '', comment].filter(Boolean).join('\n');

    return `Здравствуйте! Хочу забронировать столик в ресторане "Ордо".\n\n` +
      `Имя: ${name}\n` +
      `Телефон: ${phone}\n` +
      `Дата: ${date}\n` +
      `Время: ${time}\n` +
      `Гостей: ${guests}\n` +
      (details ? `Пожелания: ${details}\n` : '') +
      `\nПожалуйста, подтвердите бронирование.`;
  }

  function getWhatsAppLink(message) {
    if (!settings || !settings.whatsapp) return null;
    const num = settings.whatsapp.replace(/\D/g, '');
    return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
  }

  function setStatus(text) {
    const el = $('#bookingStatus');
    if (el) el.textContent = text;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    if (!validateForm(form)) {
      showToast('Проверьте поля формы');
      return;
    }

    const msg = buildMessage();
    const link = getWhatsAppLink(msg);

    if (link) {
      window.open(link, '_blank');
      setStatus('Отправьте сообщение в WhatsApp. Бронирование действует после подтверждения рестораном.');
      showToast('Открываем WhatsApp…');
    } else {
      setStatus('Номер WhatsApp пока не указан в настройках. Скопируйте заявку и отправьте её вручную.');
      showToast('Номер WhatsApp не настроен');
    }

    // Всегда показываем текст для копирования
    const preview = $('#bookingPreview');
    if (preview) {
      preview.textContent = msg;
      preview.parentElement.classList.remove('hidden');
    }
  }

  async function copyMessage() {
    const preview = $('#bookingPreview');
    if (!preview || !preview.textContent) return;
    try {
      await navigator.clipboard.writeText(preview.textContent);
      showToast('Заявка скопирована');
    } catch {
      showToast('Не удалось скопировать');
    }
  }

  async function init() {
    settings = await loadJSON('data/settings.json');
    setMinDate();

    const form = $('#bookingForm');
    if (form) form.addEventListener('submit', handleSubmit);

    const copyBtn = $('#copyBooking');
    if (copyBtn) copyBtn.addEventListener('click', copyMessage);

    // Показать часы работы
    const hours = $('#workHours');
    if (hours && settings && settings.workingHours) {
      hours.textContent = `${settings.workingHours.days}: ${settings.workingHours.open}–${settings.workingHours.close}`;
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();

'use strict';

import '../styles.css';
import siteData from '../cms/site.json';
import roomsData from '../cms/rooms.json';
import plansData from '../cms/plans.json';
import i18nData from '../cms/i18n.json';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const LANG_KEY = 'hoshinoan-lang';
const HTML_LANG = { ja: 'ja', en: 'en', zh: 'zh' };

let currentLang = localStorage.getItem(LANG_KEY) || 'ja';

function t(key) {
  return i18nData[currentLang]?.[key] ?? i18nData.ja[key] ?? key;
}

function pick(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[currentLang] ?? obj.ja ?? '';
}

function applyI18n() {
  $$('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    const val = t(key);
    if (val.includes('<br')) el.innerHTML = val;
    else el.textContent = val;
  });

  $$('[data-i18n-attr]').forEach((el) => {
    const [attr, key] = el.dataset.i18nAttr.split(':');
    el.setAttribute(attr, t(key));
  });

  document.documentElement.lang = HTML_LANG[currentLang];
  document.title = t('reserve.page.meta');

  const siteName = pick(siteData.name);
  $$('#site-name-ja, .brand-ja:not(.footer-logo-ja)').forEach((el) => {
    el.textContent = siteName;
  });
  $('.footer-logo-ja') && ($('.footer-logo-ja').textContent = siteName);

  const tel = siteData.telephone;
  const telRaw = siteData.telephoneRaw;
  $$('#header-tel, #drawer-tel, #sidebar-tel, .phone-number').forEach((el) => {
    el.textContent = tel;
    if (el.tagName === 'A') el.href = `tel:${telRaw}`;
  });

  const addr = siteData.address;
  const addressStr = `〒${addr.postalCode} ${pick(addr.region)}${pick(addr.locality)}${pick(addr.street)}`;
  $('#footer-address') &&
    ($('#footer-address').innerHTML = `${addressStr}<br />Tel: <a href="tel:${telRaw}">${tel}</a>`);

  const mailLink = $('#footer-contact-mail');
  if (mailLink) mailLink.href = `mailto:${siteData.email}`;

  fillFormSelects(roomsData, plansData);
  updateCheckoutDate();
  updateSummary();
}

function fillSelect(sel, opts) {
  const el = $(sel);
  if (!el) return;
  const current = el.value;
  el.innerHTML =
    `<option value="">${t('form.select')}</option>` +
    opts.map((o) => `<option value="${o.value}">${o.label}</option>`).join('');
  if (current && [...el.options].some((opt) => opt.value === current)) {
    el.value = current;
  }
}

function fillFormSelects(rooms, plans) {
  fillSelect('#b-plan', [
    ...plans.map((p) => ({ value: p.id, label: pick(p.name) })),
    { value: 'other', label: t('form.other') },
  ]);
  fillSelect('#b-room', [
    ...rooms.map((r) => ({ value: r.id, label: pick(r.name) })),
    { value: 'omakase', label: t('form.omakase') },
  ]);
}

function formatDisplayDate(isoDate) {
  if (!isoDate) return '—';
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(currentLang === 'ja' ? 'ja-JP' : currentLang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function updateCheckoutDate() {
  const checkin = $('#b-checkin')?.value;
  const nights = Number($('#b-nights')?.value || 0);
  const checkoutEl = $('#b-checkout');
  if (!checkoutEl) return;

  if (checkin && nights > 0) {
    checkoutEl.value = addDays(checkin, nights);
  } else {
    checkoutEl.value = '';
  }
  updateSummary();
}

function getSelectedLabel(selectEl) {
  if (!selectEl?.value) return '—';
  const opt = selectEl.selectedOptions[0];
  return opt?.textContent?.trim() || '—';
}

function updateSummary() {
  const checkin = $('#b-checkin')?.value;
  const checkout = $('#b-checkout')?.value;
  const adults = $('#b-adults')?.value;
  const children = $('#b-children')?.value || '0';

  $('#summary-checkin') && ($('#summary-checkin').textContent = formatDisplayDate(checkin));
  $('#summary-checkout') && ($('#summary-checkout').textContent = formatDisplayDate(checkout));

  if (adults) {
    const guestParts = [`${t(`form.adults.${adults}`)}`];
    if (children !== '0') guestParts.push(`${t(`form.children.${children}`)}`);
    $('#summary-guests') && ($('#summary-guests').textContent = guestParts.join(' / '));
  } else {
    $('#summary-guests') && ($('#summary-guests').textContent = '—');
  }

  $('#summary-plan') && ($('#summary-plan').textContent = getSelectedLabel($('#b-plan')));
  $('#summary-room') && ($('#summary-room').textContent = getSelectedLabel($('#b-room')));
}

function applyUrlPrefill() {
  const params = new URLSearchParams(window.location.search);
  const checkin = params.get('checkin');
  const nights = params.get('nights');
  const adults = params.get('adults') || params.get('guests');
  const plan = params.get('plan');
  const room = params.get('room');

  if (checkin && $('#b-checkin')) $('#b-checkin').value = checkin;
  if (nights && $('#b-nights')) $('#b-nights').value = nights;
  if (adults && $('#b-adults')) $('#b-adults').value = adults;
  if (plan && $('#b-plan')) $('#b-plan').value = plan;
  if (room && $('#b-room')) $('#b-room').value = room;

  updateCheckoutDate();
}

function setMinCheckinDate() {
  const checkinEl = $('#b-checkin');
  if (!checkinEl) return;
  checkinEl.min = new Date().toISOString().slice(0, 10);
}

function setLang(lang) {
  if (!i18nData[lang]) return;
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  $$('.lang-switch__btn').forEach((btn) => {
    const active = btn.dataset.lang === lang;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
  applyI18n();
}

function setFormStatus(message, type = '') {
  const el = $('#form-status');
  if (!el) return;
  el.textContent = message;
  el.hidden = !message;
  el.className = `form-status${type ? ` is-${type}` : ''}`;
}

document.addEventListener('DOMContentLoaded', () => {
  setMinCheckinDate();
  setLang(currentLang);
  applyUrlPrefill();

  const toggle = $('.nav-toggle');
  const drawer = $('.nav-drawer');
  const drawerBg = $('.drawer-bg');
  if (toggle && drawer && drawerBg) {
    const closeNav = () => {
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
    };
    const openNav = () => {
      document.body.classList.add('nav-open');
      toggle.setAttribute('aria-expanded', 'true');
      drawer.setAttribute('aria-hidden', 'false');
    };
    toggle.addEventListener('click', () =>
      document.body.classList.contains('nav-open') ? closeNav() : openNav(),
    );
    drawerBg.addEventListener('click', closeNav);
    $$('.drawer-panel a').forEach((a) => a.addEventListener('click', closeNav));
  }

  $$('.lang-switch__btn').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });

  ['#b-checkin', '#b-nights', '#b-adults', '#b-children', '#b-plan', '#b-room'].forEach((sel) => {
    $(sel)?.addEventListener('change', () => {
      if (sel === '#b-checkin' || sel === '#b-nights') updateCheckoutDate();
      else updateSummary();
    });
  });

  const form = $('#booking-form');
  const submitBtn = form?.querySelector('[type="submit"]');
  const defaultSubmitLabel = submitBtn?.textContent?.trim() || t('form.submit');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setFormStatus('');
    submitBtn.textContent = t('form.sending');
    submitBtn.disabled = true;

    setTimeout(() => {
      submitBtn.textContent = t('form.sent');
      submitBtn.style.background = 'var(--moss-mid)';
      setFormStatus(t('reserve.page.success'), 'success');

      setTimeout(() => {
        submitBtn.textContent = defaultSubmitLabel;
        submitBtn.style.background = '';
        submitBtn.disabled = false;
        form.reset();
        $('#b-children').value = '0';
        setMinCheckinDate();
        updateCheckoutDate();
        setFormStatus('');
      }, 4000);
    }, 1200);
  });
});

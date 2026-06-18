'use strict';

import siteData from './cms/site.json';
import newsData from './cms/news.json';
import roomsData from './cms/rooms.json';
import plansData from './cms/plans.json';
import sightseeingData from './cms/sightseeing.json';
import i18nData from './cms/i18n.json';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const LANG_KEY = 'kominka-lang';
const OG_LOCALE = { ja: 'ja_JP', en: 'en_US', zh: 'zh_CN' };
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

function pickList(obj) {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  return obj[currentLang] ?? obj.ja ?? [];
}

function applyI18n() {
  $$('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = t(key);
    if (val.includes('<br')) el.innerHTML = val;
    else el.textContent = val;
  });

  $$('[data-i18n-attr]').forEach(el => {
    const [attr, key] = el.dataset.i18nAttr.split(':');
    el.setAttribute(attr, t(key));
  });

  document.documentElement.lang = HTML_LANG[currentLang];
  $('#og-locale')?.setAttribute('content', OG_LOCALE[currentLang]);

  const siteName = pick(siteData.name);
  $('#site-name-ja') && ($('#site-name-ja').textContent = siteName);
  $('#drawer-site-name') && ($('#drawer-site-name').textContent = siteName);
  $('#footer-site-name') && ($('#footer-site-name').textContent = siteName);
  $('#og-site-name')?.setAttribute('content', siteName);

  const addr = siteData.address;
  const addressStr = `〒${addr.postalCode} ${pick(addr.region)}${pick(addr.locality)}${pick(addr.street)}`;
  $('#access-address') && ($('#access-address').textContent = addressStr);
  $('#footer-address') && ($('#footer-address').textContent = addressStr);

  const hours = pick(siteData.hours);
  $('#access-hours') && ($('#access-hours').textContent = `（${hours.replace(/^受付 |^Reception |^接待 /, '')}）`);

  updateSchema();
  renderNews(newsData);
  renderRooms(roomsData);
  renderPlans(plansData);
  renderSightseeing(sightseeingData);
}

function updateSchema() {
  const schemaEl = $('#schema-hotel');
  if (!schemaEl) return;
  const schema = JSON.parse(schemaEl.textContent);
  schema.name = pick(siteData.name);
  schema.alternateName = siteData.nameEn;
  schema.description = t('schema.description');
  schema.address.streetAddress = pick(siteData.address.street);
  schema.address.addressLocality = pick(siteData.address.locality);
  schema.address.addressRegion = pick(siteData.address.region);
  schemaEl.textContent = JSON.stringify(schema, null, 2);
}

function renderNews(items) {
  const el = $('#cms-news');
  if (!el || !items?.length) return;
  const html = items.map(n =>
    `<li><time datetime="${n.date}">${pick(n.dateDisplay)}</time><a href="${n.url}">${pick(n.title)}</a></li>`
  ).join('');
  el.innerHTML = `<ul class="news__list">${html}</ul><ul class="news__list" aria-hidden="true">${html}</ul>`;
}

function renderRooms(rooms) {
  const el = $('#cms-rooms');
  if (!el || !rooms?.length) return;
  el.innerHTML = rooms.map(r => {
    const badgeCls = { entire: 'badge--entire', popular: 'badge--pop', machiya: 'badge--machiya' }[r.badgeType] || '';
    const amenities = pickList(r.amenities);
    return `
      <article class="room-card fade-in">
        <div class="room-card__img">
          <img src="${r.image}" alt="${pick(r.name)}" width="600" height="400" loading="lazy" />
          <span class="badge ${badgeCls}">${pick(r.badge)}</span>
        </div>
        <div class="room-card__body">
          <span class="room-card__type">${r.typeEn}</span>
          <h3 class="room-card__name">${pick(r.name)}</h3>
          <p>${pick(r.description)}</p>
          <ul class="room-card__tags">${amenities.map(a => `<li>${a}</li>`).join('')}</ul>
          <p class="room-card__price"><small>${pick(r.priceLabel)}</small> <strong>${r.price}</strong></p>
          <a href="#reserve" class="btn btn--secondary">${t('room.btn')}</a>
        </div>
      </article>`;
  }).join('');
  fillSelect('#room', rooms.map(r => ({ value: pick(r.name), label: pick(r.name) })));
}

function renderPlans(plans) {
  const el = $('#cms-plans');
  if (!el || !plans?.length) return;
  el.innerHTML = plans.map(p => {
    const includes = pickList(p.includes);
    return `
    <article class="plan-card${p.featured ? ' plan-card--featured' : ''} fade-in">
      ${p.badge ? `<span class="plan-card__badge">${pick(p.badge)}</span>` : ''}
      <div class="plan-card__img"><img src="${p.image}" alt="${pick(p.name)}" width="500" height="320" loading="lazy" /></div>
      <div class="plan-card__body">
        <span class="plan-card__tag">${pick(p.tag)}</span>
        <h3>${pick(p.name)}</h3>
        <p>${pick(p.description)}</p>
        <ul>${includes.map(i => `<li>${i}</li>`).join('')}</ul>
        <p class="plan-card__price"><small>${pick(p.priceLabel)}</small> <strong>${p.price}</strong></p>
        <a href="#reserve" class="btn ${p.featured ? 'btn--accent' : 'btn--secondary'}">${t('plan.btn')}</a>
      </div>
    </article>`;
  }).join('');
  fillSelect('#plan', [
    ...plans.map(p => ({ value: pick(p.name), label: pick(p.name) })),
    { value: 'other', label: t('form.other') },
  ]);
}

function renderSightseeing(spots) {
  const el = $('#cms-sightseeing');
  if (!el || !spots?.length) return;
  el.innerHTML = spots.map(s => `
    <article class="sight-card fade-in">
      <div class="sight-card__img">
        <img src="${s.image}" alt="${pick(s.name)}" width="480" height="320" loading="lazy" />
        <span class="sight-card__dist">${pick(s.distance)}</span>
      </div>
      <div class="sight-card__body">
        <h3>${pick(s.name)}</h3>
        <p>${pick(s.description)}</p>
      </div>
    </article>
  `).join('');
}

function fillSelect(sel, opts) {
  const el = $(sel);
  if (!el) return;
  const first = el.querySelector('option[value=""]');
  const placeholder = first ? first.textContent : t('form.select');
  el.innerHTML = `<option value="">${placeholder}</option>` +
    opts.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
}

function setLang(lang) {
  if (!i18nData[lang]) return;
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  $$('.lang-switch__btn').forEach(btn => {
    const active = btn.dataset.lang === lang;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
  applyI18n();
  initScrollReveal();
}

function initScrollReveal() {
  $$('.fade-in:not(.is-visible)').forEach(el => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) { target.classList.add('is-visible'); io.unobserve(target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    io.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setLang(currentLang);

  const header = $('.header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('header--scrolled', scrollY > 50);
    $('#totop').classList.toggle('is-visible', scrollY > 400);
  }, { passive: true });

  const menuBtn = $('.menu-btn');
  const drawer = $('.drawer');
  const close = () => { document.body.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', 'false'); drawer.setAttribute('aria-hidden', 'true'); };
  const open = () => { document.body.classList.add('menu-open'); menuBtn.setAttribute('aria-expanded', 'true'); drawer.setAttribute('aria-hidden', 'false'); };
  menuBtn.addEventListener('click', () => document.body.classList.contains('menu-open') ? close() : open());
  $('.drawer__overlay').addEventListener('click', close);
  $$('.drawer__panel a').forEach(a => a.addEventListener('click', close));

  $$('.lang-switch__btn').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });

  $('#totop').addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  const form = $('.form');
  const submitLabel = () => t('form.submit');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const btn = form.querySelector('[type="submit"]');
    btn.textContent = t('form.sending');
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = t('form.sent');
      setTimeout(() => { btn.textContent = submitLabel(); btn.disabled = false; form.reset(); }, 3500);
    }, 1000);
  });

  $$('.nav a, .drawer__panel a, .footer__nav a').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href?.startsWith('#') && href.length > 1) {
        e.preventDefault();
        close();
        $(href)?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});

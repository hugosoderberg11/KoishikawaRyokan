'use strict';

import siteData from './cms/site.json';
import newsData from './cms/news.json';
import roomsData from './cms/rooms.json';
import plansData from './cms/plans.json';
import i18nData from './cms/i18n.json';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const LANG_KEY = 'urban-hotel-lang';
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
  $('meta[property="og:locale"]')?.setAttribute('content', OG_LOCALE[currentLang]);

  const siteName = pick(siteData.name);
  $('#site-name-ja') && ($('#site-name-ja').textContent = siteName);
  $('#drawer-site-name') && ($('#drawer-site-name').textContent = siteName);
  $('#footer-site-name') && ($('#footer-site-name').textContent = siteName);

  updateSchema();
  renderNews(newsData);
  renderRooms(roomsData);
  renderPlans(plansData);
}

function updateSchema() {
  const schemaEl = $('#schema-hotel');
  if (!schemaEl) return;
  const schema = JSON.parse(schemaEl.textContent);
  schema.name = pick(siteData.name);
  schema.description = t('schema.description');
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
    const badgeClass = { popular: 'badge--pop', couple: 'badge--couple', premium: 'badge--premium' }[r.badgeType] || '';
    const amenities = pickList(r.amenities);
    return `
      <article class="room-card fade-in">
        <div class="room-card__img">
          <img src="${r.image}" alt="${pick(r.name)}" width="700" height="500" loading="lazy" />
          <span class="badge ${badgeClass}">${pick(r.badge)}</span>
        </div>
        <div class="room-card__body">
          <span class="room-card__type">${r.typeEn}</span>
          <h3 class="room-card__name">${pick(r.name)}</h3>
          <p>${pick(r.description)}</p>
          <ul class="room-card__amenities">${amenities.map(a => `<li>${a}</li>`).join('')}</ul>
          <p class="room-card__price"><small>${pick(r.priceLabel)}</small> <strong>${r.price}</strong></p>
          <a href="#reserve" class="btn btn--book">${t('room.btn')}</a>
        </div>
      </article>`;
  }).join('');
  fillSelect('#room', rooms.map(r => ({ value: pick(r.name), label: pick(r.name) })));
  initScrollReveal();
}

function renderPlans(plans) {
  const el = $('#cms-plans');
  if (!el || !plans?.length) return;
  el.innerHTML = plans.map(p => {
    const includes = pickList(p.includes);
    return `
      <article class="plan-card${p.featured ? ' plan-card--featured' : ''} fade-in">
        ${p.badge ? `<span class="plan-card__badge">${pick(p.badge)}</span>` : ''}
        <div class="plan-card__img"><img src="${p.image}" alt="${pick(p.name)}" width="600" height="400" loading="lazy" /></div>
        <div class="plan-card__body">
          <span class="plan-card__tag">${pick(p.tag)}</span>
          <h3>${pick(p.name)}</h3>
          <p>${pick(p.description)}</p>
          <ul class="plan-card__includes">${includes.map(i => `<li>${i}</li>`).join('')}</ul>
          <p class="plan-card__price"><small>${pick(p.priceLabel)}</small> <strong>${p.price}</strong></p>
          <a href="#reserve" class="btn ${p.featured ? 'btn--book' : 'btn--outline-light'}">${t('plan.btn')}</a>
        </div>
      </article>`;
  }).join('');
  fillSelect('#plan', [
    ...plans.map(p => ({ value: pick(p.name), label: pick(p.name) })),
    { value: 'other', label: t('form.other') },
  ]);
  initScrollReveal();
}

function fillSelect(sel, opts) {
  const el = $(sel);
  if (!el) return;
  el.innerHTML = `<option value="">${t('form.select')}</option>` +
    opts.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
}

function setLang(lang) {
  if (!i18nData[lang]) return;
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  $$('.lang-btn').forEach(btn => {
    const active = btn.dataset.lang === lang;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
  applyI18n();
}

function initScrollReveal() {
  $$('.fade-in:not(.is-visible)').forEach(el => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) { target.classList.add('is-visible'); io.unobserve(target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -48px 0px' });
    io.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setLang(currentLang);
  initScrollReveal();

  const header = $('.header');
  const totop = $('#totop');
  window.addEventListener('scroll', () => {
    header.classList.toggle('header--scrolled', scrollY > 60);
    totop?.classList.toggle('is-visible', scrollY > 500);
  }, { passive: true });

  const menuBtn = $('.menu-btn');
  const drawer = $('.drawer');
  const close = () => {
    document.body.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
  };
  const open = () => {
    document.body.classList.add('menu-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
  };
  menuBtn.addEventListener('click', () =>
    document.body.classList.contains('menu-open') ? close() : open()
  );
  drawer.querySelector('.drawer__overlay')?.addEventListener('click', close);
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

  $$('.lang-btn').forEach(btn =>
    btn.addEventListener('click', () => setLang(btn.dataset.lang))
  );

  totop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const form = $('#contact');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      btn.textContent = '送信中…';
      setTimeout(() => {
        btn.textContent = '送信しました ✓';
        form.reset();
      }, 1200);
    });
  }

  const faqItems = $$('.faq__item');
  faqItems.forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) faqItems.forEach(other => { if (other !== item) other.open = false; });
    });
  });
});

'use strict';

import siteData from './cms/site.json';
import newsData from './cms/news.json';
import roomsData from './cms/rooms.json';
import plansData from './cms/plans.json';
import cuisineData from './cms/cuisine.json';
import testimonialsData from './cms/testimonials.json';
import i18nData from './cms/i18n.json';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const LANG_KEY = 'hoshinoan-lang';
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
  $$('#site-name-ja, .brand-ja:not(.footer-logo-ja)').forEach(el => { el.textContent = siteName; });
  $('.footer-logo-ja') && ($('.footer-logo-ja').textContent = siteName);

  const addr = siteData.address;
  const addressStr = `〒${addr.postalCode} ${pick(addr.region)}${pick(addr.locality)}${pick(addr.street)}`;
  $('#footer-address') && ($('#footer-address').innerHTML = `${addressStr}<br />Tel: <a href="tel:${siteData.telephoneRaw}">${siteData.telephone}</a>`);
  $('#access-address') && ($('#access-address').innerHTML = `〒${addr.postalCode}<br />${pick(addr.region)}${pick(addr.locality)}${pick(addr.street)}`);

  if (siteData.heroImage) {
    const hero = $('.hero-photo');
    if (hero) hero.style.backgroundImage = `url('${siteData.heroImage}')`;
  }
  if (siteData.onsenImage) {
    const onsen = $('.onsen-photo-bg');
    if (onsen) onsen.style.backgroundImage = `url('${siteData.onsenImage}')`;
  }
  if (siteData.cuisineImage) {
    const cuisine = $('.main-dish');
    if (cuisine) cuisine.style.backgroundImage = `url('${siteData.cuisineImage}')`;
  }

  updateSchema();
  renderNews(newsData);
  renderRooms(roomsData);
  renderPlans(plansData);
  renderCuisine(cuisineData);
  renderTestimonials(testimonialsData);
  fillFormSelects(roomsData, plansData);
}

function updateSchema() {
  const schemaEl = $('#schema-hotel');
  if (!schemaEl) return;
  const schema = JSON.parse(schemaEl.textContent);
  schema.name = pick(siteData.name);
  schema.description = t('schema.description');
  schema.address.streetAddress = pick(siteData.address.street);
  schema.address.addressLocality = pick(siteData.address.locality);
  schema.address.addressRegion = pick(siteData.address.region);
  schemaEl.textContent = JSON.stringify(schema, null, 2);
}

function renderNews(items) {
  const track = $('.news-track');
  if (!track || !items?.length) return;
  const html = items.map(n =>
    `<li><time datetime="${n.date}">${pick(n.dateDisplay)}</time><a href="${n.url}">${pick(n.title)}</a></li>`
  ).join('');
  track.innerHTML = `<ul class="news-list">${html}</ul><ul class="news-list" aria-hidden="true">${html}</ul>`;
}

function renderRooms(rooms) {
  const el = $('.rooms-grid');
  if (!el || !rooms?.length) return;
  el.innerHTML = rooms.map(r => {
    const amenities = pickList(r.amenities);
    const badgeCls = r.badgeType === 'special' ? ' special' : '';
    return `
      <article class="room-card reveal-up">
        <a href="#reserve" class="room-card-link">
          <div class="room-photo" style="background-image:url('${r.image}')">
            <div class="room-photo-overlay"></div>
            <span class="room-badge${badgeCls}">${pick(r.badge)}</span>
          </div>
          <div class="room-info">
            <span class="room-type">${r.typeEn}</span>
            <h3 class="room-name">${pick(r.name)}</h3>
            <p class="room-desc">${pick(r.description)}</p>
            <ul class="room-amenities">${amenities.map(a => `<li>${a}</li>`).join('')}</ul>
            <div class="room-price">
              <span class="price-from">${pick(r.priceLabel)}</span>
              <strong class="price-num">${r.price}</strong>
            </div>
          </div>
        </a>
      </article>`;
  }).join('');
  observeReveals(el);
}

function renderPlans(plans) {
  const el = $('.plans-grid');
  if (!el || !plans?.length) return;
  el.innerHTML = plans.map(p => {
    const includes = pickList(p.includes);
    return `
    <article class="plan-card${p.featured ? ' plan-card-featured' : ''} reveal-up">
      ${p.badge ? `<div class="plan-badge">${pick(p.badge)}</div>` : ''}
      <div class="plan-photo" style="background-image:url('${p.image}')"></div>
      <div class="plan-body">
        <span class="plan-tag${p.featured ? ' plan-tag-gold' : ''}">${pick(p.tag)}</span>
        <h3 class="plan-name">${pick(p.name)}</h3>
        <p class="plan-desc">${pick(p.description)}</p>
        <ul class="plan-includes">${includes.map(i => `<li>${i}</li>`).join('')}</ul>
        <div class="plan-price">
          <span>${pick(p.priceLabel)}</span>
          <strong>${p.price}</strong>
          <span class="price-note">${pick(p.priceNote)}</span>
        </div>
        <a href="#reserve" class="btn ${p.featured ? 'btn-plan-gold' : 'btn-plan'}">${t(p.featured ? 'plan.btn.featured' : 'plan.btn')}</a>
      </div>
    </article>`;
  }).join('');
  observeReveals(el);
}

function renderCuisine(dishes) {
  const el = $('.cuisine-grid');
  if (!el || !dishes?.length) return;
  el.innerHTML = dishes.map(d => `
    <article class="dish-card reveal-up">
      <div class="dish-photo" style="background-image:url('${d.image}')"></div>
      <div class="dish-info">
        <span class="dish-category">${pick(d.category)}</span>
        <h3 class="dish-name">${pick(d.name)}</h3>
        <p class="dish-desc">${pick(d.description)}</p>
      </div>
    </article>
  `).join('');
  observeReveals(el);
}

function renderTestimonials(items) {
  const el = $('.testimonials-grid');
  if (!el || !items?.length) return;
  el.innerHTML = items.map(v => `
    <blockquote class="testimonial-card reveal-up">
      <div class="testimonial-stars" aria-label="5 stars">★★★★★</div>
      <p class="testimonial-text">${pick(v.text)}</p>
      <footer class="testimonial-footer">
        <span class="testimonial-author">${pick(v.author)}</span>
        <time class="testimonial-date" datetime="${v.datetime}">${pick(v.date)}</time>
      </footer>
    </blockquote>
  `).join('');
  observeReveals(el);
}

function fillFormSelects(rooms, plans) {
  fillSelect('#r-plan', [
    ...plans.map(p => ({ value: pick(p.name), label: pick(p.name) })),
    { value: 'other', label: t('form.other') },
  ]);
  fillSelect('#r-room', [
    ...rooms.map(r => ({ value: pick(r.name), label: pick(r.name) })),
    { value: 'omakase', label: t('form.omakase') },
  ]);
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
  $$('.lang-switch__btn').forEach(btn => {
    const active = btn.dataset.lang === lang;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
  applyI18n();
}

function observeReveals(container) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) { target.classList.add('is-in'); observer.unobserve(target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });
  container.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
  setLang(currentLang);

  const header = $('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const toggle = $('.nav-toggle');
  const drawer = $('.nav-drawer');
  const drawerBg = $('.drawer-bg');
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
  toggle.addEventListener('click', () => document.body.classList.contains('nav-open') ? closeNav() : openNav());
  drawerBg.addEventListener('click', closeNav);
  $$('.drawer-panel a').forEach(a => a.addEventListener('click', closeNav));

  $$('.lang-switch__btn').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) { target.classList.add('is-in'); observer.unobserve(target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });
  $$('.reveal-up').forEach((el, i) => {
    const siblings = el.parentElement?.querySelectorAll('.reveal-up');
    const idx = siblings ? [...siblings].indexOf(el) : 0;
    el.style.transitionDelay = `${idx * 0.08}s`;
    observer.observe(el);
  });

  $$('.hero .reveal-up').forEach((el, i) => {
    setTimeout(() => el.classList.add('is-in'), 200 + i * 140);
  });

  const scrollTopBtn = $('#scrollTop');
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('is-visible', window.scrollY > 400);
  }, { passive: true });
  scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const form = $('.contact-form');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const btn = form.querySelector('[type="submit"]');
    btn.textContent = t('form.sending');
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = t('form.sent');
      btn.style.background = 'var(--moss-mid)';
      setTimeout(() => {
        btn.textContent = t('form.submit');
        btn.style.background = '';
        btn.disabled = false;
        form.reset();
      }, 4000);
    }, 1200);
  });

  const heroPhoto = $('.hero-photo');
  if (heroPhoto && window.matchMedia('(min-width: 769px)').matches) {
    window.addEventListener('scroll', () => {
      heroPhoto.style.transform = `translateY(${window.scrollY * 0.3}px)`;
    }, { passive: true });
  }
});

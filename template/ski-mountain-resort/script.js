import site from './cms/site.json';
import newsData from './cms/news.json';
import roomsData from './cms/rooms.json';
import plansData from './cms/plans.json';
import i18nData from './cms/i18n.json';

const LANG_KEY = 'ski-resort-lang';
let currentLang = localStorage.getItem(LANG_KEY) || 'ja';

function t(key) {
  return (i18nData[currentLang] || i18nData['ja'])[key] || key;
}

function pick(obj) {
  if (!obj) return '';
  return obj[currentLang] || obj['ja'] || '';
}

function pickList(obj) {
  if (!obj) return [];
  return obj[currentLang] || obj['ja'] || [];
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (el.tagName === 'META') {
      el.setAttribute('content', val);
    } else {
      el.innerHTML = val;
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  document.title = t('meta.title');
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
  applyI18n();
  renderNews();
  renderRooms();
  renderPlans();
  fillSelects();
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.lang === lang);
  });
}

function renderNews() {
  const list = document.getElementById('news-list');
  if (!list) return;
  list.innerHTML = newsData.map(item => `
    <a href="${item.url}" class="news-item">
      <time class="news-date">${pick(item.dateDisplay)}</time>
      <span class="news-title">${pick(item.title)}</span>
    </a>
  `).join('');
}

function renderRooms() {
  const grid = document.getElementById('rooms-grid');
  if (!grid) return;
  grid.innerHTML = roomsData.map(room => `
    <article class="room-card" id="room-${room.id}">
      <div class="room-photo" style="background-image:url('${room.image}')">
        ${room.badge ? `<span class="room-badge room-badge--${room.badgeType}">${pick(room.badge)}</span>` : ''}
      </div>
      <div class="room-body">
        <p class="room-type-en">${room.typeEn}</p>
        <h3 class="room-name">${pick(room.name)}</h3>
        <p class="room-desc">${pick(room.description)}</p>
        <ul class="room-amenities">
          ${pickList(room.amenities).map(a => `<li>${a}</li>`).join('')}
        </ul>
        <div class="room-price-row">
          <span class="room-price-label">${pick(room.priceLabel)}</span>
          <span class="room-price">${room.price}</span>
        </div>
        <a href="#reserve" class="room-btn">${t('room.btn')}</a>
      </div>
    </article>
  `).join('');
}

function renderPlans() {
  const grid = document.getElementById('plans-grid');
  if (!grid) return;
  grid.innerHTML = plansData.map(plan => `
    <article class="plan-card${plan.featured ? ' plan-card--featured' : ''}" id="plan-${plan.id}">
      ${plan.badge ? `<div class="plan-badge">${pick(plan.badge)}</div>` : ''}
      <div class="plan-photo" style="background-image:url('${plan.image}')"></div>
      <div class="plan-body">
        <span class="plan-tag">${pick(plan.tag)}</span>
        <h3 class="plan-name">${pick(plan.name)}</h3>
        <p class="plan-desc">${pick(plan.description)}</p>
        <ul class="plan-includes">
          ${pickList(plan.includes).map(inc => `<li>${inc}</li>`).join('')}
        </ul>
        <div class="plan-price-row">
          <span class="plan-price-label">${pick(plan.priceLabel)}</span>
          <span class="plan-price">${plan.price}</span>
        </div>
        <a href="#reserve" class="plan-btn">${t('plan.btn')}</a>
      </div>
    </article>
  `).join('');
}

function fillSelects() {
  const planSel = document.getElementById('form-plan');
  if (planSel) {
    const placeholder = t('form.select');
    planSel.innerHTML = `<option value="">${placeholder}</option>` +
      plansData.map(p => `<option value="${p.id}">${pick(p.name)}</option>`).join('') +
      `<option value="other">${t('form.other')}</option>`;
  }
  const roomSel = document.getElementById('form-room');
  if (roomSel) {
    const placeholder = t('form.select');
    roomSel.innerHTML = `<option value="">${placeholder}</option>` +
      roomsData.map(r => `<option value="${r.id}">${pick(r.name)}</option>`).join('') +
      `<option value="other">${t('form.other')}</option>`;
  }
}

function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initDrawer() {
  const toggle = document.getElementById('drawer-toggle');
  const close = document.getElementById('drawer-close');
  const drawer = document.getElementById('mobile-drawer');
  const overlay = document.getElementById('drawer-overlay');
  if (!toggle || !drawer) return;

  const open = () => {
    drawer.classList.add('is-open');
    overlay?.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
  };
  const closeDrawer = () => {
    drawer.classList.remove('is-open');
    overlay?.classList.remove('is-visible');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', open);
  close?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);
  drawer.querySelectorAll('a[href]').forEach(a => a.addEventListener('click', closeDrawer));
}

function initLangButtons() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
}

function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('is-open'));
      if (!isOpen) item.classList.add('is-open');
    });
  });
}

function initScrollReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => io.observe(el));
}

function initNewsTickerDuplicate() {
  const track = document.querySelector('.news-ticker-track');
  if (!track) return;
  const inner = track.querySelector('.news-ticker-inner');
  if (inner) {
    const clone = inner.cloneNode(true);
    track.appendChild(clone);
  }
}

function initToTop() {
  const btn = document.getElementById('to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('is-visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initForm() {
  const form = document.getElementById('reserve-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    if (btn) {
      btn.textContent = '送信完了しました / Sent!';
      btn.disabled = true;
    }
  });
}

function injectSchema() {
  const s = site;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: s.nameEn,
    description: t('schema.description'),
    url: s.url,
    telephone: s.telephone,
    email: s.email,
    address: {
      '@type': 'PostalAddress',
      postalCode: s.address.postalCode,
      addressRegion: s.address.region,
      addressLocality: s.address.locality,
      streetAddress: s.address.street,
      addressCountry: 'JP'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: s.geo.latitude,
      longitude: s.geo.longitude
    },
    checkinTime: s.checkin,
    checkoutTime: s.checkout,
    priceRange: s.priceRange,
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: 'スキーゲレンデ直結', value: true },
      { '@type': 'LocationFeatureSpecification', name: '天然温泉', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'スキーレンタル', value: true },
      { '@type': 'LocationFeatureSpecification', name: '無料駐車場', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'レストラン', value: true }
    ]
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', () => {
  setLang(currentLang);
  initHeader();
  initDrawer();
  initLangButtons();
  initFAQ();
  initScrollReveal();
  initNewsTickerDuplicate();
  initToTop();
  initForm();
  injectSchema();
});

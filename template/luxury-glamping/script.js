'use strict';

import siteData from './cms/site.json';
import newsData from './cms/news.json';
import roomsData from './cms/rooms.json';
import plansData from './cms/plans.json';
import activitiesData from './cms/activities.json';
import i18nData from './cms/i18n.json';
import pricesData from './cms/prices.json';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const LANG_KEY = 'glamping-lang';
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

  const tel = siteData.telephone;
  const telRaw = siteData.telephoneRaw;
  $('#teaser-tel') && ($('#teaser-tel').textContent = tel);
  $('#teaser-tel') && ($('#teaser-tel').href = `tel:${telRaw}`);
  $('#teaser-contact-mail') && ($('#teaser-contact-mail').href = `mailto:${siteData.email}`);

  updateSchema();
  renderNews(newsData);
  renderRooms(roomsData);
  renderPlans(plansData);
  renderActivities(activitiesData);

  const stickyName = document.getElementById('sticky-site-name');
  if (stickyName) stickyName.textContent = pick(siteData.name);
  const stickyTel = document.getElementById('sticky-tel');
  if (stickyTel) { stickyTel.textContent = siteData.telephone; stickyTel.href = `tel:${siteData.telephoneRaw}`; }}

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
    const badgeCls = { popular: 'badge--pop', family: 'badge--family', couple: 'badge--couple', premium: 'badge--premium' }[r.badgeType] || '';
    const amenities = pickList(r.amenities);
    return `
      <article class="room-card fade-in">
        <div class="room-card__img">
          <img src="${r.image}" alt="${pick(r.name)}" width="700" height="900" loading="lazy" />
          <span class="badge ${badgeCls}">${pick(r.badge)}</span>
          <button class="lightbox-trigger" type="button" data-group="rooms" data-src="${r.image}" data-caption="${pick(r.name)}" aria-label="${pick(r.name)}を拡大表示"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg></button>
        </div>
        <div class="room-card__body">
          <span class="room-card__type">${r.typeEn}</span>
          <h3 class="room-card__name">${pick(r.name)}</h3>
          <p>${pick(r.description)}</p>
          <ul class="room-card__tags">${amenities.map(a => `<li>${a}</li>`).join('')}</ul>
          <p class="room-card__price"><small>${pick(r.priceLabel)}</small> <strong>${r.price}</strong></p>
          <a href="reserve/?room=${r.id}" class="btn btn--accent">${t('room.btn')}</a>
        </div>
      </article>`;
  }).join('');
  initScrollReveal();
  // ── Phase 2: 価格カレンダー ──
  initPriceCalendar(pricesData);
  // ── Phase 2: 口コミ投稿フォーム ──
  initReviewForm(siteData.nameEn || 'template');
  // ── Phase 2: メルマガ登録 ──
  initNewsletter(siteData.nameEn || 'template');

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
        <ul>${includes.map(i => `<li>${i}</li>`).join('')}</ul>
        <p class="plan-card__price"><small>${pick(p.priceLabel)}</small> <strong>${p.price}</strong></p>
        <a href="reserve/?plan=${p.id}" class="btn ${p.featured ? 'btn--accent' : 'btn--outline-light'}">${t('plan.btn')}</a>
      </div>
    </article>`;
  }).join('');
  initScrollReveal();
  // ── Phase 2: 価格カレンダー ──
  initPriceCalendar(pricesData);
  // ── Phase 2: 口コミ投稿フォーム ──
  initReviewForm(siteData.nameEn || 'template');
  // ── Phase 2: メルマガ登録 ──
  initNewsletter(siteData.nameEn || 'template');

}

function renderActivities(activities) {
  const el = $('#cms-activities');
  if (!el || !activities?.length) return;
  el.innerHTML = activities.map(a => `
    <article class="act-card fade-in">
      <div class="act-card__img">
        <img src="${a.image}" alt="${pick(a.name)}" width="500" height="600" loading="lazy" />
        <span class="act-card__icon" aria-hidden="true">${a.icon}</span>
      </div>
      <div class="act-card__body">
        <h3>${pick(a.name)}</h3>
        <p>${pick(a.description)}</p>
        <dl class="act-card__meta">
          <div><dt>${t('activities.duration')}</dt><dd>${pick(a.duration)}</dd></div>
          <div><dt>${t('activities.price')}</dt><dd>${pick(a.price)}</dd></div>
        </dl>
        <a href="reserve/" class="act-card__link">${t('activities.btn')} →</a>
      </div>
    </article>
  `).join('');
  initScrollReveal();
  // ── Phase 2: 価格カレンダー ──
  initPriceCalendar(pricesData);
  // ── Phase 2: 口コミ投稿フォーム ──
  initReviewForm(siteData.nameEn || 'template');
  // ── Phase 2: メルマガ登録 ──
  initNewsletter(siteData.nameEn || 'template');

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


// ── Phase 2: 価格カレンダー ──
function initPriceCalendar(prices) {
  const grid       = document.getElementById('cal-grid');
  const monthLabel = document.getElementById('cal-month-label');
  const prevBtn    = document.getElementById('cal-prev');
  const nextBtn    = document.getElementById('cal-next');
  if (!grid || !monthLabel) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let viewYear  = today.getFullYear();
  let viewMonth = today.getMonth();

  const TIER_FROM_DATE = (dateStr) => {
    const sold = (prices.soldOut || []).includes(dateStr);
    if (sold) return 'sold';
    const period = (prices.periods || []).find(p => dateStr >= p.from && dateStr <= p.to);
    return period?.tier || 'standard';
  };

  const toDateStr = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  let selectedDate = null;

  function renderCalendar() {
    const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const monthNames  = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    monthLabel.textContent = `${viewYear}年 ${monthNames[viewMonth]}`;

    const minDate = new Date(today);
    prevBtn.disabled = viewYear === minDate.getFullYear() && viewMonth <= minDate.getMonth();
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 12, 1);
    nextBtn.disabled = new Date(viewYear, viewMonth + 1, 1) >= maxDate;

    let html = '';
    for (let i = 0; i < firstDay; i++) html += '<span class="cal-day cal-day--empty"></span>';
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = toDateStr(viewYear, viewMonth, d);
      const date    = new Date(viewYear, viewMonth, d);
      const isPast  = date < today;
      const isToday = date.getTime() === today.getTime();
      const tier    = TIER_FROM_DATE(dateStr);
      const isSel   = selectedDate === dateStr;
      const classes = ['cal-day', `cal-day--${tier}`, isPast ? 'cal-day--past' : '', isToday ? 'cal-day--today' : '', isSel ? 'cal-day--selected' : ''].filter(Boolean).join(' ');
      const clickable = !isPast && tier !== 'sold';
      html += `<button type="button" class="${classes}" data-date="${dateStr}" ${!clickable ? 'disabled' : ''}>${d}</button>`;
    }
    grid.innerHTML = html;

    grid.querySelectorAll('.cal-day[data-date]:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        const dateStr = btn.dataset.date;
        selectedDate = dateStr;
        const checkinInput = document.getElementById('q-checkin');
        if (checkinInput) {
          checkinInput.value = dateStr;
          checkinInput.dispatchEvent(new Event('change'));
          checkinInput.closest('form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        renderCalendar();
      });
    });
  }

  prevBtn.addEventListener('click', () => { if (viewMonth === 0) { viewYear--; viewMonth = 11; } else viewMonth--; renderCalendar(); });
  nextBtn.addEventListener('click', () => { if (viewMonth === 11) { viewYear++; viewMonth = 0; } else viewMonth++; renderCalendar(); });
  renderCalendar();
}

// ── Phase 2: 口コミ投稿フォーム ──
function initReviewForm(templateName) {
  const toggleBtn   = document.getElementById('toggle-review-form');
  const container   = document.getElementById('review-form-container');
  const form        = document.getElementById('review-form');
  const message     = document.getElementById('review-message');
  const successEl   = document.getElementById('review-success');
  const commentArea = document.getElementById('review-comment');
  const charCount   = document.getElementById('review-char-count');
  const submitBtn   = document.getElementById('review-submit');
  if (!toggleBtn || !container || !form) return;

  toggleBtn.addEventListener('click', () => {
    const hidden = container.hasAttribute('hidden');
    hidden ? container.removeAttribute('hidden') : container.setAttribute('hidden', '');
    toggleBtn.setAttribute('aria-expanded', String(hidden));
  });

  commentArea?.addEventListener('input', () => {
    if (charCount) charCount.textContent = commentArea.value.length;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rating = form.querySelector('input[name="rating"]:checked')?.value;
    if (!rating) { showMsg(message, '評価（星）を選択してください', 'is-error'); return; }
    const data = {
      template_name: templateName,
      nickname: form.nickname.value.trim(),
      stay_type: form.stay_type.value || null,
      rating: Number(rating),
      comment: form.comment.value.trim(),
    };
    submitBtn.disabled = true;
    submitBtn.textContent = '送信中...';
    try {
      const res  = await fetch('/api/submit-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '送信に失敗しました');
      form.setAttribute('hidden', '');
      successEl?.removeAttribute('hidden');
    } catch (err) {
      showMsg(message, err.message, 'is-error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '投稿する';
    }
  });
}

// ── Phase 2: メルマガ登録 ──
function initNewsletter(templateName) {
  const form      = document.getElementById('newsletter-form');
  const msgEl     = document.getElementById('newsletter-message');
  const submitBtn = document.getElementById('newsletter-submit');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.querySelector('#newsletter-email')?.value.trim();
    if (!email) return;
    submitBtn.disabled = true;
    submitBtn.textContent = '送信中...';
    try {
      const res  = await fetch('/api/newsletter-subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, template_name: templateName }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '登録に失敗しました');
      showMsg(msgEl, json.message, 'is-success');
      form.querySelector('#newsletter-email').value = '';
    } catch (err) {
      showMsg(msgEl, err.message, 'is-error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '登録する';
    }
  });
}

function showMsg(el, text, cls) {
  if (!el) return;
  el.textContent = text;
  el.className   = `newsletter-message ${cls}`;
  el.removeAttribute('hidden');
}
document.addEventListener('DOMContentLoaded', () => {
  setLang(currentLang);
  initScrollReveal();
  // ── Phase 2: 価格カレンダー ──
  initPriceCalendar(pricesData);
  // ── Phase 2: 口コミ投稿フォーム ──
  initReviewForm(siteData.nameEn || 'template');
  // ── Phase 2: メルマガ登録 ──
  initNewsletter(siteData.nameEn || 'template');


  const header = $('.header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('header--scrolled', scrollY > 60);
    $('#totop').classList.toggle('is-visible', scrollY > 500);
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

  const quickCheckin = $('#q-checkin');
  if (quickCheckin) {
    quickCheckin.min = new Date().toISOString().slice(0, 10);
  }

  $$('.nav a, .drawer__panel a').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href?.startsWith('#') && href.length > 1) {
        e.preventDefault();
        close();
        $(href)?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ── Phase 1: スティッキー予約バー ──
  const stickyBar = document.getElementById('sticky-reserve');
  if (stickyBar) {
    const hero = document.querySelector('.hero');
    const onScrollSticky = () => {
      const threshold = hero ? hero.offsetHeight * 0.75 : window.innerHeight * 0.75;
      const visible = window.scrollY > threshold;
      stickyBar.classList.toggle('is-visible', visible);
      stickyBar.setAttribute('aria-hidden', String(!visible));
    };
    window.addEventListener('scroll', onScrollSticky, { passive: true });
    onScrollSticky();
  }

  // ── Phase 1: SNSシェアボタン ──
  const shareUrl   = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(document.title);
  const btnX    = document.getElementById('share-x');
  const btnLine = document.getElementById('share-line');
  const btnCopy = document.getElementById('share-copy');
  if (btnX)    btnX.href    = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`;
  if (btnLine) btnLine.href = `https://line.me/R/msg/text/?${shareTitle}%0a${shareUrl}`;
  if (btnCopy) {
    btnCopy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(window.location.href); }
      catch {
        const ta = document.createElement('textarea');
        ta.value = window.location.href;
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      }
      const label = btnCopy.querySelector('.copy-label');
      btnCopy.classList.add('is-copied');
      if (label) label.textContent = 'コピーしました!';
      setTimeout(() => { btnCopy.classList.remove('is-copied'); if (label) label.textContent = 'リンクをコピー'; }, 2000);
    });
  }

  // ── Phase 1: ライトボックス ──
  const lightbox  = document.getElementById('lightbox');
  const lbImg     = lightbox?.querySelector('.lightbox-img');
  const lbCaption = lightbox?.querySelector('.lightbox-caption');
  const lbCounter = lightbox?.querySelector('.lightbox-counter');
  const lbClose   = lightbox?.querySelector('.lightbox-close');
  const lbPrev    = lightbox?.querySelector('.lightbox-prev');
  const lbNext    = lightbox?.querySelector('.lightbox-next');
  if (lightbox && lbImg) {
    let lbItems = [], lbIdx = 0;
    const lbShow = () => {
      const item = lbItems[lbIdx];
      lbImg.src = item.src; lbImg.alt = item.caption || '';
      lbCaption.textContent = item.caption || '';
      lbCounter.textContent = lbItems.length > 1 ? `${lbIdx + 1} / ${lbItems.length}` : '';
      lbPrev.disabled = lbIdx === 0; lbNext.disabled = lbIdx === lbItems.length - 1;
    };
    const lbOpen = (items, idx) => {
      lbItems = items; lbIdx = idx; lbShow();
      lightbox.removeAttribute('hidden');
      requestAnimationFrame(() => lightbox.classList.add('is-open'));
      document.body.style.overflow = 'hidden';
      lbClose.focus();
    };
    const lbClose_ = () => {
      lightbox.classList.remove('is-open');
      setTimeout(() => { lightbox.setAttribute('hidden', ''); document.body.style.overflow = ''; }, 320);
    };
    lbClose.addEventListener('click', lbClose_);
    lightbox.querySelector('.lightbox-backdrop').addEventListener('click', lbClose_);
    lbPrev.addEventListener('click', () => { lbIdx--; lbShow(); });
    lbNext.addEventListener('click', () => { lbIdx++; lbShow(); });
    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') lbClose_();
      if (e.key === 'ArrowLeft'  && lbIdx > 0)                  { lbIdx--; lbShow(); }
      if (e.key === 'ArrowRight' && lbIdx < lbItems.length - 1) { lbIdx++; lbShow(); }
    });
    document.addEventListener('click', e => {
      const trigger = e.target.closest('.lightbox-trigger');
      if (!trigger) return;
      e.preventDefault(); e.stopPropagation();
      const group = trigger.dataset.group;
      const all   = [...document.querySelectorAll(`.lightbox-trigger[data-group="${group}"]`)];
      const items = all.map(t => ({ src: t.dataset.src, caption: t.dataset.caption || '' }));
      lbOpen(items, all.indexOf(trigger));
    });
  }
});
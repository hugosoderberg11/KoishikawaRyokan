'use strict';

import siteData from './cms/site.json';
import newsData from './cms/news.json';
import roomsData from './cms/rooms.json';
import plansData from './cms/plans.json';
import cuisineData from './cms/cuisine.json';
import testimonialsData from './cms/testimonials.json';
import i18nData from './cms/i18n.json';
import pricesData from './cms/prices.json';

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

  const tel = siteData.telephone;
  const telRaw = siteData.telephoneRaw;
  $('#teaser-tel') && ($('#teaser-tel').textContent = tel);
  $('#teaser-tel') && ($('#teaser-tel').href = `tel:${telRaw}`);
  $('#hero-contact') && ($('#hero-contact').href = `mailto:${siteData.email}`);
  $('#footer-contact-mail') && ($('#footer-contact-mail').href = `mailto:${siteData.email}`);
  $('#teaser-contact-mail') && ($('#teaser-contact-mail').href = `mailto:${siteData.email}`);

  const stickyName = $('#sticky-site-name');
  if (stickyName) stickyName.textContent = pick(siteData.name);
  const stickyTel = $('#sticky-tel');
  if (stickyTel) { stickyTel.textContent = tel; stickyTel.href = `tel:${telRaw}`; }
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
        <a href="reserve/?room=${r.id}" class="room-card-link">
          <div class="room-photo" style="background-image:url('${r.image}')">
            <div class="room-photo-overlay"></div>
            <span class="room-badge${badgeCls}">${pick(r.badge)}</span>
            <button class="lightbox-trigger" type="button" data-group="rooms" data-src="${r.image}" data-caption="${pick(r.name)}" aria-label="${pick(r.name)}を拡大表示">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            </button>
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
        <a href="reserve/?plan=${p.id}" class="btn ${p.featured ? 'btn-plan-gold' : 'btn-plan'}">${t(p.featured ? 'plan.btn.featured' : 'plan.btn')}</a>
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
      <div class="dish-photo" style="background-image:url('${d.image}')">
        <button class="lightbox-trigger" type="button" data-group="cuisine" data-src="${d.image}" data-caption="${pick(d.name)}" aria-label="${pick(d.name)}を拡大表示">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
        </button>
      </div>
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

// ── Phase 2: 価格カレンダー ──
function initPriceCalendar(prices) {
  const grid      = document.getElementById('cal-grid');
  const monthLabel = document.getElementById('cal-month-label');
  const prevBtn   = document.getElementById('cal-prev');
  const nextBtn   = document.getElementById('cal-next');
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
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
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
      const classes = [
        'cal-day',
        `cal-day--${tier}`,
        isPast   ? 'cal-day--past'     : '',
        isToday  ? 'cal-day--today'    : '',
        isSel    ? 'cal-day--selected' : '',
      ].filter(Boolean).join(' ');
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
    if (!rating) {
      showMsg(message, '評価（星）を選択してください', 'is-error');
      return;
    }
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
      const res = await fetch('/api/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '送信に失敗しました');
      form.setAttribute('hidden', '');
      successEl?.removeAttribute('hidden');
    } catch (err) {
      showMsg(message, err.message, 'is-error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = t('review.form.submit') || '投稿する';
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
      const res = await fetch('/api/newsletter-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, template_name: templateName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '登録に失敗しました');
      showMsg(msgEl, json.message, 'is-success');
      form.querySelector('#newsletter-email').value = '';
    } catch (err) {
      showMsg(msgEl, err.message, 'is-error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = t('newsletter.btn') || '登録する';
    }
  });
}

function showMsg(el, text, cls) {
  if (!el) return;
  el.textContent = text;
  el.className   = `newsletter-message ${cls}`;
  el.removeAttribute('hidden');
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

  const quickCheckin = $('#q-checkin');
  if (quickCheckin) {
    quickCheckin.min = new Date().toISOString().slice(0, 10);
  }

  const heroPhoto = $('.hero-photo');
  if (heroPhoto && window.matchMedia('(min-width: 769px)').matches) {
    window.addEventListener('scroll', () => {
      heroPhoto.style.transform = `translateY(${window.scrollY * 0.3}px)`;
    }, { passive: true });
  }

  // ── Phase 2: 価格カレンダー ──
  initPriceCalendar(pricesData);

  // ── Phase 2: 口コミ投稿フォーム ──
  initReviewForm(siteData.nameEn || 'template');

  // ── Phase 2: メルマガ登録 ──
  initNewsletter(siteData.nameEn || 'template');

  // ── スティッキー予約バー ──
  const stickyBar = $('#sticky-reserve');
  if (stickyBar) {
    const hero = $('.hero');
    const onScrollSticky = () => {
      const threshold = hero ? hero.offsetHeight * 0.75 : window.innerHeight * 0.75;
      const visible = window.scrollY > threshold;
      stickyBar.classList.toggle('is-visible', visible);
      stickyBar.setAttribute('aria-hidden', String(!visible));
    };
    window.addEventListener('scroll', onScrollSticky, { passive: true });
    onScrollSticky();
  }

  // ── SNSシェアボタン ──
  const shareUrl   = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(document.title);
  const btnX = $('#share-x');
  const btnLine = $('#share-line');
  const btnCopy = $('#share-copy');
  if (btnX)    btnX.href = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`;
  if (btnLine) btnLine.href = `https://line.me/R/msg/text/?${shareTitle}%0a${shareUrl}`;
  if (btnCopy) {
    btnCopy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = window.location.href;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      const label = btnCopy.querySelector('.copy-label');
      btnCopy.classList.add('is-copied');
      if (label) label.textContent = 'コピーしました!';
      setTimeout(() => {
        btnCopy.classList.remove('is-copied');
        if (label) label.dataset.i18n ? (label.textContent = t('share.copy')) : (label.textContent = 'リンクをコピー');
      }, 2000);
    });
  }

  // ── ライトボックス ──
  const lightbox   = document.getElementById('lightbox');
  const lbImg      = lightbox?.querySelector('.lightbox-img');
  const lbCaption  = lightbox?.querySelector('.lightbox-caption');
  const lbCounter  = lightbox?.querySelector('.lightbox-counter');
  const lbClose    = lightbox?.querySelector('.lightbox-close');
  const lbPrev     = lightbox?.querySelector('.lightbox-prev');
  const lbNext     = lightbox?.querySelector('.lightbox-next');

  if (lightbox && lbImg) {
    let lbItems = [];
    let lbIdx   = 0;

    const lbShow = () => {
      const item = lbItems[lbIdx];
      lbImg.src      = item.src;
      lbImg.alt      = item.caption || '';
      lbCaption.textContent = item.caption || '';
      lbCounter.textContent = lbItems.length > 1 ? `${lbIdx + 1} / ${lbItems.length}` : '';
      lbPrev.disabled = lbIdx === 0;
      lbNext.disabled = lbIdx === lbItems.length - 1;
    };
    const lbOpen = (items, idx) => {
      lbItems = items; lbIdx = idx;
      lbShow();
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
      if (e.key === 'Escape')      lbClose_();
      if (e.key === 'ArrowLeft'  && lbIdx > 0)                  { lbIdx--; lbShow(); }
      if (e.key === 'ArrowRight' && lbIdx < lbItems.length - 1) { lbIdx++; lbShow(); }
    });

    document.addEventListener('click', e => {
      const trigger = e.target.closest('.lightbox-trigger');
      if (!trigger) return;
      e.preventDefault();
      e.stopPropagation();
      const group = trigger.dataset.group;
      const all   = [...document.querySelectorAll(`.lightbox-trigger[data-group="${group}"]`)];
      const items = all.map(t => ({ src: t.dataset.src, caption: t.dataset.caption || '' }));
      lbOpen(items, all.indexOf(trigger));
    });
  }
});

import site from './cms/site.json';
import newsData from './cms/news.json';
import roomsData from './cms/rooms.json';
import plansData from './cms/plans.json';
import i18nData from './cms/i18n.json';
import pricesData from './cms/prices.json';

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

  const tel = site.telephone;
  const telRaw = site.telephoneRaw;
  const teaserTel = document.getElementById('teaser-tel');
  if (teaserTel) {
    teaserTel.textContent = tel;
    teaserTel.href = `tel:${telRaw}`;
  }
  document.getElementById('teaser-contact-mail')?.setAttribute('href', `mailto:${site.email}`);

  const stickyName = document.getElementById('sticky-site-name');
  if (stickyName) stickyName.textContent = pick(site.name) || site.nameEn || '';
  const stickyTel = document.getElementById('sticky-tel');
  if (stickyTel) { stickyTel.textContent = site.telephone; stickyTel.href = `tel:${site.telephoneRaw}`; }
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
  applyI18n();
  renderNews();
  renderRooms();
  renderPlans();
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
        <button class="lightbox-trigger" type="button" data-group="rooms" data-src="${room.image}" data-caption="${pick(room.name)}" aria-label="${pick(room.name)}を拡大表示"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg></button>
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
        <a href="reserve/?room=${room.id}" class="room-btn">${t('room.btn')}</a>
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
        <a href="reserve/?plan=${plan.id}" class="plan-btn">${t('plan.btn')}</a>
      </div>
    </article>
  `).join('');
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
  initHeader();
  initDrawer();
  initLangButtons();
  initFAQ();
  initScrollReveal();
  // ── Phase 2: 価格カレンダー ──
  initPriceCalendar(pricesData);
  // ── Phase 2: 口コミ投稿フォーム ──
  initReviewForm(site.nameEn || 'ski-mountain-resort');
  // ── Phase 2: メルマガ登録 ──
  initNewsletter(site.nameEn || 'ski-mountain-resort');

  initNewsTickerDuplicate();
  initToTop();
  injectSchema();

  const qCheckin = document.getElementById('q-checkin');
  if (qCheckin) qCheckin.min = new Date().toISOString().slice(0, 10);

  // ── Phase 1: スティッキー予約バー ──
  const stickyBar = document.getElementById('sticky-reserve');
  if (stickyBar) {
    const hero = document.querySelector('.hero');
    const stickyName = document.getElementById('sticky-site-name');
    const stickyTel  = document.getElementById('sticky-tel');
    if (stickyName) stickyName.textContent = pick(site.name) || site.nameEn || '';
    if (stickyTel)  { stickyTel.textContent = site.telephone; stickyTel.href = `tel:${site.telephoneRaw}`; }
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

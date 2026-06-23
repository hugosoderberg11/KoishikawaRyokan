import { CONTACT_EMAIL } from './config.js';

const API_ENDPOINT = '/api/send-inquiry';

function getPrefillParams() {
  const hash = window.location.hash;
  if (hash.includes('?')) {
    return new URLSearchParams(hash.slice(hash.indexOf('?') + 1));
  }
  return new URLSearchParams(window.location.search);
}

function applyUrlPrefill(form) {
  const params = getPrefillParams();
  const intent = params.get('intent');
  const template = params.get('template');
  const plan = params.get('plan');
  const typeSelect = form.querySelector('[name="type"]');
  const templateField = form.querySelector('[name="template_name"]');
  const planField = form.querySelector('[name="plan_name"]');
  const messageField = form.querySelector('[name="message"]');

  if (intent === 'template' || template || plan) {
    if (typeSelect) typeSelect.value = 'テンプレートを購入したい';
    if (templateField && template) templateField.value = template;
    if (planField && plan) planField.value = plan;
    if (messageField && !messageField.value.trim()) {
      const parts = [];
      if (template) parts.push(`希望テンプレート: ${template}`);
      if (plan) parts.push(`希望プラン: ${plan}`);
      messageField.value = parts.join('\n');
    }
  }
}

function setFormState(form, state, message = '') {
  const submitBtn = form.querySelector('[type="submit"]');
  const statusEl = form.querySelector('.form-status') || (() => {
    const el = document.createElement('p');
    el.className = 'form-status';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    form.appendChild(el);
    return el;
  })();

  form.classList.remove('is-success', 'is-error', 'is-loading');
  if (state) form.classList.add(`is-${state}`);
  statusEl.textContent = message;
  statusEl.hidden = !message;

  if (submitBtn) {
    submitBtn.disabled = state === 'loading' || state === 'success';
    if (state !== 'loading' && submitBtn.dataset.defaultLabel) {
      submitBtn.textContent = submitBtn.dataset.defaultLabel;
    }
  }
}

async function submitInquiry(payload) {
  const res = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || '送信に失敗しました');
  return body;
}

export function initContactForm(formSelector = '.contact-form') {
  const form = document.querySelector(formSelector);
  if (!form) return;

  applyUrlPrefill(form);

  const submitBtn = form.querySelector('[type="submit"]');
  if (submitBtn && !submitBtn.dataset.defaultLabel) {
    submitBtn.dataset.defaultLabel = submitBtn.textContent.trim();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const fd = new FormData(form);
    const inquiryType = fd.get('type')?.toString().trim() || '';
    const isPurchase = inquiryType.includes('購入') || fd.get('template_name')?.toString().trim();

    const payload = {
      name: fd.get('name')?.toString().trim(),
      email: fd.get('email')?.toString().trim(),
      phone: fd.get('tel')?.toString().trim() || undefined,
      facility: fd.get('facility')?.toString().trim() || undefined,
      inquiry_type: inquiryType,
      message: fd.get('message')?.toString().trim() || undefined,
      template_name: fd.get('template_name')?.toString().trim() || undefined,
      plan_name: fd.get('plan_name')?.toString().trim() || undefined,
      source: isPurchase ? 'template_purchase' : 'contact',
    };

    setFormState(form, 'loading', '送信中…');
    if (submitBtn) submitBtn.textContent = '送信中…';

    try {
      const result = await submitInquiry(payload);
      setFormState(form, 'success', result.message || 'お問い合わせを送信しました。');
      form.reset();
    } catch (err) {
      setFormState(
        form,
        'error',
        `${err.message || '送信に失敗しました'}。お手数ですが ${CONTACT_EMAIL} まで直接メールしてください。`,
      );
    }
  });
}

export const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

let scriptLoaded = false;

function loadScript() {
  if (scriptLoaded || !RECAPTCHA_SITE_KEY) return Promise.resolve();
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    s.onload = () => { scriptLoaded = true; resolve(); };
    s.onerror = resolve;
    document.head.appendChild(s);
  });
}

export async function getRecaptchaToken(action = 'submit') {
  if (!RECAPTCHA_SITE_KEY) return '';
  await loadScript();
  return new Promise((resolve) => {
    if (typeof grecaptcha === 'undefined') return resolve('');
    grecaptcha.ready(() => {
      grecaptcha.execute(RECAPTCHA_SITE_KEY, { action })
        .then(resolve)
        .catch(() => resolve(''));
    });
  });
}

(() => {
  'use strict';
  const checkout = Object.freeze({
    enabled: true,
    token: 'live_3392a4bb7d056c8b11ac2039d46',
    prices: Object.freeze({
      seo_pro_1_site: 'pri_01m1524hswd2h0aqb9jgdscd6k',
      seo_pro_10_sites: 'pri_01m152bjg4v9e6wcety33fhbgq'
    })
  });
  const checkoutErrorMessage = 'Paddle checkout could not load. Refresh the page or contact support@barndai.com.';
  function announceCheckoutError(link) {
    const status = document.querySelector('[data-paddle-seo-status]');
    if (status) { status.hidden = false; status.textContent = checkoutErrorMessage; }
    link.blur();
  }
  function initializePaddle() {
    if (!window.Paddle || typeof window.Paddle.Initialize !== 'function') return false;
    try { window.Paddle.Initialize({ token: checkout.token }); return true; } catch (error) { return false; }
  }
  function bindCheckoutLinks() {
    const allowedPrices = new Set(Object.values(checkout.prices));
    document.querySelectorAll('[data-paddle-price-id]').forEach((link) => {
      const priceId = link.getAttribute('data-paddle-price-id') || '';
      if (!allowedPrices.has(priceId)) {
        link.setAttribute('aria-disabled', 'true'); link.removeAttribute('data-paddle-price-id');
        link.addEventListener('click', (event) => event.preventDefault(), { once: true }); return;
      }
      link.setAttribute('aria-disabled', checkout.enabled ? 'false' : 'true');
      link.addEventListener('click', (event) => {
        event.preventDefault();
        try {
          if (!window.Paddle || typeof window.Paddle.Checkout?.open !== 'function') throw new Error('paddle_unavailable');
          window.Paddle.Checkout.open({ items: [{ priceId, quantity: 1 }] });
        } catch (error) { announceCheckoutError(link); }
      });
    });
  }
  function start() {
    const initialized = initializePaddle();
    document.documentElement.dataset.paddleSeoClient = initialized ? 'initialized' : 'unavailable';
    document.documentElement.dataset.paddleSeoCheckout = checkout.enabled ? 'open' : 'closed';
    bindCheckoutLinks();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();

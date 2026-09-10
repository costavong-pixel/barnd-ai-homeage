(() => {
  'use strict';
  const VERSION_PATTERN = /^[0-9A-Za-z][0-9A-Za-z._-]{0,63}$/;
  const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
  const validApiUrl = (value) => { try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'api.barndai.com' && !url.username && !url.password && !url.port && !url.hash; } catch (error) { return false; } };
  const form = document.querySelector('[data-seo-pro-download-form]');
  const status = document.querySelector('[data-seo-pro-download-status]');
  const result = document.querySelector('[data-seo-pro-download-result]');
  if (!form || !status || !result) return;
  const setStatus = (message) => { status.textContent = message; };
  const addText = (parent, tag, value) => { const el = document.createElement(tag); el.textContent = value; parent.appendChild(el); return el; };
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); result.replaceChildren(); result.hidden = true; setStatus('Checking your payment and preparing the secure download…');
    const transactionId = form.elements.transaction_id.value.trim();
    const customerEmail = form.elements.customer_email.value.trim().toLowerCase();
    if (!/^txn_[A-Za-z0-9]{8,64}$/.test(transactionId) || !/^\S+@\S+\.\S+$/.test(customerEmail)) { setStatus('Enter the transaction ID and customer email used for payment.'); return; }
    try {
      const response = await fetch('https://api.barndai.com/v1/pro/download/authorize', { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=UTF-8', Accept: 'application/json' }, body: JSON.stringify({ transaction_id: transactionId, customer_email: customerEmail }) });
      const payload = await response.json();
      const expiryMs = typeof payload.expires_at === 'string' ? Date.parse(payload.expires_at) : Number(payload.expires_at) * 1000;
      if (!response.ok || payload.ok !== true || payload.product !== 'barnd-ai-seo-pro' || typeof payload.version !== 'string' || !VERSION_PATTERN.test(payload.version) || typeof payload.sha256 !== 'string' || !SHA256_PATTERN.test(payload.sha256) || !Number.isFinite(expiryMs) || expiryMs <= Date.now() || !validApiUrl(payload.download_url) || !validApiUrl(payload.delivery_url) || typeof payload.license_key !== 'string' || payload.license_key.length < 1) throw new Error('verification_failed');
      const card = document.createElement('section'); card.className = 'notice success'; addText(card, 'h3', 'Your SEO Pro download is ready'); addText(card, 'p', `Version ${payload.version}. The signed ZIP link expires shortly.`); addText(card, 'p', `Package SHA-256: ${payload.sha256}`);
      const delivery = document.createElement('a'); delivery.href = payload.delivery_url; delivery.textContent = 'View secure downloads and license page'; delivery.rel = 'noreferrer'; card.appendChild(delivery);
      addText(card, 'p', 'Keep this page private. It re-checks your entitlement whenever it is opened.'); const link = document.createElement('a'); link.className = 'button'; link.href = payload.download_url; link.textContent = 'Download SEO Pro ZIP'; card.appendChild(link);
      addText(card, 'p', 'Activation key — keep this private and paste it into Barnd AI SEO → SEO Pro:'); const key = document.createElement('input'); key.type = 'text'; key.readOnly = true; key.value = payload.license_key; key.className = 'regular-text'; key.setAttribute('aria-label', 'SEO Pro activation key'); card.appendChild(key);
      const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'button small-button'; copy.textContent = 'Copy activation key'; copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(payload.license_key); setStatus('Activation key copied. Keep it private.'); } catch (error) { key.focus(); key.select(); setStatus('Select the activation key and copy it manually.'); } }); card.appendChild(copy);
      result.appendChild(card); result.hidden = false; setStatus('Payment verified. Install SEO Free first, then install SEO Pro.');
    } catch (error) { setStatus('We could not verify that transaction. Check the ID in your Paddle receipt or contact support.'); }
  });
})();

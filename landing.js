const LANDING_DEFAULTS = {
  youtube: { label: 'YouTube', badge: 'Pengunjung YouTube', accent: '#ff0033' },
  facebook: { label: 'Facebook', badge: 'Pengunjung Facebook', accent: '#1877f2' },
  instagram: { label: 'Instagram', badge: 'Pengunjung Instagram', accent: '#e1306c' },
  tiktok: { label: 'TikTok', badge: 'Pengunjung TikTok', accent: '#111111' }
};

const SOURCE_CODES = {
  youtube: 'YT',
  facebook: 'FB',
  instagram: 'IG',
  tiktok: 'TK'
};

const PRODUCT_CODES = {
  bubur: { code: 'JGB', label: 'Jenang Gemi Bubur' },
  jamu: { code: 'JGJ', label: 'Jenang Gemi Jamu' }
};

const FLAVOR_CODES = {
  Original: 'OR',
  Klepon: 'KL',
  Vanilla: 'VA',
  'Gula Aren': 'GU'
};

const createSessionId = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const ANALYTICS_DEVICE_COOKIE = 'jg_analytics_device_id';
const ANALYTICS_DEVICE_MAX_AGE = 60 * 60 * 24 * 365 * 2;

const createAnalyticsDeviceId = () => {
  if (window.crypto?.randomUUID) return `device-${window.crypto.randomUUID()}`;
  return `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const readCookie = (name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
};

const resolveAnalyticsCookieDomain = () => {
  const host = window.location.hostname.toLowerCase();
  if (host === 'jenanggemi.com' || host.endsWith('.jenanggemi.com')) {
    return '.jenanggemi.com';
  }
  return '';
};

const writeCookie = (name, value, maxAgeSeconds) => {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`
  ];
  const domain = resolveAnalyticsCookieDomain();
  if (domain) parts.push(`Domain=${domain}`);
  if (window.location.protocol === 'https:') parts.push('Secure');
  document.cookie = parts.join('; ');
};

const getAnalyticsDeviceId = () => {
  const existing = readCookie(ANALYTICS_DEVICE_COOKIE);
  if (existing) return existing;
  const next = createAnalyticsDeviceId();
  writeCookie(ANALYTICS_DEVICE_COOKIE, next, ANALYTICS_DEVICE_MAX_AGE);
  return next;
};

const formatCurrency = (value) => `Rp ${Number(value).toLocaleString('id-ID')}`;
const getPackQuantity = (label = '') => {
  const match = label.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};
const getComparisonPackPrice = ({ label = '', price = 0, basePrice = 0 }) => {
  const quantity = getPackQuantity(label);
  if (!basePrice || quantity <= 15 || quantity % 15 !== 0) return null;
  const comparisonPrice = basePrice * (quantity / 15);
  return comparisonPrice > price ? comparisonPrice : null;
};
const buildPriceMarkup = ({ price = 0, comparisonPrice = null }) => (
  comparisonPrice
    ? `<span class="price-compare">${formatCurrency(comparisonPrice)}</span><span class="price-current">${formatCurrency(price)}</span>`
    : `<span class="price-current">${formatCurrency(price)}</span>`
);
const CHECKOUT_STORED_ADDRESS_KEYS = ['gemi_checkout_address_v2', 'gemi_checkout_address'];

const clearSavedCheckoutAddress = () => {
  try {
    CHECKOUT_STORED_ADDRESS_KEYS.forEach((key) => {
      window.localStorage.removeItem(key);
    });
  } catch (_) {}
};

const ensureCheckoutAddressModal = () => {
  let modal = document.getElementById('checkout-address-modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'checkout-address-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="checkout-address-backdrop" data-close-address-modal></div>
    <div class="checkout-address-card" role="dialog" aria-modal="true" aria-labelledby="checkout-address-title">
      <button class="checkout-address-close" type="button" aria-label="Tutup" data-close-address-modal>x</button>
      <span class="eyebrow">Alamat Pengiriman</span>
      <h2 id="checkout-address-title">Mau dikirim ke mana?</h2>
      <p>Tulis nama penerima dan alamat lengkap.</p>
      <label class="checkout-address-field" for="checkout-full-name-input">
        <span>Nama lengkap penerima</span>
        <input id="checkout-full-name-input" type="text" autocomplete="name" placeholder="Nama lengkap penerima paket">
      </label>
      <label class="checkout-address-field" for="checkout-address-input">
        <span>Alamat lengkap</span>
        <textarea id="checkout-address-input" rows="4" autocomplete="off" placeholder="Nama jalan, nomor rumah, patokan, kecamatan, kota, kode pos"></textarea>
      </label>
      <div class="checkout-address-actions">
        <button class="btn btn-primary" type="button" data-submit-address disabled>Lanjut ke WhatsApp</button>
      </div>
      <small data-address-status></small>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #checkout-address-modal { position: fixed; inset: 0; z-index: 10000; display: none; align-items: center; justify-content: center; padding: 20px; }
    #checkout-address-modal.active { display: flex; }
    .checkout-address-backdrop { position: absolute; inset: 0; background: rgba(20, 18, 14, 0.58); backdrop-filter: blur(8px); }
    .checkout-address-card { position: relative; z-index: 1; width: min(100%, 520px); background: #fffaf3; border: 1px solid rgba(69, 55, 39, 0.16); border-radius: 18px; box-shadow: 0 24px 70px rgba(35, 27, 18, 0.22); padding: 28px; color: var(--text, #241b12); }
    .checkout-address-card h2 { margin: 8px 0 10px; font-size: 26px; line-height: 1.15; }
    .checkout-address-card p { margin: 0 0 18px; color: var(--muted, #6f6255); line-height: 1.5; }
    .checkout-address-field { display: block; margin-top: 12px; }
    .checkout-address-field span { display: block; margin-bottom: 7px; font-weight: 800; font-size: 13px; }
    .checkout-address-card input,
    .checkout-address-card textarea { width: 100%; border: 1px solid rgba(69, 55, 39, 0.22); border-radius: 12px; padding: 14px; font: inherit; line-height: 1.45; background: #fff; color: inherit; box-sizing: border-box; }
    .checkout-address-card textarea { min-height: 118px; resize: vertical; }
    .checkout-address-card input:focus,
    .checkout-address-card textarea:focus { outline: 2px solid rgba(99, 191, 71, 0.38); border-color: rgba(99, 191, 71, 0.75); }
    .checkout-address-actions { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
    .checkout-address-actions .btn { flex: 1 1 180px; justify-content: center; }
    .checkout-address-actions .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .checkout-address-close { position: absolute; top: 14px; right: 14px; width: 34px; height: 34px; border-radius: 999px; border: 1px solid rgba(69, 55, 39, 0.14); background: #fff; color: inherit; font-weight: 800; cursor: pointer; }
    .checkout-address-card small { display: block; min-height: 18px; margin-top: 12px; color: var(--muted, #6f6255); }
    @media (max-width: 560px) {
      #checkout-address-modal { align-items: flex-end; padding: 12px; }
      .checkout-address-card { padding: 24px 18px 18px; border-radius: 18px; }
      .checkout-address-card h2 { font-size: 22px; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(modal);
  return modal;
};

const openCheckoutAddressModal = ({ onSubmit }) => {
  const modal = ensureCheckoutAddressModal();
  const nameInput = modal.querySelector('#checkout-full-name-input');
  const addressInput = modal.querySelector('#checkout-address-input');
  const submitBtn = modal.querySelector('[data-submit-address]');
  const status = modal.querySelector('[data-address-status]');
  const closers = modal.querySelectorAll('[data-close-address-modal]');

  const closeModal = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  const syncSubmit = () => {
    submitBtn.disabled = !(nameInput.value || '').trim() || !(addressInput.value || '').trim();
  };

  clearSavedCheckoutAddress();
  nameInput.value = '';
  addressInput.value = '';
  if (status) status.textContent = '';
  syncSubmit();

  nameInput.oninput = syncSubmit;
  addressInput.oninput = syncSubmit;
  closers.forEach((closer) => {
    closer.onclick = closeModal;
  });

  submitBtn.onclick = () => {
    const fullName = (nameInput.value || '').trim();
    const address = (addressInput.value || '').trim();
    if (!fullName || !address) {
      syncSubmit();
      (fullName ? addressInput : nameInput).focus();
      return;
    }
    closeModal();
    onSubmit({ fullName, address });
  };

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  window.setTimeout(() => nameInput.focus(), 50);
};
const testimonialImageModules = import.meta.glob('./Media/Testimonials/*.png', {
  eager: true,
  import: 'default'
});

document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-landing-page]');
  if (!root) return;

  const sourceKey = root.dataset.source || 'youtube';
  const affiliateCode = (root.dataset.affiliateCode || '').trim().toUpperCase();
  const affiliateName = (root.dataset.affiliateName || '').trim();
  const trafficKind = affiliateCode ? 'affiliate' : ((root.dataset.trafficKind || 'landing').trim().toLowerCase() || 'landing');
  const sourceConfig = LANDING_DEFAULTS[sourceKey] || {
    label: sourceKey,
    badge: `Pengunjung ${sourceKey}`,
    accent: '#63bf47'
  };
  const analyticsEndpoint = root.dataset.analyticsEndpoint || `${window.location.origin}/analytics.php`;
  const sessionId = createSessionId();
  const deviceId = getAnalyticsDeviceId();
  const visitStartedAt = Date.now();
  let lastTrackedElapsedMs = 0;
  const pathname = window.location.pathname.toLowerCase();

  const resolveProductMeta = () => {
    if (pathname.includes('jamu')) return PRODUCT_CODES.jamu;
    return PRODUCT_CODES.bubur;
  };

  const productMeta = resolveProductMeta();

  document.documentElement.style.setProperty('--landing-accent', sourceConfig.accent);

  root.querySelectorAll('[data-source-label]').forEach((node) => {
    node.textContent = sourceConfig.label;
  });

  root.querySelectorAll('[data-source-badge]').forEach((node) => {
    node.textContent = sourceConfig.badge;
  });

  const trackEvent = (eventType, extra = {}, useBeacon = false) => {
    const payload = {
      event_type: eventType,
      session_id: sessionId,
      device_id: deviceId,
      source: sourceKey,
      traffic_kind: trafficKind,
      affiliate_code: affiliateCode,
      affiliate_name: affiliateName,
      page_path: window.location.pathname,
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer || '',
      occurred_at: new Date().toISOString(),
      ...extra
    };

    if (useBeacon && navigator.sendBeacon) {
      const body = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(analyticsEndpoint, body);
      return;
    }

    fetch(analyticsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
  };

  const trackElapsedTime = (force = false) => {
    const elapsedMs = Date.now() - visitStartedAt;
    if (!force && elapsedMs - lastTrackedElapsedMs < 15000) return;
    lastTrackedElapsedMs = elapsedMs;
    trackEvent('time_spent', { elapsed_ms: elapsedMs }, true);
  };

  trackEvent('page_view');

  const quickNavToggle = document.querySelector('[data-quicknav-toggle]');
  const quickNavMenu = document.querySelector('[data-quicknav-menu]');
  const quickNavLinks = document.querySelectorAll('[data-quicknav-link]');

  const setQuickNav = (isOpen) => {
    quickNavMenu?.classList.toggle('is-open', isOpen);
    quickNavToggle?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  };

  quickNavToggle?.addEventListener('click', () => {
    setQuickNav(!quickNavMenu?.classList.contains('is-open'));
  });

  quickNavLinks.forEach((link) => {
    link.addEventListener('click', () => {
      setQuickNav(false);
      trackEvent('quick_nav_click', {
        section_id: link.getAttribute('href') || '',
        label: link.textContent?.trim() || ''
      });
    });
  });

  document.addEventListener('click', (event) => {
    if (!quickNavMenu?.classList.contains('is-open')) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (!quickNavMenu.contains(target) && !quickNavToggle?.contains(target)) {
      setQuickNav(false);
    }
  });

  const packageCards = document.querySelectorAll('[data-package-card]');
  const flavorCards = document.querySelectorAll('[data-flavor-card]');
  const packageNameNode = document.querySelector('[data-selected-package]');
  const packagePriceNode = document.querySelector('[data-selected-price]');
  const flavorNameNode = document.querySelector('[data-selected-flavor]');
  const checkoutButtons = document.querySelectorAll('[data-checkout-button]');

  const packageState = {
    label: packageCards[0]?.dataset.packageLabel || '15 Sachet',
    price: packageCards[0]?.dataset.packagePrice || '120000'
  };
  const basePackagePrice = parseInt(
    Array.from(packageCards).find((card) => getPackQuantity(card.dataset.packageLabel || '') === 15)?.dataset.packagePrice || '0',
    10
  );

  const flavorState = {
    label: flavorCards[0]?.dataset.flavorLabel || 'Original'
  };

  const getPackageSize = () => {
    const match = packageState.label.match(/\d+/);
    return match ? match[0] : '';
  };

  const getFlavorCode = () => FLAVOR_CODES[flavorState.label] || 'OR';
  const getSourceCode = () => SOURCE_CODES[sourceKey] || 'NA';
  const buildOrderCode = () => `${getSourceCode()}${productMeta.code}${getPackageSize()}${getFlavorCode()}`;

  const syncPackageUI = () => {
    packageCards.forEach((card) => {
      const isActive = card.dataset.packageLabel === packageState.label;
      card.classList.toggle('is-active', isActive);
      card.classList.toggle('active', isActive);

      const priceNode = card.querySelector('.pack-val');
      const packPrice = parseInt(card.dataset.packagePrice || '0', 10);
      const comparisonPrice = getComparisonPackPrice({
        label: card.dataset.packageLabel || '',
        price: packPrice,
        basePrice: basePackagePrice
      });

      if (priceNode) {
        priceNode.innerHTML = buildPriceMarkup({ price: packPrice, comparisonPrice });
      }
    });

    if (packageNameNode) packageNameNode.textContent = packageState.label;
    if (packagePriceNode) {
      packagePriceNode.innerHTML = buildPriceMarkup({
        price: parseInt(packageState.price, 10),
        comparisonPrice: getComparisonPackPrice({
          label: packageState.label,
          price: parseInt(packageState.price, 10),
          basePrice: basePackagePrice
        })
      });
    }
    if (flavorNameNode) flavorNameNode.textContent = flavorState.label;

    flavorCards.forEach((card) => {
      const isActive = card.dataset.flavorLabel === flavorState.label;
      card.classList.toggle('is-active', isActive);
      card.classList.toggle('active', isActive);
    });

    checkoutButtons.forEach((button) => {
      button.dataset.packageLabel = packageState.label;
      button.dataset.packagePrice = packageState.price;
      button.dataset.flavorLabel = flavorState.label;
    });
  };

  packageCards.forEach((card) => {
    card.addEventListener('click', () => {
      packageState.label = card.dataset.packageLabel || packageState.label;
      packageState.price = card.dataset.packagePrice || packageState.price;
      syncPackageUI();
      trackEvent('package_select', {
        package_label: packageState.label,
        package_price: packageState.price
      });
    });
  });

  flavorCards.forEach((card) => {
    card.addEventListener('click', () => {
      flavorState.label = card.dataset.flavorLabel || flavorState.label;
      syncPackageUI();
      trackEvent('flavor_select', {
        flavor_label: flavorState.label,
        package_label: packageState.label,
        package_price: packageState.price
      });
    });
  });

  syncPackageUI();

  document.querySelectorAll('[data-order-scroll]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelector('#order')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      trackEvent('order_now_click', {
        cta_location: button.dataset.ctaLocation || 'unknown',
        flavor_label: flavorState.label,
        package_label: packageState.label,
        package_price: packageState.price
      });
    });
  });

  const buildWhatsappMessage = ({ buttonLabel, fullName, address }) => {
    const orderCode = buildOrderCode();
    const lines = [
      `Halo Admin Jenang Gemi, saya ingin order ${productMeta.label}.`,
      '',
      ...(affiliateCode ? [`Kode affiliate: ${affiliateCode}${affiliateName ? ` (${affiliateName})` : ''}`] : []),
      `Kode order: ${orderCode}`,
      `Sumber traffic: ${sourceConfig.label}`,
      `Landing page: ${window.location.pathname}`,
      `Rasa yang dipilih: ${flavorState.label}`,
      `Paket yang dipilih: ${packageState.label}`,
      `Harga: ${formatCurrency(packageState.price)}`,
      `Nama penerima: ${fullName}`,
      `Alamat pengiriman: ${address}`,
      `Tombol checkout: ${buttonLabel}`
    ];

    return lines.join('\n');
  };

  checkoutButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const buttonLabel = button.dataset.buttonLabel || button.textContent?.trim() || 'Checkout';
      openCheckoutAddressModal({
        onSubmit: ({ fullName, address }) => {
          const message = buildWhatsappMessage({ buttonLabel, fullName, address });
          const orderCode = buildOrderCode();
          trackEvent('checkout_click', {
            cta_location: button.dataset.ctaLocation || 'unknown',
            product_code: productMeta.code,
            product_label: productMeta.label,
            flavor_label: flavorState.label,
            flavor_code: getFlavorCode(),
            package_label: packageState.label,
            package_size: getPackageSize(),
            package_price: packageState.price,
            order_code: orderCode
          });
          window.open(
            `https://api.whatsapp.com/send?phone=6285842833973&text=${encodeURIComponent(message)}`,
            '_blank',
            'noopener'
          );
        }
      });
    });
  });

  document.querySelectorAll('[data-track-link]').forEach((link) => {
    link.addEventListener('click', () => {
      trackEvent(link.dataset.trackLink || 'link_click', {
        href: link.getAttribute('href') || '',
        label: link.textContent?.trim() || ''
      });
    });
  });

  const testimonialSources = Object.entries(testimonialImageModules)
    .map(([path, src]) => {
      const match = path.match(/Testimonial (\d+)\.png$/);
      const number = match ? Number(match[1]) : 0;
      return {
        src,
        number,
        alt: `Testimoni pelanggan Jenang Gemi ${number}`,
        label: `Testimonial ${number}`
      };
    })
    .sort((a, b) => a.number - b.number);

  const carouselEls = document.querySelectorAll('.testimonial-carousel');
  const lightbox = document.getElementById('testimonial-lightbox');
  const lightboxTrack = document.getElementById('testimonial-lightbox-track');
  const lightboxCounter = document.getElementById('testimonial-lightbox-counter');
  const lightboxBackBtn = document.getElementById('testimonial-back-btn');

  if (carouselEls.length && testimonialSources.length) {
    const testimonialGroups = [
      testimonialSources.filter((_, index) => index % 2 === 0),
      testimonialSources.filter((_, index) => index % 2 === 1)
    ];

    const carouselStates = testimonialGroups.map(() => ({ index: 0 }));
    const carouselTimers = [];
    const lightboxState = { groupIndex: 0, itemIndex: 0 };

    const updateLightboxPosition = () => {
      if (!lightboxTrack) return;
      lightboxTrack.style.transform = `translateX(-${lightboxState.itemIndex * 100}%)`;
      lightboxTrack.style.transition = 'transform 0.35s ease';
      if (lightboxCounter) {
        lightboxCounter.textContent = `${lightboxState.itemIndex + 1} / ${testimonialGroups[lightboxState.groupIndex].length}`;
      }
    };

    const renderLightbox = () => {
      if (!lightboxTrack) return;
      const items = testimonialGroups[lightboxState.groupIndex];
      lightboxTrack.innerHTML = items.map((item) => `
        <div class="testimonial-lightbox-slide">
          <div class="testimonial-lightbox-media">
            <img src="${item.src}" alt="${item.alt}">
          </div>
        </div>
      `).join('');
      updateLightboxPosition();
    };

    const openLightbox = (groupIndex, itemIndex) => {
      lightboxState.groupIndex = groupIndex;
      lightboxState.itemIndex = itemIndex;
      renderLightbox();
      lightbox?.classList.add('active');
      lightbox?.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
      lightbox?.classList.remove('active');
      lightbox?.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    const setCarouselIndex = (groupIndex, nextIndex) => {
      const items = testimonialGroups[groupIndex];
      const normalizedIndex = (nextIndex + items.length) % items.length;
      carouselStates[groupIndex].index = normalizedIndex;

      const carouselEl = carouselEls[groupIndex];
      const track = carouselEl?.querySelector('.testimonial-track');
      const dots = carouselEl?.querySelectorAll('.testimonial-dot');
      if (track) track.style.transform = `translateX(-${normalizedIndex * 100}%)`;
      dots?.forEach((dot, index) => dot.classList.toggle('active', index === normalizedIndex));
    };

    const startCarouselAutoRotate = (groupIndex) => {
      window.clearInterval(carouselTimers[groupIndex]);
      carouselTimers[groupIndex] = window.setInterval(() => {
        setCarouselIndex(groupIndex, carouselStates[groupIndex].index + 1);
      }, 3400 + (groupIndex * 600));
    };

    carouselEls.forEach((carouselEl, groupIndex) => {
      const track = carouselEl.querySelector('.testimonial-track');
      const dots = carouselEl.querySelector('.testimonial-dots');
      const items = testimonialGroups[groupIndex];

      if (track) {
        track.innerHTML = items.map((item, itemIndex) => `
          <div class="testimonial-slide">
            <button class="testimonial-media-card" type="button" data-open-lightbox="${itemIndex}">
              <img src="${item.src}" alt="${item.alt}">
              <span class="testimonial-slide-label">${item.label} • Klik untuk fullscreen</span>
            </button>
          </div>
        `).join('');
      }

      if (dots) {
        dots.innerHTML = items.map((_, itemIndex) => `
          <button class="testimonial-dot${itemIndex === 0 ? ' active' : ''}" type="button" aria-label="Lihat testimonial ${itemIndex + 1}"></button>
        `).join('');
      }

      carouselEl.querySelectorAll('.testimonial-dot').forEach((dot, itemIndex) => {
        dot.addEventListener('click', () => setCarouselIndex(groupIndex, itemIndex));
      });

      carouselEl.querySelectorAll('[data-open-lightbox]').forEach((buttonEl) => {
        buttonEl.addEventListener('click', () => {
          openLightbox(groupIndex, Number(buttonEl.getAttribute('data-open-lightbox')) || 0);
        });
      });

      carouselEl.addEventListener('mouseenter', () => window.clearInterval(carouselTimers[groupIndex]));
      carouselEl.addEventListener('mouseleave', () => startCarouselAutoRotate(groupIndex));
      carouselEl.addEventListener('focusin', () => window.clearInterval(carouselTimers[groupIndex]));
      carouselEl.addEventListener('focusout', () => startCarouselAutoRotate(groupIndex));

      setCarouselIndex(groupIndex, 0);
      startCarouselAutoRotate(groupIndex);
    });

    lightbox?.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.dataset.closeLightbox === 'true') {
        closeLightbox();
      }
    });

    lightboxBackBtn?.addEventListener('click', closeLightbox);

    document.addEventListener('keydown', (event) => {
      if (!lightbox?.classList.contains('active')) return;

      if (event.key === 'Escape') {
        closeLightbox();
        return;
      }

      const items = testimonialGroups[lightboxState.groupIndex];
      if (event.key === 'ArrowRight') {
        lightboxState.itemIndex = (lightboxState.itemIndex + 1) % items.length;
        updateLightboxPosition();
      } else if (event.key === 'ArrowLeft') {
        lightboxState.itemIndex = (lightboxState.itemIndex - 1 + items.length) % items.length;
        updateLightboxPosition();
      }
    });
  }

  window.setInterval(() => trackElapsedTime(false), 30000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      trackElapsedTime(true);
    }
  });

  window.addEventListener('beforeunload', () => {
    trackElapsedTime(true);
  });
});

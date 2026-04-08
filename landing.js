const LANDING_DEFAULTS = {
  youtube: { label: 'YouTube', badge: 'Pengunjung YouTube', accent: '#ff0033' },
  facebook: { label: 'Facebook', badge: 'Pengunjung Facebook', accent: '#1877f2' },
  instagram: { label: 'Instagram', badge: 'Pengunjung Instagram', accent: '#e1306c' },
  tiktok: { label: 'TikTok', badge: 'Pengunjung TikTok', accent: '#111111' }
};

const createSessionId = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const formatCurrency = (value) => `Rp ${Number(value).toLocaleString('id-ID')}`;

document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-landing-page]');
  if (!root) return;

  const sourceKey = root.dataset.source || 'youtube';
  const sourceConfig = LANDING_DEFAULTS[sourceKey] || {
    label: sourceKey,
    badge: `Pengunjung ${sourceKey}`,
    accent: '#63bf47'
  };
  const analyticsEndpoint = root.dataset.analyticsEndpoint || `${window.location.origin}/analytics.php`;
  const sessionId = createSessionId();
  const visitStartedAt = Date.now();
  let lastTrackedElapsedMs = 0;

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
      source: sourceKey,
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

  const flavorState = {
    label: flavorCards[0]?.dataset.flavorLabel || 'Original'
  };

  const syncPackageUI = () => {
    packageCards.forEach((card) => {
      const isActive = card.dataset.packageLabel === packageState.label;
      card.classList.toggle('is-active', isActive);
      card.classList.toggle('active', isActive);
    });

    if (packageNameNode) packageNameNode.textContent = packageState.label;
    if (packagePriceNode) packagePriceNode.textContent = formatCurrency(packageState.price);
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

  const buildWhatsappMessage = ({ buttonLabel }) => {
    const lines = [
      'Halo Admin Jenang Gemi, saya ingin order Jenang Gemi Bubur.',
      '',
      `Sumber traffic: ${sourceConfig.label}`,
      `Landing page: ${window.location.pathname}`,
      `Rasa yang dipilih: ${flavorState.label}`,
      `Paket yang dipilih: ${packageState.label}`,
      `Harga: ${formatCurrency(packageState.price)}`,
      `Tombol checkout: ${buttonLabel}`
    ];

    return lines.join('\n');
  };

  checkoutButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const buttonLabel = button.dataset.buttonLabel || button.textContent?.trim() || 'Checkout';
      const message = buildWhatsappMessage({ buttonLabel });
      trackEvent('checkout_click', {
        cta_location: button.dataset.ctaLocation || 'unknown',
        flavor_label: flavorState.label,
        package_label: packageState.label,
        package_price: packageState.price
      });
      window.open(
        `https://api.whatsapp.com/send?phone=6285842833973&text=${encodeURIComponent(message)}`,
        '_blank',
        'noopener'
      );
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

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
const testimonialImageModules = import.meta.glob('./Media/Testimonials/*.png', {
  eager: true,
  import: 'default'
});

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

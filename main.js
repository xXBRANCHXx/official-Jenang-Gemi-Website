const buburQuizImage = new URL('./Media/Reseller Jenang Gemi Images (3).png', import.meta.url).href;
const jamuQuizImage = new URL('./Media/Reseller Jenang Gemi Images (4).png', import.meta.url).href;

document.addEventListener('DOMContentLoaded', () => {
  // --- Cart System ---
  let cart = JSON.parse(localStorage.getItem('gemi_cart_v10')) || [];
  const sidebar = document.getElementById('sidebar-v9');
  const overlay = document.getElementById('global-overlay');
  const cartBtn = document.querySelector('.cart-v9-btn');
  const closeBtn = document.querySelector('.close-v9');
  const nav = document.querySelector('.nav-v9');
  const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  const toggleMobileNav = (show) => {
    nav?.classList.toggle('menu-open', show);
    mobileNavToggle?.setAttribute('aria-expanded', show ? 'true' : 'false');
  };

  const updateV9Count = () => {
    const totalCount = cart.reduce((acc, it) => acc + it.quantity, 0);
    const countEl = document.querySelector('.count-v9');
    if (countEl) countEl.innerText = totalCount;
  };

  const renderV9Cart = () => {
    const list = document.getElementById('list-v9');
    const totalEl = document.getElementById('total-v9');
    if (!list || !totalEl) return;

    list.innerHTML = '';
    let subtotal = 0;

    cart.forEach((item, index) => {
      subtotal += item.price * item.quantity;
      const row = document.createElement('div');
      row.style.cssText = 'padding: 20px 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;';
      row.innerHTML = `
        <div style="flex: 1;">
          <h4 style="font-size: 16px;">${item.name}</h4>
          <p style="font-size: 13px; color: var(--muted);">${item.flavor ? `${item.flavor} | ` : ''}${item.qtyLabel}</p>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 12px; background: #f5f5f7; padding: 4px 12px; border-radius: 100px;">
            <button onclick="changeQty(${index}, -1)" style="font-weight: 800;">-</button>
            <span style="font-weight: 700;">${item.quantity}</span>
            <button onclick="changeQty(${index}, 1)" style="font-weight: 800;">+</button>
          </div>
          <span style="font-weight: 800; min-width: 80px; text-align: right;">Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</span>
        </div>
      `;
      list.appendChild(row);
    });

    totalEl.innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;
    localStorage.setItem('gemi_cart_v10', JSON.stringify(cart));
  };

  window.changeQty = (index, delta) => {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    renderV9Cart();
    updateV9Count();
  };

  const toggleSidebar = (show) => {
    sidebar?.classList.toggle('active', show);
    overlay?.classList.toggle('active', show);
    document.body.style.overflow = show ? 'hidden' : '';
  };

  cartBtn?.addEventListener('click', () => toggleSidebar(true));
  closeBtn?.addEventListener('click', () => toggleSidebar(false));
  overlay?.addEventListener('click', () => {
    toggleSidebar(false);
    toggleMobileNav(false);
  });

  mobileNavToggle?.addEventListener('click', () => {
    toggleMobileNav(!nav?.classList.contains('menu-open'));
  });

  navLinks?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => toggleMobileNav(false));
  });

  document.addEventListener('click', (event) => {
    if (!nav?.classList.contains('menu-open')) return;
    const target = event.target;
    if (target instanceof Node && !nav.contains(target)) {
      toggleMobileNav(false);
    }
  });

  document.querySelector('.checkout-v9')?.addEventListener('click', () => {
    if (cart.length === 0) return;
    let msg = 'Halo Admin Jenang Gemi, pemesanan baru saya:\n\n';
    let subtotal = 0;
    cart.forEach((it, i) => {
      subtotal += it.price * it.quantity;
      msg += `${i + 1}. *${it.name}* ${it.flavor ? `(Rasa: ${it.flavor}) ` : ''}(${it.qtyLabel})\n   Harga: Rp ${it.price.toLocaleString('id-ID')}\n   Jumlah: ${it.quantity}\n\n`;
    });
    msg += `*Total Keseluruhan: Rp ${subtotal.toLocaleString('id-ID')}*`;
    window.open(`https://api.whatsapp.com/send?phone=6285842833973&text=${encodeURIComponent(msg)}`, '_blank');
  });

  // --- Testimonials ---
  const testimonialImageModules = import.meta.glob('./Media/Testimonials/*.png', {
    eager: true,
    import: 'default'
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

  const testimonialGroups = [
    testimonialSources.filter((_, index) => index % 2 === 0),
    testimonialSources.filter((_, index) => index % 2 === 1)
  ];

  const carouselStates = testimonialGroups.map(() => ({ index: 0 }));
  const carouselTimers = [];
  const carouselEls = document.querySelectorAll('.testimonial-carousel');
  const lightbox = document.getElementById('testimonial-lightbox');
  const lightboxTrack = document.getElementById('testimonial-lightbox-track');
  const lightboxStage = document.getElementById('testimonial-lightbox-stage');
  const lightboxCounter = document.getElementById('testimonial-lightbox-counter');
  const lightboxBackBtn = document.getElementById('testimonial-back-btn');

  const lightboxState = {
    groupIndex: 0,
    itemIndex: 0,
    scale: 1,
    translateX: 0,
    translateY: 0,
    startTranslateX: 0,
    startTranslateY: 0,
    swipeDeltaX: 0,
    swipeActive: false,
    panActive: false,
    pinchActive: false,
    pointerActive: false,
    startX: 0,
    startY: 0,
    touchMoved: false,
    lastTapTime: 0,
    pinchStartDistance: 0,
    pinchStartScale: 1,
    wheelAccumX: 0,
    wheelResetTimer: null,
    wheelGestureLocked: false
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const getPanLimits = () => {
    const activeSlide = lightboxTrack?.children[lightboxState.itemIndex];
    const media = activeSlide?.querySelector('.testimonial-lightbox-media');
    if (!media || lightboxState.scale <= 1) return { x: 0, y: 0 };

    const maxX = Math.max(0, ((media.clientWidth * lightboxState.scale) - media.clientWidth) / 2);
    const maxY = Math.max(0, ((media.clientHeight * lightboxState.scale) - media.clientHeight) / 2);
    return { x: maxX, y: maxY };
  };

  const applyZoom = () => {
    lightboxTrack?.querySelectorAll('.testimonial-lightbox-media img').forEach((img, index) => {
      if (index === lightboxState.itemIndex) {
        img.style.transform = `translate(${lightboxState.translateX}px, ${lightboxState.translateY}px) scale(${lightboxState.scale})`;
      } else {
        img.style.transform = 'translate(0px, 0px) scale(1)';
      }
    });
  };

  const resetZoom = () => {
    lightboxState.scale = 1;
    lightboxState.translateX = 0;
    lightboxState.translateY = 0;
    lightboxState.startTranslateX = 0;
    lightboxState.startTranslateY = 0;
    lightboxState.pointerActive = false;
    lightboxStage?.classList.remove('is-panning');
    applyZoom();
  };

  const updateLightboxPosition = (dragOffset = 0) => {
    if (!lightboxTrack) return;
    lightboxTrack.style.transition = dragOffset === 0 ? 'transform 0.35s ease' : 'none';
    lightboxTrack.style.transform = `translateX(calc(${-lightboxState.itemIndex * 100}% + ${dragOffset}px))`;
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

    applyZoom();
    updateLightboxPosition();
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

  const openLightbox = (groupIndex, itemIndex) => {
    lightboxState.groupIndex = groupIndex;
    lightboxState.itemIndex = itemIndex;
    renderLightbox();
    resetZoom();
    lightbox?.classList.add('active');
    lightbox?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    lightbox?.classList.remove('active');
    lightbox?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    resetZoom();
  };

  const changeLightboxItem = (direction) => {
    const items = testimonialGroups[lightboxState.groupIndex];
    lightboxState.itemIndex = (lightboxState.itemIndex + direction + items.length) % items.length;
    resetZoom();
    updateLightboxPosition();
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
      dot.addEventListener('click', () => {
        setCarouselIndex(groupIndex, itemIndex);
        startCarouselAutoRotate(groupIndex);
      });
    });

    carouselEl.querySelectorAll('[data-open-lightbox]').forEach((buttonEl) => {
      buttonEl.addEventListener('click', () => {
        openLightbox(groupIndex, Number(buttonEl.getAttribute('data-open-lightbox')));
      });
    });

    carouselEl.addEventListener('mouseenter', () => window.clearInterval(carouselTimers[groupIndex]));
    carouselEl.addEventListener('mouseleave', () => startCarouselAutoRotate(groupIndex));
    carouselEl.addEventListener('focusin', () => window.clearInterval(carouselTimers[groupIndex]));
    carouselEl.addEventListener('focusout', () => startCarouselAutoRotate(groupIndex));

    setCarouselIndex(groupIndex, 0);
    startCarouselAutoRotate(groupIndex);
  });

  lightboxBackBtn?.addEventListener('click', closeLightbox);
  lightbox?.querySelector('[data-close-lightbox="true"]')?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    if (!lightbox?.classList.contains('active')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') changeLightboxItem(-1);
    if (event.key === 'ArrowRight') changeLightboxItem(1);
  });

  lightboxTrack?.addEventListener('dblclick', () => {
    if (lightboxState.scale > 1) {
      resetZoom();
      return;
    }
    lightboxState.scale = 2.5;
    applyZoom();
  });

  lightboxStage?.addEventListener('pointerdown', (event) => {
    if (!lightbox?.classList.contains('active') || lightboxState.scale <= 1) return;
    lightboxState.pointerActive = true;
    lightboxState.startX = event.clientX;
    lightboxState.startY = event.clientY;
    lightboxState.startTranslateX = lightboxState.translateX;
    lightboxState.startTranslateY = lightboxState.translateY;
    lightboxStage.classList.add('is-panning');
  });

  lightboxStage?.addEventListener('pointermove', (event) => {
    if (!lightboxState.pointerActive || lightboxState.scale <= 1) return;
    const deltaX = event.clientX - lightboxState.startX;
    const deltaY = event.clientY - lightboxState.startY;
    const limits = getPanLimits();
    lightboxState.translateX = clamp(lightboxState.startTranslateX + deltaX, -limits.x, limits.x);
    lightboxState.translateY = clamp(lightboxState.startTranslateY + deltaY, -limits.y, limits.y);
    applyZoom();
  });

  const stopPointerPan = () => {
    lightboxState.pointerActive = false;
    lightboxStage?.classList.remove('is-panning');
  };

  lightboxStage?.addEventListener('pointerup', stopPointerPan);
  lightboxStage?.addEventListener('pointercancel', stopPointerPan);
  lightboxStage?.addEventListener('pointerleave', stopPointerPan);

  lightboxStage?.addEventListener('wheel', (event) => {
    if (!lightbox?.classList.contains('active')) return;

    if (lightboxState.scale > 1) {
      const limits = getPanLimits();
      lightboxState.translateX = clamp(lightboxState.translateX - event.deltaX, -limits.x, limits.x);
      lightboxState.translateY = clamp(lightboxState.translateY - event.deltaY, -limits.y, limits.y);
      applyZoom();
      event.preventDefault();
      return;
    }

    if (Math.abs(event.deltaX) < Math.abs(event.deltaY) || Math.abs(event.deltaX) < 20) return;

    if (lightboxState.wheelGestureLocked) {
      window.clearTimeout(lightboxState.wheelResetTimer);
      lightboxState.wheelResetTimer = window.setTimeout(() => {
        lightboxState.wheelAccumX = 0;
        lightboxState.wheelGestureLocked = false;
      }, 220);
      event.preventDefault();
      return;
    }

    lightboxState.wheelAccumX += event.deltaX;
    window.clearTimeout(lightboxState.wheelResetTimer);
    lightboxState.wheelResetTimer = window.setTimeout(() => {
      lightboxState.wheelAccumX = 0;
      lightboxState.wheelGestureLocked = false;
    }, 180);

    if (Math.abs(lightboxState.wheelAccumX) > 90) {
      changeLightboxItem(lightboxState.wheelAccumX > 0 ? 1 : -1);
      lightboxState.wheelAccumX = 0;
      lightboxState.wheelGestureLocked = true;
      window.clearTimeout(lightboxState.wheelResetTimer);
      lightboxState.wheelResetTimer = window.setTimeout(() => {
        lightboxState.wheelGestureLocked = false;
      }, 260);
    }
    event.preventDefault();
  }, { passive: false });

  lightboxStage?.addEventListener('touchstart', (event) => {
    if (!lightbox?.classList.contains('active')) return;

    if (event.touches.length === 2) {
      lightboxState.pinchActive = true;
      lightboxState.panActive = false;
      lightboxState.swipeActive = false;
      const [touchA, touchB] = event.touches;
      lightboxState.pinchStartDistance = Math.hypot(touchB.clientX - touchA.clientX, touchB.clientY - touchA.clientY);
      lightboxState.pinchStartScale = lightboxState.scale;
      return;
    }

    const touch = event.touches[0];
    lightboxState.startX = touch.clientX;
    lightboxState.startY = touch.clientY;
    lightboxState.touchMoved = false;
    lightboxState.swipeDeltaX = 0;
    lightboxState.startTranslateX = lightboxState.translateX;
    lightboxState.startTranslateY = lightboxState.translateY;
    lightboxState.panActive = lightboxState.scale > 1;
    lightboxState.swipeActive = lightboxState.scale === 1;
  }, { passive: true });

  lightboxStage?.addEventListener('touchmove', (event) => {
    if (!lightbox?.classList.contains('active')) return;

    if (lightboxState.pinchActive && event.touches.length === 2) {
      const [touchA, touchB] = event.touches;
      const distance = Math.hypot(touchB.clientX - touchA.clientX, touchB.clientY - touchA.clientY);
      const nextScale = clamp((distance / lightboxState.pinchStartDistance) * lightboxState.pinchStartScale, 1, 4);
      lightboxState.scale = nextScale;
      const limits = getPanLimits();
      lightboxState.translateX = clamp(lightboxState.translateX, -limits.x, limits.x);
      lightboxState.translateY = clamp(lightboxState.translateY, -limits.y, limits.y);
      applyZoom();
      event.preventDefault();
      return;
    }

    const touch = event.touches[0];
    const deltaX = touch.clientX - lightboxState.startX;
    const deltaY = touch.clientY - lightboxState.startY;
    if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
      lightboxState.touchMoved = true;
    }

    if (lightboxState.panActive) {
      const limits = getPanLimits();
      lightboxState.translateX = clamp(lightboxState.startTranslateX + deltaX, -limits.x, limits.x);
      lightboxState.translateY = clamp(lightboxState.startTranslateY + deltaY, -limits.y, limits.y);
      applyZoom();
      event.preventDefault();
      return;
    }

    if (lightboxState.swipeActive) {
      lightboxState.swipeDeltaX = deltaX;
      updateLightboxPosition(deltaX);
      event.preventDefault();
    }
  }, { passive: false });

  lightboxStage?.addEventListener('touchend', (event) => {
    if (!lightbox?.classList.contains('active')) return;

    if (lightboxState.pinchActive && event.touches.length < 2) {
      lightboxState.pinchActive = false;
      if (lightboxState.scale <= 1.02) resetZoom();
    }

    if (!lightboxState.pinchActive && lightboxState.panActive) {
      if (lightboxState.scale <= 1.02) resetZoom();
      lightboxState.panActive = false;
    }

    if (lightboxState.swipeActive) {
      const threshold = Math.min(120, (lightboxStage?.clientWidth || 0) * 0.16);
      if (Math.abs(lightboxState.swipeDeltaX) > threshold) {
        changeLightboxItem(lightboxState.swipeDeltaX > 0 ? -1 : 1);
      } else {
        updateLightboxPosition();
      }
      lightboxState.swipeActive = false;
      lightboxState.swipeDeltaX = 0;
    }

    const now = Date.now();
    if (event.touches.length === 0 && !lightboxState.touchMoved && now - lightboxState.lastTapTime < 280) {
      if (lightboxState.scale > 1) {
        resetZoom();
      } else {
        lightboxState.scale = 2.5;
        applyZoom();
      }
    }
    lightboxState.lastTapTime = lightboxState.touchMoved ? 0 : now;
  });

  // --- Modal Expansion Data ---
  const expansionData = {
    visi: {
      title: "Visi Kami",
      content: "Mewujudkan masyarakat sehat yang siap beraktivitas tanpa kendala pencernaan dan asam lambung. Kami percaya bahwa kesehatan fisik dimulai dari sistem pencernaan yang kuat dan seimbang."
    },
    misi: {
      title: "Misi Kami",
      content: "1. Memberikan solusi alami untuk kesehatan lambung melalui Pati Garut premium.<br>2. Mendorong masyarakat menjalankan pola hidup sehat harian.<br>3. Membangun sistem pencernaan yang kuat dan nyaman secara berkelanjutan."
    },
    gel: {
      title: "Mekanisme Pelindung Gel",
      content: "Untuk penderita GERD atau luka lambung, Pati Garut memberikan perisai fisik instan. Saat dimasak, pati membentuk gel penyejuk demulcent yang melapisi esofagus dan dinding lambung. Ini memberikan kelegaan instan dari sensasi terbakar tanpa menyebabkan gas berlebih."
    },
    starch: {
      title: "Resistant Starch Power",
      content: "Kekuatan utama Jenang Gemi ada pada Resistant Starch-nya yang mampu bertahan melewati asam lambung dan usus halus, lalu masuk langsung ke usus besar untuk berperan sebagai prebiotik kuat yang menutrisi ekosistem alami tubuh Anda."
    },
    'nutri-orig': {
      title: "Nutrisi Varian Original",
      content: "Takaran Saji: 15g | 54 kkal<br><br>Lemak Total: 0g<br>Protein: 0g<br>Karbohidrat: 13g (5%)<br>Gula: 0g (0%)<br><br>Komposisi: Umbi garut ekstrak."
    },
    'nutri-aren': {
      title: "Nutrisi Varian Gula Aren",
      content: "Takaran Saji: 20g | 73 kkal<br><br>Lemak Total: 0g<br>Protein: 0g<br>Karbohidrat: 18g (6%)<br>Gula: 9g (18%)<br><br>Komposisi: Umbi garut ekstrak, gula aren."
    },
    'nutri-vanilla': {
      title: "Nutrisi Varian Vanilla",
      content: "Takaran Saji: 20g | 75 kkal<br><br>Lemak Total: 0g<br>Protein: 0g<br>Karbohidrat: 19g (6%)<br>Gula: 9g (18%)<br><br>Komposisi: Umbi garut ekstrak, gula pasir, perisa sintetis."
    },
    'nutri-klepon': {
      title: "Nutrisi Varian Klepon",
      content: "Takaran Saji: 20g | 75 kkal<br><br>Lemak Total: 0g<br>Protein: 0g<br>Karbohidrat: 19g (6%)<br>Gula: 9g (18%)<br><br>Komposisi: Umbi garut ekstrak, gula aren, perisa sintetis, pewarna sintetis (Tartrazine CI No. 19140)."
    }
  };

  const modal = document.getElementById('expansion-modal');
  const modalBody = document.getElementById('modal-body');

  document.querySelectorAll('.glass-card[data-expand]').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.getAttribute('data-expand');
      const data = expansionData[key];
      if (data) {
        modalBody.innerHTML = `
          <h2 style="font-size: 32px; margin-bottom: 24px;">${data.title}</h2>
          <div style="font-size: 18px; line-height: 1.8; color: var(--text-main);">${data.content}</div>
        `;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  document.querySelector('.close-modal')?.addEventListener('click', () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  });

  document.querySelector('.modal-bg')?.addEventListener('click', () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  });

  // --- Flavor & Pack Selection (Product Pages) ---
  const flavorOpts = document.querySelectorAll('.opt-chip');
  flavorOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      flavorOpts.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
    });
  });

  const packRows = document.querySelectorAll('.pack-row');
  packRows.forEach(row => {
    row.addEventListener('click', () => {
      packRows.forEach(r => r.classList.remove('active'));
      row.classList.add('active');
    });
  });

  document.querySelector('.p-add-v9')?.addEventListener('click', () => {
    const activePack = document.querySelector('.pack-row.active');
    const activeFlavor = document.querySelector('.opt-chip.active');
    const pName = document.querySelector('h1').innerText;
    
    const item = {
      name: pName,
      flavor: activeFlavor ? activeFlavor.innerText : '',
      qtyLabel: activePack.querySelector('div:first-child').innerText,
      price: parseInt(activePack.getAttribute('data-price')),
      quantity: 1
    };

    const existing = cart.find(i => i.name === item.name && i.flavor === item.flavor && i.qtyLabel === item.qtyLabel);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push(item);
    }

    renderV9Cart();
    updateV9Count();
    toggleSidebar(true);
  });

  // --- Navigation Scroll Effect ---
  window.addEventListener('scroll', () => {
    document.querySelector('.nav-v9')?.classList.toggle('scrolled', window.scrollY > 50);
  });

  // --- Section Parallax ---
  const parallaxSections = [
    {
      element: document.querySelector('.science-section'),
      shiftVar: '--science-shift',
      scaleVar: '--science-scale'
    },
    {
      element: document.querySelector('.faq-parallax-section'),
      shiftVar: '--faq-shift',
      scaleVar: '--faq-scale'
    }
  ].filter((entry) => entry.element);

  parallaxSections.forEach(({ element, shiftVar, scaleVar }) => {
    let targetShift = 0;
    let currentShift = 0;
    let targetScale = 1.08;
    let currentScale = 1.08;
    let animationFrame = null;

    const measureParallax = () => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
      const clampedProgress = Math.max(0, Math.min(1, progress));
      targetShift = (clampedProgress - 0.5) * 140;
      targetScale = 1.1 + (clampedProgress * 0.08);
    };

    const animateParallax = () => {
      currentShift += (targetShift - currentShift) * 0.08;
      currentScale += (targetScale - currentScale) * 0.08;

      element.style.setProperty(shiftVar, `${currentShift.toFixed(2)}px`);
      element.style.setProperty(scaleVar, currentScale.toFixed(4));

      const shiftSettled = Math.abs(targetShift - currentShift) < 0.12;
      const scaleSettled = Math.abs(targetScale - currentScale) < 0.0015;

      if (!shiftSettled || !scaleSettled) {
        animationFrame = window.requestAnimationFrame(animateParallax);
      } else {
        animationFrame = null;
      }
    };

    const requestParallax = () => {
      measureParallax();
      if (animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(animateParallax);
    };

    requestParallax();
    window.addEventListener('scroll', requestParallax, { passive: true });
    window.addEventListener('resize', requestParallax);
  });

  // --- Scroll Reveal Animations ---
  const revealTargets = [
    ...document.querySelectorAll('.hero-text, .hero-visual'),
    ...document.querySelectorAll('.vision-copy, .vision-image-wrap'),
    ...document.querySelectorAll('.science-card'),
    ...document.querySelectorAll('.faq-page-hero-copy, .faq-page-hero-panel, .faq-spotlight-card'),
    ...document.querySelectorAll('.faq-page-heading'),
    ...document.querySelectorAll('.faq-compare-highlight, .faq-compare-card'),
    ...document.querySelectorAll('.faq-page-item, .faq-cta-card'),
    ...document.querySelectorAll('#produk .p-card'),
    ...document.querySelectorAll('[data-expand]'),
    ...document.querySelectorAll('.testimonial-carousel'),
    ...document.querySelectorAll('.prep-card'),
    ...document.querySelectorAll('footer .container'),
    ...document.querySelectorAll('.p-info-grid > .hero-visual, .p-details')
  ];

  const uniqueRevealTargets = [...new Set(revealTargets)].filter(Boolean);
  uniqueRevealTargets.forEach((element, index) => {
    element.classList.add('reveal-on-scroll');
    element.style.setProperty('--reveal-delay', `${(index % 4) * 90}ms`);
  });

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, {
      threshold: 0.14,
      rootMargin: '0px 0px -8% 0px'
    });

    uniqueRevealTargets.forEach((element) => revealObserver.observe(element));
  } else {
    uniqueRevealTargets.forEach((element) => element.classList.add('is-visible'));
  }

  // --- FAQ Accordion ---
  const faqAccordionItems = document.querySelectorAll('.faq-page-item');
  const setFaqOpenItem = (targetItem) => {
    faqAccordionItems.forEach((entry) => {
      const entryTrigger = entry.querySelector('.faq-accordion-trigger');
      const shouldOpen = entry === targetItem;
      entry.classList.toggle('is-open', shouldOpen);
      if (entryTrigger instanceof HTMLButtonElement) {
        entryTrigger.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
      }
    });
  };

  faqAccordionItems.forEach((item) => {
    const trigger = item.querySelector('.faq-accordion-trigger');
    if (!(trigger instanceof HTMLButtonElement)) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      setFaqOpenItem(isOpen ? null : item);
    });
  });

  const faqSearch = document.getElementById('faq-search');
  const faqFilterChips = document.querySelectorAll('.faq-filter-chip');
  let activeFaqFilter = 'all';

  const applyFaqFilters = () => {
    const searchTerm = faqSearch instanceof HTMLInputElement
      ? faqSearch.value.trim().toLowerCase()
      : '';

    let firstVisibleItem = null;

    faqAccordionItems.forEach((item) => {
      const category = (item.getAttribute('data-category') || '').toLowerCase();
      const searchIndex = `${item.textContent || ''} ${(item.getAttribute('data-search') || '')}`.toLowerCase();
      const matchesFilter = activeFaqFilter === 'all' || category.includes(activeFaqFilter);
      const matchesSearch = searchTerm === '' || searchIndex.includes(searchTerm);
      const isVisible = matchesFilter && matchesSearch;

      item.classList.toggle('is-hidden', !isVisible);

      if (isVisible && firstVisibleItem === null) {
        firstVisibleItem = item;
      }
    });

    if (firstVisibleItem) {
      setFaqOpenItem(firstVisibleItem);
    } else {
      setFaqOpenItem(null);
    }
  };

  faqFilterChips.forEach((chip) => {
    if (!(chip instanceof HTMLButtonElement)) return;
    chip.addEventListener('click', () => {
      activeFaqFilter = chip.getAttribute('data-filter') || 'all';
      faqFilterChips.forEach((entry) => entry.classList.toggle('active', entry === chip));
      applyFaqFilters();
    });
  });

  if (faqSearch instanceof HTMLInputElement) {
    faqSearch.addEventListener('input', applyFaqFilters);
  }

  const activeFaqChip = Array.from(faqFilterChips).find((chip) => chip.classList.contains('active'));
  if (activeFaqChip instanceof HTMLButtonElement) {
    activeFaqFilter = activeFaqChip.getAttribute('data-filter') || activeFaqFilter;
    applyFaqFilters();
  }

  updateV9Count();
  renderV9Cart();

  window.addQuizRecommendationToCart = (itemConfig) => {
    const item = itemConfig;
    if (!item) return;

    const existing = cart.find((entry) => (
      entry.name === item.name &&
      entry.flavor === item.flavor &&
      entry.qtyLabel === item.qtyLabel
    ));

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }

    renderV9Cart();
    updateV9Count();
    toggleSidebar(true);
  };

  const quizModal = document.getElementById('quizModal');
  quizModal?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.classList.contains('quiz-backdrop')) {
      closeQuiz();
    }
  });
});

// --- Quiz Logic ---
const quizRecommendations = {
  bubur: {
    key: 'bubur',
    title: 'Jenang Gemi Bubur cocok untuk Anda',
    description: 'Pilihan paling pas untuk rutinitas Anda.',
    pill: 'Pilihan hangat',
    image: buburQuizImage,
    imageAlt: 'Produk Jenang Gemi Bubur',
    fit: 'Format hangat ini paling cocok dengan kebutuhan nyaman dan ritme rumah Anda.',
    addLabel: 'Tambah ke Keranjang',
    flavors: ['Original', 'Gula Aren', 'Vanilla', 'Klepon'],
    packs: [
      { label: '15 Sachets', price: 120000 },
      { label: '30 Sachets', price: 199000 },
      { label: '60 Sachets', price: 398000 }
    ],
    defaultFlavor: 'Original',
    defaultPack: '15 Sachets'
  },
  jamu: {
    key: 'jamu',
    title: 'Jenang Gemi Jamu cocok untuk Anda',
    description: 'Pilihan paling pas untuk rutinitas Anda.',
    pill: 'Pilihan praktis',
    image: jamuQuizImage,
    imageAlt: 'Produk Jenang Gemi Jamu',
    fit: 'Format praktis ini paling cocok untuk jadwal Anda yang lebih cepat dan fleksibel.',
    addLabel: 'Tambah ke Keranjang',
    flavors: ['Gula Aren'],
    packs: [
      { label: '15 Sachets', price: 120000 },
      { label: '30 Sachets', price: 199000 },
      { label: '60 Sachets', price: 398000 }
    ],
    defaultFlavor: 'Gula Aren',
    defaultPack: '15 Sachets'
  }
};

const quizData = [
  {
    q: 'Saat lambung sedang sensitif, apa kebutuhan utama Anda sekarang?',
    helper: 'Jawaban ini membantu kami membedakan apakah Anda lebih cocok ke sensasi hangat Bubur atau ke format praktis Jamu.',
    options: [
      {
        t: 'Saya ingin rasa nyaman yang lebih cepat terasa',
        scores: { bubur: 3, jamu: 1 },
        traits: ['prioritizes immediate soothing relief', 'leans toward a warmer format']
      },
      {
        t: 'Saya ingin format yang paling mudah dijalani setiap hari',
        scores: { bubur: 0, jamu: 3 },
        traits: ['needs a practical daily routine', 'wants the simplest format to stay consistent']
      },
      {
        t: 'Saya ingin yang tetap nyaman, tetapi jangan terlalu merepotkan',
        scores: { bubur: 1, jamu: 2 },
        traits: ['needs a balance between comfort and convenience']
      }
    ]
  },
  {
    q: 'Rutinitas pagi Anda biasanya seperti apa?',
    helper: 'Bubur lebih cocok jika Anda sempat menyiapkan sesuatu di rumah. Jamu lebih cocok bila Anda sering buru-buru atau langsung berangkat.',
    options: [
      {
        t: 'Saya biasanya masih sempat sarapan atau minum sesuatu di rumah',
        scores: { bubur: 3, jamu: 0 },
        traits: ['has time to prepare something at home']
      },
      {
        t: 'Pagi saya sering mepet, harus cepat berangkat, atau mobile',
        scores: { bubur: 0, jamu: 3 },
        traits: ['needs something faster for busy mornings']
      },
      {
        t: 'Jadwal saya berubah-ubah, jadi saya butuh yang fleksibel',
        scores: { bubur: 1, jamu: 2 },
        traits: ['needs a format that remains usable on inconsistent days']
      }
    ]
  },
  {
    q: 'Soal menyiapkan produk, mana yang paling realistis untuk Anda?',
    helper: 'Perbedaan terbesar kedua produk ada di sini: Bubur perlu dimasak sampai mengental, sedangkan Jamu cukup dicampur air.',
    options: [
      {
        t: 'Saya tidak masalah masak singkat kalau hasilnya lebih menenangkan',
        scores: { bubur: 4, jamu: 0 },
        traits: ['is willing to cook briefly for a more soothing experience']
      },
      {
        t: 'Saya butuh yang cukup seduh atau campur air lalu lanjut aktivitas',
        scores: { bubur: 0, jamu: 4 },
        traits: ['needs an instant mix format']
      },
      {
        t: 'Kalau terlalu ribet, saya kemungkinan tidak akan rutin',
        scores: { bubur: 0, jamu: 3 },
        traits: ['needs the easiest option to maintain consistency']
      }
    ]
  },
  {
    q: 'Bahan atau pengalaman seperti apa yang paling terdengar cocok untuk Anda?',
    helper: 'Pertanyaan terakhir ini memakai detail dari produknya langsung: Bubur fokus ke saripati garut yang dimasak, sedangkan Jamu menambah kunyit dan psyllium dalam format instan.',
    options: [
      {
        t: 'Saripati garut murni yang dimasak jadi gel hangat lebih sesuai untuk saya',
        scores: { bubur: 4, jamu: 0 },
        traits: ['prefers cooked arrowroot with a warm gel-like texture']
      },
      {
        t: 'Saya suka ide arrowroot dengan tambahan kunyit dan psyllium',
        scores: { bubur: 0, jamu: 4 },
        traits: ['likes extra support from turmeric and psyllium']
      },
      {
        t: 'Pilihkan berdasarkan jawaban saya sebelumnya saja',
        scores: { bubur: 1, jamu: 1 },
        traits: ['wants the recommendation driven by routine fit']
      }
    ]
  }
];
let currentStep = 0;
let quizScores = { bubur: 0, jamu: 0 };
let quizAnswers = [];
let quizSelection = {
  key: '',
  flavor: '',
  qtyLabel: ''
};

const quizTraitCopy = {
  'prioritizes immediate soothing relief': 'Anda lebih memprioritaskan rasa nyaman yang cepat terasa ketika lambung sedang sensitif.',
  'leans toward a warmer format': 'Anda condong ke format hangat yang terasa lebih menenangkan.',
  'needs a practical daily routine': 'Anda mencari solusi yang realistis dipakai rutin setiap hari.',
  'wants the simplest format to stay consistent': 'Konsistensi harian penting, jadi format sederhana jadi nilai plus besar.',
  'needs a balance between comfort and convenience': 'Anda ingin manfaat lambung tetap terasa tanpa proses yang terlalu merepotkan.',
  'has time to prepare something at home': 'Rutinitas Anda masih memberi ruang untuk menyiapkan produk di rumah.',
  'needs something faster for busy mornings': 'Pagi yang padat membuat kecepatan persiapan menjadi faktor utama.',
  'needs a format that remains usable on inconsistent days': 'Produk perlu tetap cocok dipakai meski jadwal Anda berubah-ubah.',
  'is willing to cook briefly for a more soothing experience': 'Anda siap memasak singkat jika hasilnya terasa lebih menenangkan.',
  'needs an instant mix format': 'Format instan yang cukup dicampur air terdengar paling realistis untuk Anda.',
  'needs the easiest option to maintain consistency': 'Anda tahu kemungkinan besar hanya akan lanjut dengan opsi yang paling praktis.',
  'prefers cooked arrowroot with a warm gel-like texture': 'Anda lebih tertarik pada saripati garut yang dimasak sampai menjadi gel hangat.',
  'likes extra support from turmeric and psyllium': 'Tambahan kunyit dan psyllium terdengar lebih cocok dengan preferensi Anda.',
  'wants the recommendation driven by routine fit': 'Anda lebih ingin keputusan akhir ditentukan dari kecocokan rutinitas.'
};

function resetQuizState() {
  currentStep = 0;
  quizScores = { bubur: 0, jamu: 0 };
  quizAnswers = [];
}

function openQuiz() {
  resetQuizState();
  const modal = document.getElementById('quizModal');
  modal?.classList.add('active');
  modal?.setAttribute('aria-hidden', 'false');
  document.getElementById('btn-take-quiz').style.display = 'block';
  document.getElementById('quiz-intro').style.display = 'block';
  document.getElementById('quiz-q').style.display = 'none';
  document.getElementById('quiz-res').style.display = 'none';
  document.body.style.overflow = 'hidden';
}

function closeQuiz() {
  const modal = document.getElementById('quizModal');
  modal?.classList.remove('active');
  modal?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function startQuiz() {
  resetQuizState();
  document.getElementById('btn-take-quiz').style.display = 'none';
  document.getElementById('quiz-intro').style.display = 'none';
  document.getElementById('quiz-q').style.display = 'block';
  document.getElementById('quiz-res').style.display = 'none';
  showStep();
}

function showStep() {
  const step = quizData[currentStep];
  document.getElementById('quiz-step-label').innerText = `Pertanyaan ${currentStep + 1} dari ${quizData.length}`;
  document.getElementById('quiz-progress-fill').style.width = `${((currentStep + 1) / quizData.length) * 100}%`;
  document.getElementById('q-text').innerText = step.q;
  document.getElementById('q-helper').innerText = step.helper;
  const opts = document.getElementById('quiz-options');
  opts.innerHTML = '';
  step.options.forEach(o => {
    const b = document.createElement('button');
    b.className = 'btn quiz-option-btn';
    b.innerText = o.t;
    b.onclick = () => handleQuizAnswer(o);
    opts.appendChild(b);
  });
}

function handleQuizAnswer(option) {
  quizAnswers.push({
    text: option.t,
    traits: option.traits || []
  });
  Object.entries(option.scores).forEach(([key, value]) => {
    quizScores[key] += value;
  });

  if (currentStep < quizData.length - 1) {
    currentStep += 1;
    showStep();
    return;
  }

  finishQuiz();
}

function getQuizRecommendation() {
  if (quizScores.bubur === quizScores.jamu) {
    const prefersPractical = quizAnswers.some((answer) => (
      answer.text.includes('praktis') ||
      answer.text.includes('mepet') ||
      answer.text.includes('campur air') ||
      answer.text.includes('tidak akan rutin')
    ));

    return prefersPractical ? quizRecommendations.jamu : quizRecommendations.bubur;
  }

  return quizScores.bubur > quizScores.jamu ? quizRecommendations.bubur : quizRecommendations.jamu;
}

function getQuizReasonSummary(recommendationKey) {
  const preferredTraits = recommendationKey === 'bubur'
    ? [
        'prioritizes immediate soothing relief',
        'leans toward a warmer format',
        'has time to prepare something at home',
        'is willing to cook briefly for a more soothing experience',
        'prefers cooked arrowroot with a warm gel-like texture'
      ]
    : [
        'needs a practical daily routine',
        'wants the simplest format to stay consistent',
        'needs something faster for busy mornings',
        'needs a format that remains usable on inconsistent days',
        'needs an instant mix format',
        'needs the easiest option to maintain consistency',
        'likes extra support from turmeric and psyllium'
      ];

  const selectedTraits = [];
  quizAnswers.forEach((answer) => {
    answer.traits.forEach((trait) => {
      if (preferredTraits.includes(trait) && !selectedTraits.includes(trait)) {
        selectedTraits.push(trait);
      }
    });
  });

  const mappedTraits = selectedTraits
    .slice(0, 2)
    .map((trait) => quizTraitCopy[trait])
    .filter(Boolean);

  if (mappedTraits.length > 0) {
    return mappedTraits;
  }

  return recommendationKey === 'bubur'
    ? ['Jawaban Anda lebih dekat ke kebutuhan akan format hangat yang dimasak dan terasa nyaman di rumah.']
    : ['Jawaban Anda lebih dekat ke kebutuhan akan format instan yang cepat dipakai dan mudah dijalani konsisten.'];
}

function finishQuiz() {
  document.getElementById('quiz-q').style.display = 'none';
  document.getElementById('quiz-res').style.display = 'block';
  const recommendation = getQuizRecommendation();
  const rText = document.getElementById('r-text');
  const rDesc = document.getElementById('r-desc');
  const rPill = document.getElementById('r-pill');
  const rImage = document.getElementById('r-image');
  const rFit = document.getElementById('r-fit');
  const rReasons = document.getElementById('r-reasons');
  const rFlavors = document.getElementById('r-flavors');
  const rPacks = document.getElementById('r-packs');
  const addBtn = document.getElementById('quiz-add-cart');
  const reasonItems = getQuizReasonSummary(recommendation.key);

  quizSelection = {
    key: recommendation.key,
    flavor: recommendation.defaultFlavor,
    qtyLabel: recommendation.defaultPack
  };

  rText.innerText = recommendation.title;
  rDesc.innerText = recommendation.description;
  rPill.innerText = recommendation.pill;
  rImage.src = recommendation.image;
  rImage.alt = recommendation.imageAlt;
  rFit.innerText = recommendation.fit;
  rReasons.innerHTML = '';
  reasonItems.forEach((reason) => {
    const item = document.createElement('li');
    item.innerText = reason;
    rReasons.appendChild(item);
  });

  rFlavors.innerHTML = '';
  recommendation.flavors.forEach((flavor) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `quiz-mini-chip${flavor === quizSelection.flavor ? ' active' : ''}`;
    button.innerText = flavor;
    button.onclick = () => {
      quizSelection.flavor = flavor;
      rFlavors.querySelectorAll('.quiz-mini-chip').forEach((chip) => {
        chip.classList.toggle('active', chip.innerText === flavor);
      });
    };
    rFlavors.appendChild(button);
  });

  rPacks.innerHTML = '';
  recommendation.packs.forEach((pack) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `quiz-mini-chip${pack.label === quizSelection.qtyLabel ? ' active' : ''}`;
    button.innerText = pack.label;
    button.onclick = () => {
      quizSelection.qtyLabel = pack.label;
      rPacks.querySelectorAll('.quiz-mini-chip').forEach((chip) => {
        chip.classList.toggle('active', chip.innerText === pack.label);
      });
    };
    rPacks.appendChild(button);
  });

  addBtn.innerText = recommendation.addLabel;
  addBtn.onclick = () => {
    const chosenPack = recommendation.packs.find((pack) => pack.label === quizSelection.qtyLabel) || recommendation.packs[0];
    window.addQuizRecommendationToCart?.({
      name: recommendation.key === 'bubur' ? 'Jenang Gemi Bubur' : 'Jenang Gemi Jamu',
      flavor: quizSelection.flavor,
      qtyLabel: quizSelection.qtyLabel,
      price: chosenPack.price
    });
    closeQuiz();
  };
}

function retakeQuiz() {
  resetQuizState();
  document.getElementById('quiz-intro').style.display = 'none';
  document.getElementById('quiz-res').style.display = 'none';
  document.getElementById('quiz-q').style.display = 'block';
  showStep();
}

window.openQuiz = openQuiz;
window.closeQuiz = closeQuiz;
window.startQuiz = startQuiz;
window.retakeQuiz = retakeQuiz;

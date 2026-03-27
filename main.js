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
  const testimonialSources = Array.from({ length: 19 }, (_, index) => ({
    src: `Media/Testimonials/Testimonial ${index + 1}.png`,
    alt: `Testimoni pelanggan Jenang Gemi ${index + 1}`,
    label: `Testimonial ${index + 1}`
  }));

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

  // --- Science Section Parallax ---
  const scienceSection = document.querySelector('.science-section');
  if (scienceSection) {
    let scienceTargetShift = 0;
    let scienceCurrentShift = 0;
    let scienceTargetScale = 1.08;
    let scienceCurrentScale = 1.08;
    let scienceAnimationFrame = null;

    const measureScienceParallax = () => {
      const rect = scienceSection.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
      const clampedProgress = Math.max(0, Math.min(1, progress));
      scienceTargetShift = (clampedProgress - 0.5) * 140;
      scienceTargetScale = 1.1 + (clampedProgress * 0.08);
    };

    const animateScienceParallax = () => {
      scienceCurrentShift += (scienceTargetShift - scienceCurrentShift) * 0.08;
      scienceCurrentScale += (scienceTargetScale - scienceCurrentScale) * 0.08;

      scienceSection.style.setProperty('--science-shift', `${scienceCurrentShift.toFixed(2)}px`);
      scienceSection.style.setProperty('--science-scale', scienceCurrentScale.toFixed(4));

      const shiftSettled = Math.abs(scienceTargetShift - scienceCurrentShift) < 0.12;
      const scaleSettled = Math.abs(scienceTargetScale - scienceCurrentScale) < 0.0015;

      if (!shiftSettled || !scaleSettled) {
        scienceAnimationFrame = window.requestAnimationFrame(animateScienceParallax);
      } else {
        scienceAnimationFrame = null;
      }
    };

    const requestScienceParallax = () => {
      measureScienceParallax();
      if (scienceAnimationFrame !== null) return;
      scienceAnimationFrame = window.requestAnimationFrame(animateScienceParallax);
    };

    requestScienceParallax();
    window.addEventListener('scroll', requestScienceParallax, { passive: true });
    window.addEventListener('resize', requestScienceParallax);
  }

  // --- Scroll Reveal Animations ---
  const revealTargets = [
    ...document.querySelectorAll('.hero-text, .hero-visual'),
    ...document.querySelectorAll('.vision-copy, .vision-image-wrap'),
    ...document.querySelectorAll('.science-card'),
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

  updateV9Count();
  renderV9Cart();
});

// --- Quiz Logic ---
let currentStep = 0;
const quizData = [
  {
    q: "Apa keluhan utama lambung Anda?",
    options: [
      { t: "Asam lambung sering naik & perih (GERD)", res: "bubur" },
      { t: "Sering kembung dan nyeri ulu hati", res: "jamu" },
      { t: "Hanya ingin menjaga daya tahan tubuh", res: "jamu" }
    ]
  }
];

function openQuiz() {
  document.getElementById('quizModal').style.display = 'flex';
  document.getElementById('btn-take-quiz').style.display = 'block';
  document.getElementById('quiz-q').style.display = 'none';
  document.getElementById('quiz-res').style.display = 'none';
}

function closeQuiz() {
  document.getElementById('quizModal').style.display = 'none';
}

function startQuiz() {
  document.getElementById('btn-take-quiz').style.display = 'none';
  document.getElementById('quiz-q').style.display = 'block';
  showStep();
}

function showStep() {
  const step = quizData[currentStep];
  document.getElementById('q-text').innerText = step.q;
  const opts = document.getElementById('quiz-options');
  opts.innerHTML = '';
  step.options.forEach(o => {
    const b = document.createElement('button');
    b.className = 'btn btn-outline';
    b.style.cssText = 'width: 100%; margin-bottom: 12px; text-align: left; padding: 16px 24px;';
    b.innerText = o.t;
    b.onclick = () => finishQuiz(o.res);
    opts.appendChild(b);
  });
}

function finishQuiz(res) {
  document.getElementById('quiz-q').style.display = 'none';
  document.getElementById('quiz-res').style.display = 'block';
  const rText = document.getElementById('r-text');
  const rDesc = document.getElementById('r-desc');
  const rLink = document.getElementById('quiz-res-link');

  if (res === 'bubur') {
    rText.innerText = "Bubur Gemi Adalah Solusi Anda";
    rDesc.innerText = "Tekstur gel hangat dari Bubur Gemi sangat efektif untuk melapisi lambung yang perih dan meredakan gejala GERD seketika.";
    rLink.href = "bubur.html";
  } else {
    rText.innerText = "Jamu Gemi Pilihan Tepat";
    rDesc.innerText = "Jamu Gemi dengan tambahan Kunyit dan Psyllium Husk membantu meredakan kembung harian dan menjaga kesehatan usus Anda.";
    rLink.href = "jamu.html";
  }
}

window.openQuiz = openQuiz;
window.closeQuiz = closeQuiz;
window.startQuiz = startQuiz;

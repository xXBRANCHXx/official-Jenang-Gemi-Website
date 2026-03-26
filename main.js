document.addEventListener('DOMContentLoaded', () => {
  // --- Cart Core ---
  let cart = JSON.parse(localStorage.getItem('gemi_cart_v9')) || [];
  
  const updateV9Count = () => {
    const totalCount = cart.reduce((acc, it) => acc + it.quantity, 0);
    document.querySelectorAll('.count-v9').forEach(el => {
      el.textContent = totalCount;
      el.style.display = totalCount > 0 ? 'flex' : 'none';
    });
  };

  const renderV9Cart = () => {
    const list = document.getElementById('list-v9');
    const totalEl = document.getElementById('total-v9');
    
    if (!list) return;
    
    if (cart.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #94A3B8; padding: 100px 0; font-weight: 800; font-family: Manrope;">Keranjang Kosong</p>';
      totalEl.textContent = 'Rp 0';
      return;
    }

    let subtotal = 0;
    list.innerHTML = cart.map((item, i) => {
      subtotal += item.price * item.quantity;
      return `
        <div class="item-v9" style="display: flex; gap: 24px; padding-bottom: 24px; border-bottom: 2px solid #F1F5F9; margin-bottom: 24px;">
          <img src="${item.image}" alt="${item.name}" style="width: 100px; height: 100px; border-radius: 20px; background: #FDFCF8; padding: 10px;">
          <div style="flex: 1;">
            <h4 style="font-family:'Manrope'; font-weight: 950; font-size: 16px;">${item.name}</h4>
            <p style="font-size: 11px; font-weight: 700; color: #64748B; margin-top: 4px;">${item.flavor ? 'Rasa: ' + item.flavor + ' | ' : ''}${item.qtyLabel}</p>
            <div style="font-weight: 950; color: var(--green); font-size: 15px; margin-top: 8px;">Rp ${item.price.toLocaleString('id-ID')}</div>
            <button class="remove-v9" data-index="${i}" style="border:none; background:none; font-size:11px; color:#EF4444; font-weight:900; cursor:pointer; margin-top:12px;">Hapus Item</button>
          </div>
          <div style="font-weight: 900; font-size: 14px; color: #64748B;">x${item.quantity}</div>
        </div>
      `;
    }).join('');

    totalEl.textContent = `Rp ${subtotal.toLocaleString('id-ID')}`;
    
    document.querySelectorAll('.remove-v9').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-index');
        cart.splice(id, 1);
        persistV9();
      });
    });
  };

  const persistV9 = () => {
    localStorage.setItem('gemi_cart_v9', JSON.stringify(cart));
    updateV9Count();
    renderV9Cart();
  };

  const addV9ToCart = (product) => {
    const existing = cart.findIndex(it => it.name === product.name && it.qtyLabel === product.qtyLabel && it.flavor === product.flavor);
    if (existing > -1) cart[existing].quantity += 1;
    else cart.push({ ...product, quantity: 1 });
    persistV9();
    openSidebarV9();
  };

  // --- Sidebar Interaction ---
  const sidebar = document.getElementById('sidebar-v9');
  const overlay = document.getElementById('global-overlay');
  const cartBtn = document.querySelector('.cart-v9-btn');
  const closeBtnX = document.querySelector('.close-v9');

  const openSidebarV9 = () => {
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeSidebarV9 = () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  cartBtn?.addEventListener('click', openSidebarV9);
  closeBtnX?.addEventListener('click', closeSidebarV9);
  overlay?.addEventListener('click', closeSidebarV9);

  // --- WhatsApp (Clean, No Emojis) ---
  document.querySelector('.checkout-v9')?.addEventListener('click', () => {
    if (cart.length === 0) return;
    let msg = "Halo Admin Jenang Gemi, pemesanan baru saya:\n\n";
    let subtotal = 0;
    cart.forEach((it, i) => {
      subtotal += it.price * it.quantity;
      msg += (i + 1) + ". *" + it.name + "* " + (it.flavor ? "(Rasa: " + it.flavor + ") " : "") + "(" + it.qtyLabel + ")\n   Harga: Rp " + it.price.toLocaleString('id-ID') + "\n   Jumlah: " + it.quantity + "\n\n";
    });
    msg += "*Total Keseluruhan: Rp " + subtotal.toLocaleString('id-ID') + "*\n\n(JANGAN DIHAPUS)";
    window.open(`https://api.whatsapp.com/send?phone=6285842833973&text=${encodeURIComponent(msg)}`, '_blank');
  });

  // --- Flavor & Pack Selection ---
  const flavorOpts = document.querySelectorAll('.flavor-opt, .opt-chip');
  flavorOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      flavorOpts.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
    });
  });

  const packItems = document.querySelectorAll('.pack-item, .pack-row');
  packItems.forEach(item => {
    item.addEventListener('click', () => {
      packItems.forEach(r => r.classList.remove('active'));
      item.classList.add('active');
    });
  });

  document.querySelector('.p-add-v9')?.addEventListener('click', () => {
    const pack = document.querySelector('.pack-item.active, .pack-row.active');
    if (!pack) return alert('Silakan pilih paket.');
    
    const isBubur = document.querySelector('h1').textContent.toLowerCase().includes('bubur');
    const flavorComp = document.querySelector('.flavor-opt.active, .opt-chip.active');
    if (isBubur && !flavorComp) return alert('Silakan pilih rasa.');

    const name = document.querySelector('h1').textContent.trim();
    const qtyLabel = pack.querySelector('div:first-child')?.textContent?.trim() || pack.textContent.trim();
    const price = parseInt(pack.getAttribute('data-price'));
    const flavor = isBubur ? flavorComp.getAttribute('data-flavor') : null;
    const image = document.querySelector('main img').getAttribute('src');

    addV9ToCart({ name, qtyLabel, price, flavor, image });
  });

  updateV9Count();
  renderV9Cart();

  /* Reveal Animation */
  const revealEls = document.querySelectorAll('.section, .f-card, .p-tile, h1, .hero-visual, .p-card, .pack-row');
  const revealOpts = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  const revealCb = (entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('active');
        obs.unobserve(e.target);
      }
    });
  };
  const revealObs = new IntersectionObserver(revealCb, revealOpts);
  revealEls.forEach(el => {
    el.classList.add('reveal-v9');
    revealObs.observe(el);
  });

  /* Nav Background on scroll */
  window.addEventListener('scroll', () => {
    const nav = document.querySelector('.nav-v9');
    if (window.scrollY > 50) nav?.classList.add('scrolled');
    else nav?.classList.remove('scrolled');
  });
});

/* Quiz Functions */
function openQuiz() {
  document.getElementById('quizModal')?.classList.add('active');
  document.getElementById('btn-take-quiz').style.display = 'block';
  document.getElementById('quiz-caption').style.display = 'block';
  document.getElementById('quiz-q').style.display = 'none';
  document.getElementById('quiz-res').style.display = 'none';
}

function closeQuiz() {
  document.getElementById('quizModal')?.classList.remove('active');
}

function startQuiz() {
  document.getElementById('btn-take-quiz').style.display = 'none';
  document.getElementById('quiz-caption').style.display = 'none';
  document.getElementById('quiz-q').style.display = 'block';
}

function finishQuiz(type) {
  document.getElementById('quiz-q').style.display = 'none';
  const resStr = document.getElementById('quiz-res');
  resStr.style.display = 'block';
  if (type === 'bubur') {
    document.getElementById('r-text').innerText = 'Bubur Gemi Cocok Untuk Anda!';
    document.getElementById('r-desc').innerText = 'Sifat penyejuk demulcent akan langsung meredakan panas lambung Anda. Formulasi hangat ini sangat ideal untuk kasus GERD aktif.';
  } else {
    document.getElementById('r-text').innerText = 'Jamu Gemi Cocok Untuk Anda!';
    document.getElementById('r-desc').innerText = 'Ekstra kunyit dan psyllium husk bekerja luar biasa untuk perawatan harian, mengatasi kembung, dan sangat mudah dibawa bepergian!';
  }
}

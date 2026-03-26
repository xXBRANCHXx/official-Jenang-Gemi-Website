document.addEventListener('DOMContentLoaded', () => {
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
    if (!list || !totalEl) return;

    if (cart.length === 0) {
      list.innerHTML = '<p style="text-align:center;color:#94A3B8;padding:90px 0;font-weight:800;font-family:Manrope;">Keranjang Kosong</p>';
      totalEl.textContent = 'Rp 0';
      return;
    }

    let subtotal = 0;
    list.innerHTML = cart.map((item, i) => {
      subtotal += item.price * item.quantity;
      return `
        <div class="item-v9" style="display:flex;gap:16px;padding-bottom:18px;border-bottom:1px solid #E9EFE3;margin-bottom:18px;">
          <img src="${item.image}" alt="${item.name}" style="width:88px;height:88px;border-radius:16px;background:#FDFCF8;padding:8px;object-fit:contain;">
          <div style="flex:1;">
            <h4 style="font-family:'Manrope';font-weight:900;font-size:15px;">${item.name}</h4>
            <p style="font-size:11px;font-weight:700;color:#64748B;margin-top:2px;">${item.flavor ? 'Rasa: ' + item.flavor + ' | ' : ''}${item.qtyLabel}</p>
            <div style="font-weight:900;color:var(--green);font-size:15px;margin-top:6px;">Rp ${item.price.toLocaleString('id-ID')}</div>
            <button class="remove-v9" data-index="${i}" style="border:none;background:none;font-size:11px;color:#EF4444;font-weight:900;cursor:pointer;margin-top:8px;">Hapus Item</button>
          </div>
          <div style="font-weight:900;font-size:14px;color:#64748B;">x${item.quantity}</div>
        </div>
      `;
    }).join('');

    totalEl.textContent = `Rp ${subtotal.toLocaleString('id-ID')}`;
    document.querySelectorAll('.remove-v9').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(e.target.getAttribute('data-index'));
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

  const sidebar = document.getElementById('sidebar-v9');
  const overlay = document.getElementById('global-overlay');
  const cartBtn = document.querySelector('.cart-v9-btn');
  const closeBtnX = document.querySelector('.close-v9');

  const openSidebarV9 = () => {
    if (!sidebar || !overlay) return;
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeSidebarV9 = () => {
    if (!sidebar || !overlay) return;
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  cartBtn?.addEventListener('click', openSidebarV9);
  closeBtnX?.addEventListener('click', closeSidebarV9);
  overlay?.addEventListener('click', closeSidebarV9);

  document.querySelector('.checkout-v9')?.addEventListener('click', () => {
    if (cart.length === 0) return;
    let msg = 'Halo Admin Jenang Gemi, pemesanan baru saya:\n\n';
    let subtotal = 0;
    cart.forEach((it, i) => {
      subtotal += it.price * it.quantity;
      msg += `${i + 1}. *${it.name}* ${it.flavor ? `(Rasa: ${it.flavor}) ` : ''}(${it.qtyLabel})\n   Harga: Rp ${it.price.toLocaleString('id-ID')}\n   Jumlah: ${it.quantity}\n\n`;
    });
    msg += `*Total Keseluruhan: Rp ${subtotal.toLocaleString('id-ID')}*\n\n(JANGAN DIHAPUS)`;
    window.open(`https://api.whatsapp.com/send?phone=6285842833973&text=${encodeURIComponent(msg)}`, '_blank');
  });

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

    const isBubur = document.querySelector('h1')?.textContent?.toLowerCase().includes('bubur');
    const flavorComp = document.querySelector('.flavor-opt.active, .opt-chip.active');
    if (isBubur && !flavorComp) return alert('Silakan pilih rasa.');

    const name = document.querySelector('h1')?.textContent.trim() || 'Jenang Gemi';
    const qtyLabel = pack.querySelector('div:first-child')?.textContent?.trim() || pack.textContent.trim();
    const price = parseInt(pack.getAttribute('data-price'));
    const flavor = isBubur ? flavorComp?.getAttribute('data-flavor') : null;
    const image = document.querySelector('main img')?.getAttribute('src') || 'Media/37.png';

    addV9ToCart({ name, qtyLabel, price, flavor, image });
  });

  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('active');
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal-target, .section, .f-card, .p-card').forEach(el => {
    el.classList.add('reveal-target');
    revealObs.observe(el);
  });

  window.addEventListener('scroll', () => {
    const nav = document.querySelector('.nav-v9');
    if (window.scrollY > 50) nav?.classList.add('scrolled');
    else nav?.classList.remove('scrolled');

    const parallax = document.querySelector('.parallax-bg');
    if (parallax) {
      const y = window.scrollY * -0.12;
      parallax.style.setProperty('--parallax-offset', `${y}px`);
    }
  });

  const quizSteps = [
    {
      title: 'Seberapa siap kamu masak rutin di rumah?',
      options: [
        { label: 'Aku siap masak rutin', score: 'bubur' },
        { label: 'Pengennya yang tinggal seduh', score: 'jamu' }
      ]
    },
    {
      title: 'Kamu prioritasnya apa sekarang?',
      options: [
        { label: 'Hasil paling optimal', score: 'bubur' },
        { label: 'Paling praktis dan konsisten', score: 'jamu' }
      ]
    }
  ];

  let quizIndex = 0;
  const quizScore = { bubur: 0, jamu: 0 };
  const quizModal = document.getElementById('quiz-modal');
  const quizTitle = document.getElementById('quiz-title');
  const quizOptions = document.getElementById('quiz-options');
  const quizResult = document.getElementById('quiz-result');

  const renderQuizStep = () => {
    const step = quizSteps[quizIndex];
    if (!step || !quizTitle || !quizOptions) return;
    quizTitle.textContent = step.title;
    quizOptions.innerHTML = step.options.map(opt => `<button class="btn btn-outline quiz-option" data-score="${opt.score}">${opt.label}</button>`).join('');
    quizOptions.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const score = btn.getAttribute('data-score');
        quizScore[score] += 1;
        quizIndex += 1;
        if (quizIndex >= quizSteps.length) {
          const pick = quizScore.bubur >= quizScore.jamu ? 'bubur' : 'jamu';
          if (pick === 'bubur') {
            quizTitle.textContent = 'Rekomendasi: Bubur Gemi';
            quizOptions.innerHTML = '<a class="btn btn-primary" href="bubur.html">Lihat Bubur Gemi</a>';
            quizResult.textContent = 'Kamu cocok dengan Bubur Gemi: butuh hasil terbaik dan siap meluangkan waktu memasak di rumah.';
          } else {
            quizTitle.textContent = 'Rekomendasi: Jamu Gemi';
            quizOptions.innerHTML = '<a class="btn btn-primary" href="jamu.html">Lihat Jamu Gemi</a>';
            quizResult.textContent = 'Kamu cocok dengan Jamu Gemi: lebih praktis untuk konsumsi harian, dengan benefit tetap kuat.';
          }
          return;
        }
        renderQuizStep();
      });
    });
  };

  const openQuiz = () => {
    if (!quizModal) return;
    quizIndex = 0;
    quizScore.bubur = 0;
    quizScore.jamu = 0;
    quizResult.textContent = '';
    renderQuizStep();
    quizModal.classList.add('active');
  };

  document.getElementById('start-quiz')?.addEventListener('click', openQuiz);
  document.getElementById('quiz-close')?.addEventListener('click', () => quizModal?.classList.remove('active'));
  quizModal?.addEventListener('click', (e) => {
    if (e.target === quizModal) quizModal.classList.remove('active');
  });

  updateV9Count();
  renderV9Cart();
});

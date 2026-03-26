document.addEventListener('DOMContentLoaded', () => {
  // --- Cart System ---
  let cart = JSON.parse(localStorage.getItem('gemi_cart_v10')) || [];
  const sidebar = document.getElementById('sidebar-v9');
  const overlay = document.getElementById('global-overlay');
  const cartBtn = document.querySelector('.cart-v9-btn');
  const closeBtn = document.querySelector('.close-v9');

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
  overlay?.addEventListener('click', () => toggleSidebar(false));

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
      content: "Takaran Saji: 15g | 54 kkal<br><br>Lemak Total: 0g<br>Protein: 0g<br>Karbohidrat: 13g (5%)<br>Gula: 0g<br><br>Komposisi: 100% Umbi garut ekstrak pilihan."
    },
    'nutri-vanilla': {
      title: "Nutrisi Varian Vanilla",
      content: "Takaran Saji: 20g | 75 kkal<br><br>Lemak Total: 0g<br>Protein: 0g<br>Karbohidrat: 19g (6%)<br>Gula: 9g<br><br>Komposisi: Umbi garut ekstrak, gula pasir, perisa sintetis vanilla."
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

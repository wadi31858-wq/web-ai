/* ============================================
   AI SCANNER – JavaScript Logic
   ============================================ */

// ============ IMAGE PATHS ============
const IMGS = {
  whitKoko: 'img/white_koko.png',
  navyKoko: 'img/navy_koko.png',
  manBlack: 'img/man_black.png',
  manBlue:  'img/man_blue.png',
  manGrey:  'img/man_grey.png',
  manOlive: 'img/man_olive.png',
  kokoDetail: 'img/koko_detail.png',
};

// ============ CAMERA STATE ============
let cameraStream = null;
let currentFacingMode = 'environment'; // 'environment' = back, 'user' = front
let flashTrack = null;
let cameraActive = false;
let flashOn = false;

// ============ AI DETECTION STATE ============
let cocoModel = null;
let detectionLoop = null;
let isDetecting = false;
let lastDetection = null;
let audioCtx = null;
let lastBeepTime = 0;
let speechQueue = [];
let isSpeaking = false;

// ============ DATA ============
const products = [
  {
    id: 1,
    name: 'Zenith Mandarin',
    collection: 'ESSENTIALS',
    price: '$124.00',
    priceOld: '$155.00',
    match: 98,
    category: 'koko',
    img: IMGS.manBlack,
    heroImg: IMGS.kokoDetail,
    description: 'The Zenith Mandarin is crafted from premium black Japanese cotton with a modern silhouette. Features reinforced mandarin collar with concealed button technology. Perfect for both formal and semi-formal occasions.',
    material: 'Premium Japanese Cotton blend with nano-fiber reinforcement',
    fit: 'Slim-fit, tapered at waist for athletic silhouettes',
    usage: 'Formal Religious Ceremonies, Business Events, Social Gatherings',
  },
  {
    id: 2,
    name: 'Slate Obsidian',
    collection: 'ELITE SERIES',
    price: '$158.00',
    priceOld: '$190.00',
    match: 94,
    category: 'koko',
    img: IMGS.manGrey,
    heroImg: IMGS.manGrey,
    description: 'Slate Obsidian brings together modern minimalism and traditional elegance. The charcoal-grey hue is achieved through an exclusive double-dye process for long-lasting color intensity.',
    material: 'Merino-Cotton hybrid fabric with moisture management',
    fit: 'Regular-fit with ergonomic shoulder alignment',
    usage: 'Corporate Events, Casual Fridays, Travel-Friendly',
  },
  {
    id: 3,
    name: 'Pearl Cipher',
    collection: 'URBAN CORE',
    price: '$110.00',
    priceOld: '$138.00',
    match: 89,
    category: 'koko',
    img: IMGS.whitKoko,
    heroImg: IMGS.whitKoko,
    description: 'Pearl Cipher redefines the classic white koko with laser-etched micro-patterns on the collar and cuffs. Anti-wrinkle treatment ensures a crisp look throughout the day.',
    material: 'Egyptian Cotton with anti-wrinkle nano coating',
    fit: 'Slim-fit with structured shoulders',
    usage: 'Prayer Sessions, Formal Ceremonies, Eid Celebrations',
  },
  {
    id: 4,
    name: 'Emerald Grid',
    collection: 'TECH WEAR',
    price: '$135.00',
    priceOld: '$168.00',
    match: 87,
    category: 'koko',
    img: IMGS.manOlive,
    heroImg: IMGS.manOlive,
    description: 'Emerald Grid merges tech-wear functionality with koko tradition. Integrated smart-fiber technology monitors temperature and adjusts breathability for all-day comfort.',
    material: 'Smart-fiber Bamboo blend with temperature regulation',
    fit: 'Athletic-fit, designed for active movement',
    usage: 'Outdoor Events, Long Wear, Travel',
  },
  {
    id: 5,
    name: 'Deep Horizon',
    collection: 'CLASSIC KRAH',
    price: '$98.00',
    priceOld: '$122.00',
    match: 82,
    category: 'krah',
    img: IMGS.navyKoko,
    heroImg: IMGS.navyKoko,
    description: 'Deep Horizon captures the essence of the classic kemeja krah with a modern navy twist. Tailored with precision stitching and mother-of-pearl buttons for a refined finishing touch.',
    material: 'Supima Cotton with silk-finish weave',
    fit: 'Classic-fit with relaxed chest allowance',
    usage: 'Everyday Formal, Office Wear, Social Events',
  },
  {
    id: 6,
    name: 'Silver Protocol',
    collection: 'MODERN TAILOR',
    price: '$145.00',
    priceOld: '$175.00',
    match: 78,
    category: 'krah',
    img: IMGS.manBlue,
    heroImg: IMGS.manBlue,
    description: 'Silver Protocol is for the modern gentleman who demands precision. The unique heather-grey fabric is woven from reclaimed premium fiber, making it sustainable without compromising luxury.',
    material: 'Recycled Premium Fiber blend, certified sustainable',
    fit: 'Modern slim-fit with structured front placket',
    usage: 'Business Meetings, Formal Dinners, Weddings',
  },
];

const historyData = [
  {
    id: 'h1',
    date: '24 OCT, 2023 • 14:30',
    title: 'Kemeja Koko Modern',
    match: '98%',
    scanImg: IMGS.kokoDetail,
    results: [
      { name: 'Ethereal White Koko', price: 'Rp 459.000', img: IMGS.whitKoko, productId: 3 },
      { name: 'Navy Krah Classic', price: 'Rp 399.000', img: IMGS.navyKoko, productId: 5 },
    ],
  },
  {
    id: 'h2',
    date: '21 OCT, 2023 • 09:15',
    title: 'Minimalist Kemeja Krah',
    match: '85%',
    scanImg: IMGS.manGrey,
    results: [
      { name: 'Urban Olive Krah', price: 'Rp 329.000', img: IMGS.manOlive, productId: 4 },
    ],
  },
];

const recommendations = [
  { label: 'New Season', name: 'Zenith Black Koko', img: IMGS.manBlack, productId: 1 },
  { label: 'Trending', name: 'Azure Structure', img: IMGS.manBlue, productId: 6 },
];

// ============ APP STATE ============
let currentPage = 'history';
let currentGalleryTab = 'koko';

// ============ NAVIGATION ============
function navigate(target) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Show target page
  const page = document.getElementById('page' + capitalize(target));
  if (page) {
    page.classList.remove('hidden');
    page.querySelectorAll('.fade-in-up').forEach((el, i) => {
      el.style.animationDelay = `${i * 60}ms`;
    });
  }

  // Set active nav
  const navBtn = document.getElementById('nav' + capitalize(target));
  if (navBtn) navBtn.classList.add('active');

  // Update header for scan page
  const header = document.getElementById('topHeader');
  if (target === 'scan') {
    header.style.display = 'none';
  } else {
    header.style.display = 'flex';
  }

  currentPage = target;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============ BOTTOM NAV EVENTS ============
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    // Stop camera when leaving scan
    if (currentPage === 'scan' && target !== 'scan') stopCamera();
    navigate(target);
    // Start camera when entering scan
    if (target === 'scan') setTimeout(() => startCamera(currentFacingMode), 300);
  });
});

// ============ GALLERY ============
function renderGallery(tab = 'koko') {
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '';

  const filtered = products.filter(p => p.category === tab);
  filtered.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'gallery-card fade-in-up';
    card.style.animationDelay = `${i * 80}ms`;
    card.innerHTML = `
      <div class="gallery-card-img-wrap">
        <img class="gallery-card-img" src="${p.img}" alt="${p.name}" loading="lazy" />
        <div class="match-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/></svg>
          ${p.match}% Match
        </div>
      </div>
      <div class="gallery-card-info">
        <p class="gallery-card-collection">${p.collection}</p>
        <p class="gallery-card-name">${p.name}</p>
        <p class="gallery-card-price">${p.price}</p>
      </div>
    `;
    card.addEventListener('click', () => openProductModal(p));
    grid.appendChild(card);
  });
}

// Gallery tabs
document.getElementById('tabKoko').addEventListener('click', () => {
  document.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tabKoko').classList.add('active');
  currentGalleryTab = 'koko';
  renderGallery('koko');
});
document.getElementById('tabKrah').addEventListener('click', () => {
  document.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tabKrah').classList.add('active');
  currentGalleryTab = 'krah';
  renderGallery('krah');
});

// ============ HISTORY ============
function renderHistory() {
  const list = document.getElementById('historyList');
  list.innerHTML = '';

  historyData.forEach((h, i) => {
    const card = document.createElement('div');
    card.className = 'history-card fade-in-up';
    card.style.animationDelay = `${i * 100}ms`;

    const resultsHtml = h.results.map(r => `
      <div class="history-result-item" data-product-id="${r.productId}">
        <img class="history-result-img" src="${r.img}" alt="${r.name}" loading="lazy" />
        <p class="history-result-name">${r.name}</p>
        <p class="history-result-price">${r.price}</p>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="history-card-meta">
        <span class="history-date">${h.date}</span>
        <span class="history-match-badge">${h.match} Match</span>
      </div>
      <h3 class="history-card-title">${h.title}</h3>
      <div class="history-products-row">
        <img class="history-scan-img" src="${h.scanImg}" alt="Scan" loading="lazy" />
        <div class="history-arrow">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9,18 15,12 9,6"/></svg>
        </div>
        <div class="history-results">${resultsHtml}</div>
      </div>
      <div class="history-card-footer">
        <div class="scan-camera-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </div>
      </div>
    `;

    // Click on result item → open product modal
    card.querySelectorAll('.history-result-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const pid = parseInt(item.dataset.productId);
        const product = products.find(p => p.id === pid);
        if (product) openProductModal(product);
      });
    });

    list.appendChild(card);
  });
}

function renderRecommended() {
  const grid = document.getElementById('recGrid');
  grid.innerHTML = '';

  recommendations.forEach((r, i) => {
    const card = document.createElement('div');
    card.className = 'rec-card fade-in-up';
    card.style.animationDelay = `${i * 120}ms`;
    card.innerHTML = `
      <div class="rec-card-img-wrap">
        <img class="rec-card-img" src="${r.img}" alt="${r.name}" loading="lazy" />
        <span class="rec-card-label">${r.label}</span>
        <p class="rec-card-name">${r.name}</p>
      </div>
    `;
    card.addEventListener('click', () => {
      const product = products.find(p => p.id === r.productId);
      if (product) openProductModal(product);
    });
    grid.appendChild(card);
  });
}

// History search filter
document.getElementById('searchInput').addEventListener('input', function() {
  const query = this.value.toLowerCase();
  document.querySelectorAll('.history-card').forEach(card => {
    const title = card.querySelector('.history-card-title').textContent.toLowerCase();
    card.style.display = title.includes(query) ? 'block' : 'none';
  });
});

// ============ PRODUCT MODAL ============
function openProductModal(product) {
  const overlay = document.getElementById('modalOverlay');
  const heroImg = document.getElementById('modalHeroImg');
  const matchPct = document.getElementById('modalMatchPct');
  const collection = document.getElementById('modalCollection');
  const productName = document.getElementById('modalProductName');
  const price = document.getElementById('modalPrice');
  const priceOld = document.getElementById('modalPriceOld');
  const description = document.getElementById('modalDescription');
  const insightMaterial = document.getElementById('insightMaterial').querySelector('.insight-text');
  const insightFit = document.getElementById('insightFit').querySelector('.insight-text');
  const insightUsage = document.getElementById('insightUsage').querySelector('.insight-text');

  heroImg.src = product.heroImg || product.img;
  heroImg.alt = product.name;
  matchPct.textContent = `${product.match}% Match`;
  collection.textContent = product.collection;
  productName.textContent = product.name;
  price.textContent = product.price;
  priceOld.textContent = product.priceOld || '';
  description.textContent = product.description;

  insightMaterial.innerHTML = `Scanning detected <strong class="highlight-teal">${product.material.split(' ').slice(0,3).join(' ')}</strong> — ${product.material}`;
  insightFit.innerHTML = `<strong class="highlight-teal">${product.fit.split(',')[0]}</strong> — ${product.fit}`;
  insightUsage.innerHTML = `Ideal for <strong class="highlight-teal">${product.usage.split(',')[0]}</strong> and related occasions.`;

  // Reset color selection
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  document.querySelector('.color-dot').classList.add('active');

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Scroll modal body to top
  document.getElementById('modalBody').scrollTop = 0;
}

function closeProductModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

document.getElementById('modalBackBtn').addEventListener('click', closeProductModal);
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalOverlay')) closeProductModal();
});

// Color variant selection
document.querySelectorAll('.color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
  });
});

// Cart & Buy buttons
document.getElementById('btnCart').addEventListener('click', () => {
  showToast('✓ Added to cart!');
});
document.getElementById('btnBuy').addEventListener('click', () => {
  showToast('🚀 Redirecting to checkout...');
});

// ============ CAMERA ============
async function startCamera(facingMode = 'environment') {
  const video = document.getElementById('cameraFeed');
  const state = document.getElementById('cameraState');
  const title = document.getElementById('cameraStateTitle');
  const desc = document.getElementById('cameraStateDesc');
  const retryBtn = document.getElementById('cameraRetryBtn');
  const aiBadge = document.getElementById('aiBadgeScan');
  const switchBtn = document.getElementById('switchCameraBtn');
  const guide = document.getElementById('scanGuide');
  const scanLine = document.getElementById('scanLine');

  // Show loading state
  state.classList.remove('hidden');
  title.textContent = 'Memulai Kamera...';
  desc.textContent = 'Mohon izinkan akses kamera di browser kamu';
  retryBtn.classList.remove('show');

  // Stop existing stream
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }

  try {
    const constraints = {
      video: {
        facingMode: facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = cameraStream;

    // Wait for video to be ready
    video.onloadedmetadata = () => {
      video.play();
      video.classList.add('active');
      state.classList.add('hidden');
      aiBadge.style.display = 'flex';
      switchBtn.style.display = 'flex';
      guide.style.display = 'block';
      scanLine.style.display = 'block';
      cameraActive = true;

      // Store flash track
      flashTrack = cameraStream.getVideoTracks()[0];

      // Start AI detection
      startDetectionLoop();
    };
  } catch (err) {
    cameraActive = false;
    video.classList.remove('active');
    state.classList.remove('hidden');
    retryBtn.classList.add('show');

    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      title.textContent = 'Akses Kamera Ditolak';
      desc.textContent = 'Izinkan akses kamera di pengaturan browser kamu, lalu tekan Coba Lagi.';
    } else if (err.name === 'NotFoundError') {
      title.textContent = 'Kamera Tidak Ditemukan';
      desc.textContent = 'Perangkat ini tidak memiliki kamera yang tersedia.';
    } else if (err.name === 'NotReadableError') {
      title.textContent = 'Kamera Sedang Digunakan';
      desc.textContent = 'Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain dan coba lagi.';
    } else {
      title.textContent = 'Gagal Membuka Kamera';
      desc.textContent = `Error: ${err.message}`;
    }
    console.error('Camera error:', err);
  }
}

function stopCamera() {
  // Stop AI detection and ALL audio
  stopDetectionLoop();
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  isSpeaking = false;

  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
  const video = document.getElementById('cameraFeed');
  video.srcObject = null;
  video.classList.remove('active');
  cameraActive = false;

  // Hide camera UI
  document.getElementById('aiBadgeScan').style.display = 'none';
  document.getElementById('switchCameraBtn').style.display = 'none';
  document.getElementById('scanGuide').style.display = 'none';
}

// Switch camera (front/back)
document.getElementById('switchCameraBtn').addEventListener('click', () => {
  currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
  startCamera(currentFacingMode);
  showToast(currentFacingMode === 'user' ? '🤳 Kamera Depan' : '📷 Kamera Belakang');
});

// Retry button
document.getElementById('cameraRetryBtn').addEventListener('click', () => {
  startCamera(currentFacingMode);
});

// Flash toggle using torch API
document.getElementById('scanFlashBtn').addEventListener('click', async function() {
  if (!flashTrack) {
    showToast('⚠️ Flash tidak tersedia');
    return;
  }
  flashOn = !flashOn;
  try {
    await flashTrack.applyConstraints({ advanced: [{ torch: flashOn }] });
    this.style.color = flashOn ? 'var(--teal-light)' : '';
    this.style.background = flashOn ? 'rgba(0,191,165,0.2)' : '';
    showToast(flashOn ? '⚡ Flash ON' : '⚡ Flash OFF');
  } catch (e) {
    showToast('⚠️ Flash tidak didukung perangkat ini');
    flashOn = false;
  }
});

// ============ SCAN SIMULATION ============
document.getElementById('mainScanBtn').addEventListener('click', () => {
  if (!cameraActive) {
    showToast('⚠️ Kamera belum aktif!');
    return;
  }
  captureAndScan();
});

function captureAndScan() {
  // *** STOP all audio & detection immediately ***
  stopDetectionLoop();
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  isSpeaking = false;

  // Capture frame from video
  const video = document.getElementById('cameraFeed');
  const canvas = document.getElementById('captureCanvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Flash effect
  const flash = document.createElement('div');
  flash.style.cssText = 'position:absolute;inset:0;background:white;z-index:10;opacity:0.7;pointer-events:none;border-radius:inherit;';
  document.getElementById('scanViewfinder').appendChild(flash);
  setTimeout(() => flash.remove(), 150);

  startScanSimulation();
}

function startScanSimulation() {
  const overlay = document.getElementById('scanProgressOverlay');
  const pctEl = document.getElementById('scanProgressPct');
  const circle = document.querySelector('.progress-circle');
  const steps = document.querySelectorAll('.progress-step');
  const circumference = 213;

  overlay.classList.add('active');

  let pct = 0;
  const totalDuration = 3000;
  const interval = 40;
  const increment = 100 / (totalDuration / interval);

  // Reset steps
  steps.forEach(s => { s.classList.remove('active', 'done'); });
  steps[0].classList.add('active');
  pctEl.textContent = '0%';
  circle.style.strokeDashoffset = circumference;

  const timer = setInterval(() => {
    pct = Math.min(pct + increment, 100);
    const offset = circumference - (pct / 100) * circumference;
    circle.style.strokeDashoffset = offset;
    pctEl.textContent = Math.round(pct) + '%';

    if (pct >= 33 && pct < 66) {
      steps[0].classList.remove('active'); steps[0].classList.add('done');
      if (!steps[1].classList.contains('done')) steps[1].classList.add('active');
    } else if (pct >= 66) {
      steps[1].classList.remove('active'); steps[1].classList.add('done');
      if (!steps[2].classList.contains('done')) steps[2].classList.add('active');
    }

    if (pct >= 100) {
      clearInterval(timer);
      setTimeout(() => {
        overlay.classList.remove('active');
        // Pick a random product to simulate AI result
        const result = products[Math.floor(Math.random() * products.length)];
        navigate('history');
        setTimeout(() => openProductModal(result), 400);
      }, 600);
    }
  }, interval);
}

// Scan gallery button → go to gallery
// ============ FILE UPLOAD ============
document.getElementById('uploadBtn').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});

// Upload link text
document.getElementById('uploadLink').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});

// Handle file selection
document.getElementById('fileInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Stop camera audio when uploading
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  isSpeaking = false;

  const reader = new FileReader();
  reader.onload = function(ev) {
    const img = document.getElementById('uploadPreviewImg');
    img.src = ev.target.result;
    document.getElementById('uploadPreviewOverlay').classList.add('active');
    document.getElementById('uploadResult').innerHTML = '<p class="upload-result-hint">Klik "Analisis" untuk mendeteksi pakaian</p>';
  };
  reader.readAsDataURL(file);
  // Reset file input so same file can be re-selected
  this.value = '';
});

// Close upload preview
document.getElementById('uploadCloseBtn').addEventListener('click', closeUploadPreview);

function closeUploadPreview() {
  document.getElementById('uploadPreviewOverlay').classList.remove('active');
}

// Reselect file
document.getElementById('uploadReselectBtn').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});

// Analyze uploaded image
document.getElementById('uploadAnalyzeBtn').addEventListener('click', async function() {
  const img = document.getElementById('uploadPreviewImg');
  const resultDiv = document.getElementById('uploadResult');
  const analyzeBtn = this;

  if (!img.src) return;

  analyzeBtn.classList.add('loading');
  analyzeBtn.innerHTML = '<div class="model-spinner" style="width:18px;height:18px;border-width:2px"></div> Menganalisis...';

  // Load model if not loaded
  const model = await loadDetectionModel();
  if (!model) {
    analyzeBtn.classList.remove('loading');
    analyzeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Analisis';
    showToast('⚠️ AI Model gagal dimuat');
    return;
  }

  try {
    // Create temp image for detection
    const tempImg = new Image();
    tempImg.crossOrigin = 'anonymous';
    tempImg.src = img.src;

    await new Promise((resolve) => {
      if (tempImg.complete) resolve();
      else tempImg.onload = resolve;
    });

    const predictions = await model.detect(tempImg);
    const personDetections = predictions.filter(p => p.class === 'person' && p.score > 0.4);

    // Draw on upload detection canvas
    const canvas = document.getElementById('uploadDetectionCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / tempImg.naturalWidth;
    const scaleY = canvas.height / tempImg.naturalHeight;

    if (personDetections.length > 0) {
      const person = personDetections[0];
      const [x, y, w, h] = person.bbox;

      // Draw box
      drawDetectionBox(ctx, x * scaleX, y * scaleY, w * scaleX, h * scaleY, person.score);

      // Analyze color from uploaded image
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = tempImg.naturalWidth;
      tempCanvas.height = tempImg.naturalHeight;
      tempCtx.drawImage(tempImg, 0, 0);

      const clothingY = y + h * 0.15;
      const clothingH = h * 0.5;
      const sx2 = Math.max(0, Math.floor(x + w * 0.2));
      const sy2 = Math.max(0, Math.floor(clothingY));
      const sw2 = Math.max(1, Math.floor(w * 0.6));
      const sh2 = Math.max(1, Math.floor(clothingH));

      let imageData;
      try { imageData = tempCtx.getImageData(sx2, sy2, sw2, sh2); }
      catch(e) { imageData = null; }

      let colorInfo = { r: 128, g: 128, b: 128, hex: '#808080', name: 'Abu-abu' };
      if (imageData) {
        let rT = 0, gT = 0, bT = 0, cnt = 0;
        for (let i = 0; i < imageData.data.length; i += 16) {
          rT += imageData.data[i]; gT += imageData.data[i+1]; bT += imageData.data[i+2]; cnt++;
        }
        if (cnt > 0) {
          const rr = Math.round(rT/cnt), gg = Math.round(gT/cnt), bb = Math.round(bT/cnt);
          colorInfo = { r:rr, g:gg, b:bb, hex:'#'+[rr,gg,bb].map(c=>c.toString(16).padStart(2,'0')).join(''), name: getColorName(rr,gg,bb) };
        }
      }

      const clothingType = classifyClothing(colorInfo, w, h);
      const confidence = Math.round(person.score * 100);

      resultDiv.innerHTML = `
        <div class="upload-result-detected">
          <div class="upload-result-row">
            <span class="upload-result-label">Jenis</span>
            <span class="upload-result-value">${clothingType}</span>
          </div>
          <div class="upload-result-row">
            <span class="upload-result-label">Warna</span>
            <span class="upload-result-value">${colorInfo.name}</span>
            <span class="upload-swatch" style="background:${colorInfo.hex}"></span>
          </div>
          <div class="upload-result-row">
            <span class="upload-result-label">Confidence</span>
            <span class="upload-result-value">${confidence}%</span>
          </div>
        </div>
      `;

      // Play beep for result
      playDetectionBeep(confidence);
      speakDetection(clothingType, colorInfo.name);

    } else {
      resultDiv.innerHTML = '<p class="upload-result-hint" style="color:var(--teal)">Tidak ada pakaian terdeteksi. Coba foto yang lebih jelas.</p>';
    }
  } catch (err) {
    console.error('Upload analysis error:', err);
    resultDiv.innerHTML = '<p class="upload-result-hint" style="color:#e53935">Gagal menganalisis gambar.</p>';
  }

  analyzeBtn.classList.remove('loading');
  analyzeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Analisis';
});

// Menu btn → profile
document.getElementById('menuBtn').addEventListener('click', () => navigate('profile'));
document.getElementById('avatarBtn').addEventListener('click', () => navigate('profile'));

// ============ TOAST NOTIFICATION ============
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2400);
}

// ============ AI CLOTHING DETECTION ============

// Load COCO-SSD model
async function loadDetectionModel() {
  const loading = document.getElementById('aiModelLoading');
  const badge = document.getElementById('aiBadgeText');

  if (cocoModel) return cocoModel; // already loaded

  loading.classList.add('show');
  if (badge) badge.textContent = 'Loading AI...';

  try {
    cocoModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
    loading.classList.remove('show');
    if (badge) badge.textContent = 'AI Active';
    showToast('🧠 AI Model siap!');
    return cocoModel;
  } catch (err) {
    loading.classList.remove('show');
    if (badge) badge.textContent = 'AI Error';
    console.error('Failed to load COCO-SSD:', err);
    showToast('⚠️ Gagal memuat AI model');
    return null;
  }
}

// Start real-time detection loop
async function startDetectionLoop() {
  if (isDetecting) return;
  isDetecting = true;

  const model = await loadDetectionModel();
  if (!model) { isDetecting = false; return; }

  const video = document.getElementById('cameraFeed');
  const dCanvas = document.getElementById('detectionCanvas');
  const dCtx = dCanvas.getContext('2d');

  async function detect() {
    if (!isDetecting || !cameraActive) return;

    // Match canvas to video dimensions
    if (video.videoWidth && video.videoHeight) {
      dCanvas.width = dCanvas.clientWidth;
      dCanvas.height = dCanvas.clientHeight;

      try {
        const predictions = await model.detect(video);
        dCtx.clearRect(0, 0, dCanvas.width, dCanvas.height);

        // Scale factors (video → canvas)
        const scaleX = dCanvas.width / video.videoWidth;
        const scaleY = dCanvas.height / video.videoHeight;

        // Filter for person detections (clothing = person's body)
        const personDetections = predictions.filter(p => p.class === 'person' && p.score > 0.5);

        if (personDetections.length > 0) {
          const person = personDetections[0]; // best detection
          const [x, y, w, h] = person.bbox;

          // Scale to canvas
          const sx = x * scaleX;
          const sy = y * scaleY;
          const sw = w * scaleX;
          const sh = h * scaleY;

          // Draw bounding box
          drawDetectionBox(dCtx, sx, sy, sw, sh, person.score);

          // Clothing region = upper 60% of person (torso area)
          const clothingY = y + h * 0.15;
          const clothingH = h * 0.5;
          const clothingRegion = { x, y: clothingY, w, h: clothingH };

          // Analyze color from video frame
          const colorInfo = analyzeClothingColor(video, clothingRegion);
          const clothingType = classifyClothing(colorInfo, w, h);
          const confidence = Math.round(person.score * 100);

          // Update detection panel
          updateDetectionPanel(clothingType, colorInfo, confidence);

          // Audio feedback (beep + voice)
          if (Date.now() - lastBeepTime > 3000) {
            playDetectionBeep(confidence);
            speakDetection(clothingType, colorInfo.name);
            lastBeepTime = Date.now();
          }

          lastDetection = { clothingType, colorInfo, confidence, region: clothingRegion };
        } else {
          hideDetectionPanel();
        }
      } catch (e) {
        // Detection error, silently continue
      }
    }

    detectionLoop = requestAnimationFrame(detect);
  }

  detect();
}

function stopDetectionLoop() {
  isDetecting = false;
  if (detectionLoop) {
    cancelAnimationFrame(detectionLoop);
    detectionLoop = null;
  }
  hideDetectionPanel();

  // Clear detection canvas
  const dCanvas = document.getElementById('detectionCanvas');
  if (dCanvas) {
    const ctx = dCanvas.getContext('2d');
    ctx.clearRect(0, 0, dCanvas.width, dCanvas.height);
  }
}

// Draw detection bounding box with corner style
function drawDetectionBox(ctx, x, y, w, h, score) {
  const color = `rgba(0, 191, 165, ${0.5 + score * 0.5})`;
  const cornerLen = 20;
  const lineW = 3;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineW;
  ctx.lineCap = 'round';

  // Draw corners only (like viewfinder)
  // Top-left
  ctx.beginPath();
  ctx.moveTo(x, y + cornerLen); ctx.lineTo(x, y); ctx.lineTo(x + cornerLen, y);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(x + w - cornerLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cornerLen);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(x, y + h - cornerLen); ctx.lineTo(x, y + h); ctx.lineTo(x + cornerLen, y + h);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(x + w - cornerLen, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cornerLen);
  ctx.stroke();

  // Subtle fill
  ctx.fillStyle = `rgba(0, 191, 165, 0.06)`;
  ctx.fillRect(x, y, w, h);

  // Label background
  const label = `Pakaian ${Math.round(score * 100)}%`;
  ctx.font = 'bold 11px Inter, sans-serif';
  const textW = ctx.measureText(label).width;
  const labelPad = 6;

  ctx.fillStyle = color;
  roundRect(ctx, x, y - 24, textW + labelPad * 2, 22, 6);
  ctx.fill();

  ctx.fillStyle = 'white';
  ctx.fillText(label, x + labelPad, y - 9);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ============ COLOR ANALYSIS ============
function analyzeClothingColor(video, region) {
  const canvas = document.getElementById('captureCanvas');
  const ctx = canvas.getContext('2d');

  // Draw video frame to capture canvas
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);

  // Sample pixels from clothing region
  const sx = Math.max(0, Math.floor(region.x + region.w * 0.2));
  const sy = Math.max(0, Math.floor(region.y));
  const sw = Math.max(1, Math.floor(region.w * 0.6));
  const sh = Math.max(1, Math.floor(region.h));

  let imageData;
  try {
    imageData = ctx.getImageData(sx, sy, sw, sh);
  } catch (e) {
    return { r: 128, g: 128, b: 128, hex: '#808080', name: 'Abu-abu' };
  }

  const data = imageData.data;
  let rTotal = 0, gTotal = 0, bTotal = 0;
  let count = 0;

  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    rTotal += data[i];
    gTotal += data[i + 1];
    bTotal += data[i + 2];
    count++;
  }

  if (count === 0) return { r: 128, g: 128, b: 128, hex: '#808080', name: 'Abu-abu' };

  const r = Math.round(rTotal / count);
  const g = Math.round(gTotal / count);
  const b = Math.round(bTotal / count);
  const hex = '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
  const name = getColorName(r, g, b);

  return { r, g, b, hex, name };
}

function getColorName(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const brightness = (r + g + b) / 3;
  const saturation = max - min;

  if (brightness < 40) return 'Hitam';
  if (brightness > 220 && saturation < 30) return 'Putih';
  if (saturation < 25) {
    if (brightness < 100) return 'Abu-abu Gelap';
    if (brightness < 170) return 'Abu-abu';
    return 'Abu-abu Terang';
  }

  // Determine hue
  let hue;
  if (max === r) hue = ((g - b) / (max - min)) * 60;
  else if (max === g) hue = (2 + (b - r) / (max - min)) * 60;
  else hue = (4 + (r - g) / (max - min)) * 60;
  if (hue < 0) hue += 360;

  if (hue < 15 || hue >= 345) return 'Merah';
  if (hue < 40) return 'Oranye';
  if (hue < 65) return 'Kuning';
  if (hue < 80) return 'Kuning Kehijauan';
  if (hue < 160) return 'Hijau';
  if (hue < 190) return 'Teal';
  if (hue < 250) return 'Biru';
  if (hue < 290) return 'Ungu';
  if (hue < 345) return 'Merah Muda';

  return 'Warna Campuran';
}

// ============ CLOTHING CLASSIFICATION ============
function classifyClothing(colorInfo, personW, personH) {
  const ratio = personH / personW;

  // Based on aspect ratio & color, make educated guesses
  const types = [
    'Kemeja Koko',
    'Kemeja Formal',
    'Kaos Polos',
    'Jaket',
    'Hoodie',
    'Kemeja Batik',
    'Baju Muslim',
    'Polo Shirt',
  ];

  // Simple heuristic based on color and aspect ratio
  const brightness = (colorInfo.r + colorInfo.g + colorInfo.b) / 3;

  if (brightness < 60) {
    return ratio > 2.5 ? 'Jubah Hitam' : 'Kemeja Koko Hitam';
  }
  if (brightness > 200) {
    return ratio > 2.5 ? 'Baju Muslim Putih' : 'Kemeja Koko Putih';
  }
  if (colorInfo.name.includes('Hijau') || colorInfo.name === 'Teal') {
    return 'Kemeja Koko Modern';
  }
  if (colorInfo.name.includes('Biru')) {
    return ratio > 2.0 ? 'Baju Muslim Biru' : 'Kemeja Formal Biru';
  }
  if (colorInfo.name.includes('Merah') || colorInfo.name === 'Oranye') {
    return 'Kemeja Casual';
  }
  if (colorInfo.name.includes('Abu')) {
    return 'Kemeja Koko Abu-abu';
  }

  // Default
  return types[Math.floor(brightness / 35) % types.length];
}

// ============ UPDATE DETECTION UI ============
function updateDetectionPanel(type, colorInfo, confidence) {
  const panel = document.getElementById('detectionPanel');
  const status = document.getElementById('detectionStatus');
  const typeEl = document.getElementById('detectedType');
  const colorEl = document.getElementById('detectedColor');
  const swatch = document.getElementById('colorSwatch');
  const confEl = document.getElementById('detectedConfidence');
  const pulse = document.querySelector('.detection-pulse');
  const volIndicator = document.getElementById('volumeIndicator');

  panel.classList.add('visible');
  status.textContent = 'Pakaian Terdeteksi';
  pulse.classList.add('detected');

  typeEl.textContent = type;
  colorEl.textContent = colorInfo.name;
  swatch.style.background = colorInfo.hex;
  confEl.textContent = confidence + '%';

  // Volume indicator
  volIndicator.classList.add('show');
  const bars = volIndicator.querySelectorAll('.vol-bar');
  const level = Math.ceil(confidence / 20); // 1-5 bars
  bars.forEach((bar, i) => {
    bar.style.background = i < level ? 'var(--teal-light)' : 'rgba(255,255,255,0.2)';
    bar.style.height = i < level ? `${6 + (i < 3 ? i * 4 : (4 - i) * 4)}px` : '4px';
  });
}

function hideDetectionPanel() {
  const panel = document.getElementById('detectionPanel');
  const volIndicator = document.getElementById('volumeIndicator');
  panel.classList.remove('visible');
  volIndicator.classList.remove('show');
}

// ============ AUDIO FEEDBACK ============
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playDetectionBeep(confidence) {
  try {
    const ctx = initAudio();

    // Create beep tone — higher pitch = higher confidence
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 400 + (confidence * 4); // 400-800 Hz
    gain.gain.value = 0.15;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.stop(ctx.currentTime + 0.3);

    // Second short beep for high confidence
    if (confidence > 80) {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = 600 + (confidence * 3);
      gain2.gain.value = 0.12;
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {
    // Audio not available
  }
}

function speakDetection(type, colorName) {
  if (!('speechSynthesis' in window)) return;
  if (isSpeaking) return;

  isSpeaking = true;
  const msg = new SpeechSynthesisUtterance(`Terdeteksi: ${type}, warna ${colorName}`);
  msg.lang = 'id-ID';
  msg.rate = 1.1;
  msg.volume = 0.8;
  msg.onend = () => { isSpeaking = false; };
  msg.onerror = () => { isSpeaking = false; };

  window.speechSynthesis.cancel(); // cancel any queue
  window.speechSynthesis.speak(msg);
}

// ============ INIT ============
function init() {
  renderGallery('koko');
  renderHistory();
  renderRecommended();
  navigate('history'); // Default page = history
}

// Start when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

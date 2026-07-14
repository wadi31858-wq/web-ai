const URL = "https://teachablemachine.withgoogle.com/models/IC_MzN_EY/";
let model, webcam, maxP, isInit = 0, sProbs = [], isPred = 0, isPaused = 0;
let currentStream = null;
let currentFacingMode = 'user';

const predCanvas = document.createElement('canvas');
predCanvas.width = 224;
predCanvas.height = 224;
const predCtx = predCanvas.getContext('2d');

async function init() {
  if (isInit) return;
  const sBtn = document.getElementById("startBtn"), lCont = document.getElementById("label-container"), wc = document.getElementById("webcam-container");
  sBtn.innerHTML = "⏳ Memuat AI...";
  sBtn.style.pointerEvents = "none";
  sBtn.style.opacity = ".7";
  
  try {
    model = await tmImage.load(URL + "model.json", URL + "metadata.json");
    maxP = model.getTotalClasses();
    
    webcam = document.createElement('video');
    webcam.setAttribute('autoplay', '');
    webcam.setAttribute('playsinline', '');
    webcam.setAttribute('muted', '');
    Object.assign(webcam.style, {
      width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%", borderRadius: "16px", transform: "scaleX(-1)"
    });

    await setupCamera('user');
    
    window.requestAnimationFrame(loop);
    sBtn.style.display = "none";
    document.getElementById("appLayout").classList.add("active");
    document.getElementById("actionButtons").classList.add("active");
    
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        if (videoInputs.length > 1) {
          document.getElementById("btnFlip").style.display = "flex";
        }
      }).catch(e => console.log("Enumerate devices error:", e));
    }

    wc.innerHTML = "";
    wc.appendChild(webcam);
    wc.classList.add("scanning");
    lCont.innerHTML = "";
    sProbs = Array(maxP).fill(0);
    for (let i = 0; i < maxP; i++) {
      lCont.innerHTML += `<div class="label-item"><div class="label-header"><div><span class="class-name">...</span><span class="winner-badge">✨ TERDETEKSI</span></div><span class="percentage-text">0%</span></div><div class="progress-bar-bg"><div class="progress-bar-fill"></div></div></div>`;
    }
    isInit = 1;
  } catch (e) {
    console.error("Init Error:", e);
    alert("Gagal memuat AI atau Kamera.\nJika Anda membuka file ini dari komputer (file:///), Chrome mungkin memblokir akses kamera. Coba buka menggunakan Local Server.\nError: " + e.message);
    sBtn.innerHTML = "❌ Coba Lagi";
    sBtn.style.pointerEvents = "auto";
    sBtn.style.opacity = "1";
  }
}

async function setupCamera(facingMode) {
  if (currentStream) {
    currentStream.getTracks().forEach(t => t.stop());
  }
  
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Browser Anda tidak mendukung akses kamera atau diblokir (harus via HTTPS atau localhost).");
  }

  try {
    currentStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facingMode, width: { ideal: 640 }, height: { ideal: 480 } }
    });
    currentFacingMode = facingMode;
  } catch (e) {
    console.warn("Kamera dengan facingMode gagal, mencoba fallback...", e);
    currentStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } } });
    currentFacingMode = 'user';
  }
  webcam.srcObject = currentStream;
  if (currentFacingMode === 'user') {
    webcam.style.transform = 'scaleX(-1)';
  } else {
    webcam.style.transform = 'scaleX(1)';
  }
  await new Promise((resolve) => {
    if (webcam.readyState >= 1) {
      resolve();
    } else {
      webcam.onloadedmetadata = () => { resolve(); };
    }
  });
  
  try {
    await webcam.play();
  } catch (err) {
    console.warn("Gagal memainkan video kamera:", err);
  }
}

async function flipCamera() {
  if (isPaused) return;
  const btn = document.getElementById("btnFlip");
  btn.style.opacity = "0.5";
  btn.style.pointerEvents = "none";
  let newMode = currentFacingMode === 'user' ? 'environment' : 'user';
  try {
    await setupCamera(newMode);
  } catch (e) {
    alert("Gagal membalik kamera: " + e.message);
  }
  btn.style.opacity = "1";
  btn.style.pointerEvents = "auto";
}

function loop() {
  if (!isPaused) {
    if (!isPred) predict();
  }
  requestAnimationFrame(loop);
}

async function predict(img = null) {
  isPred = 1;
  try {
    let input = img;
    if (!img) {
      if (!webcam || webcam.readyState < 2) {
        isPred = 0;
        return;
      }
      const vw = webcam.videoWidth;
      const vh = webcam.videoHeight;
      if (vw === 0 || vh === 0) {
        isPred = 0; return;
      }
      const minSize = Math.min(vw, vh);
      const sx = (vw - minSize) / 2;
      // Fokus pemotongan (crop) ke bagian kerah baju (atas) daripada tengah dada
      const sy = (vh - minSize) * 0.15;
      
      predCtx.save();
      predCtx.clearRect(0, 0, 224, 224);
      if (webcam.style.transform.includes('scaleX(-1)')) {
          predCtx.translate(224, 0);
          predCtx.scale(-1, 1);
      }
      predCtx.drawImage(webcam, sx, sy, minSize, minSize, 0, 0, 224, 224);
      predCtx.restore();
      input = predCanvas;
    } else {
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      if (iw && ih) {
        const minSize = Math.min(iw, ih);
        const sx = (iw - minSize) / 2;
        const sy = (ih - minSize) * 0.15; // Fokus ke bagian kerah atas
        predCtx.save();
        predCtx.clearRect(0, 0, 224, 224);
        predCtx.drawImage(img, sx, sy, minSize, minSize, 0, 0, 224, 224);
        predCtx.restore();
        input = predCanvas;
      }
    }

    const pred = await model.predict(input);
    let winIdx = pred.reduce((m, c, i, a) => c.probability > a[m].probability ? i : m, 0);
    pred.forEach((p, i) => {
      sProbs[i] = img ? p.probability : sProbs[i] + (p.probability - sProbs[i]) * 0.15;
      let perc = Math.round(sProbs[i] * 100);
      let itm = document.getElementById("label-container").children[i];
      if (!itm) return;
      let fb = itm.querySelector(".progress-bar-fill");
      itm.querySelector(".class-name").innerText = p.className;
      itm.querySelector(".percentage-text").innerText = perc + "%";
      fb.style.width = perc + "%";
      fb.style.background = perc > 75 ? "linear-gradient(90deg,#00b09b,#96c93d)" : perc > 40 ? "linear-gradient(90deg,#f6d365,#fda085)" : "linear-gradient(90deg,#ff0844,#ffb199)";
      fb.style.boxShadow = `0 0 15px ${perc > 75 ? 'rgba(150,201,61,.4)' : perc > 40 ? 'rgba(253,160,133,.4)' : 'rgba(255,8,68,.4)'}`;
      itm.classList.toggle("winner", i === winIdx && perc > 60);
    });
  } catch (e) {
    console.error("Predict Error:", e);
  }
  setTimeout(() => isPred = 0, 350); // Interval diperlambat agar proses CPU sangat ringan
}

function handleUpload(e) {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = (ev) => {
    isPaused = 1;
    const wc = document.getElementById("webcam-container");
    wc.classList.remove("scanning");
    if (webcam) {
      webcam.pause();
      webcam.style.display = "none";
    }
    document.getElementById("uploaded-img")?.remove();
    let img = document.createElement("img");
    img.id = "uploaded-img";
    img.src = ev.target.result;
    Object.assign(img.style, { width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%", borderRadius: "16px", zIndex: "5" });
    wc.appendChild(img);
    let btn = document.getElementById("btnPhoto");
    btn.innerHTML = "🔄 Kembali ke Kamera";
    btn.style.background = "var(--p)";
    btn.style.color = "#fff";
    img.onload = () => predict(img);
  };
  r.readAsDataURL(f);
}

function takeSnapshot() {
  if (!webcam) return;
  const wc = document.getElementById("webcam-container"), btn = document.getElementById("btnPhoto");
  if (isPaused) {
    isPaused = 0;
    document.getElementById("uploaded-img")?.remove();
    if (webcam) {
      webcam.style.display = "block";
      webcam.play();
    }
    btn.innerHTML = "📸 Jepret Foto";
    btn.style.background = "#fff";
    btn.style.color = "var(--p)";
    wc.classList.add("scanning");
    return;
  }
  isPaused = 1;
  wc.classList.remove("scanning");
  webcam.pause(); 
  btn.innerHTML = "🔄 Ulangi Foto";
  btn.style.background = "var(--p)";
  btn.style.color = "#fff";
  
  const flash = document.createElement("div");
  Object.assign(flash.style, { position: "absolute", inset: "0", background: "#fff", zIndex: "20", transition: "opacity .2s" });
  wc.appendChild(flash);
  setTimeout(() => flash.style.opacity = "0", 50);
  setTimeout(() => flash.remove(), 250);
  
  const canvas = document.createElement("canvas");
  let vw = webcam.videoWidth || 400;
  let vh = webcam.videoHeight || 400;
  if (vw > 800) {
    vh = Math.round(vh * 800 / vw);
    vw = 800;
  }
  canvas.width = vw;
  canvas.height = vh;
  const ctx = canvas.getContext("2d");
  if (webcam.style.transform.includes('scaleX(-1)')) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(webcam, 0, 0, canvas.width, canvas.height);
  const dURL = canvas.toDataURL("image/png");
  
  let winLabel = "Menunggu...";
  const winnerItm = document.querySelector(".label-item.winner");
  if(winnerItm) {
      winLabel = winnerItm.querySelector(".class-name").innerText;
  }
  
  let w = document.createElement("div");
  w.className = "photo-item";
  w.innerHTML = `<img src="${dURL}">
  <div class="photo-caption">Gambar Hasil Scan (Terdeteksi: ${winLabel})</div>
  <div class="photo-actions"><button class="btn-photo-action download">Unduh</button><button class="btn-photo-action delete">Hapus</button></div>`;
  w.querySelector(".download").onclick = () => { let a = document.createElement("a"); a.href = dURL; a.download = "Hasil_Scan_" + Date.now() + ".png"; a.click(); };
  w.querySelector(".delete").onclick = () => w.remove();
  document.getElementById("photo-gallery").appendChild(w);
}

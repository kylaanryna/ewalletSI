
    const API_BASE = "http://localhost:3000";

    const state = {
      loggedIn: false,
      loginUsername: "",
      loginPassword: "",
      activeTab: "scan",
      selectedStudentId: null,
      rfidInput: "",
      rfidScanned: false,
      scanAnimating: false,
      cart: {},
      topupAmount: 0,
      cartOpen: false,
      lastOrder: null,
      editingProductId: null,
      productForm: { id: null, name: "", price: 0, emoji: "", cat: "" },
      notice: "",
      noticeType: "ok",
      paymentPhase: "none",
      paymentTotal: 0,
      pinValue: "",
      pinError: "",
      topupPhase: "none",
      topupPinValue: "",
      topupPinError: "",
      students: [],
      products: [
        { id: 1, name: "Roti Coklat", price: 4000, emoji: "B" , cat: "Makanan" },
        { id: 2, name: "Nasi Uduk", price: 8000, emoji: "N", cat: "Makanan" },
        { id: 3, name: "Keripik Singkong", price: 3500, emoji: "K", cat: "Makanan" },
        { id: 4, name: "Donat Gula", price: 3000, emoji: "D", cat: "Makanan" },
        { id: 5, name: "Telur Gulung", price: 2500, emoji: "T", cat: "Makanan" },
        { id: 6, name: "Air Mineral", price: 3000, emoji: "A", cat: "Minuman" },
        { id: 7, name: "Teh Kotak", price: 4000, emoji: "T", cat: "Minuman" },
        { id: 8, name: "Susu Kotak", price: 5000, emoji: "S", cat: "Minuman" },
        { id: 9, name: "Es Cincau", price: 4500, emoji: "E", cat: "Minuman" },
        { id: 10, name: "Buku Tulis", price: 4500, emoji: "B", cat: "Alat Tulis" },
        { id: 11, name: "Pulpen", price: 2500, emoji: "P", cat: "Alat Tulis" },
        { id: 12, name: "Penghapus", price: 1500, emoji: "H", cat: "Alat Tulis" },
        { id: 13, name: "Batagor", price: 5000, emoji: "B", cat: "Makanan" },
        { id: 14, name: "Nasi bakar", price: 7000, emoji: "NB", cat: "Makanan" },
      ],
      chips: [10000, 20000, 50000, 100000, 200000],
      history: [
        { id: 1, type: "payment", name: "Ahmad Fauzan", amount: 12000, admin: "Admin", time: "08:12" },
        { id: 2, type: "topup", name: "Siti Aisyah", amount: 50000, admin: "Admin", time: "09:05" }
      ],
      stats: { transaksi: 12, topupTotal: 350000 }
    };

    const root = document.getElementById("root");

    const rupiah = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
    const esc = (v) => String(v).replace(/[&<>\"']/g, (m) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m]));
    const findStudentByCardId = (cardId) => state.students.find((s) => String(s.card_id || s.cardId || "").trim().toLowerCase() === String(cardId || "").trim().toLowerCase());
    const selectedStudent = () => state.students.find((s) => s.id === state.selectedStudentId) || state.students[0] || { id: 0, name: "Belum ada santri", kelas: "-", saldo: 0 };
    const cartItems = () => Object.entries(state.cart).map(([id, qty]) => {
      const p = state.products.find((x) => x.id === Number(id));
      return p ? { ...p, qty } : null;
    }).filter(Boolean);
    const cartTotal = () => cartItems().reduce((sum, item) => sum + item.price * item.qty, 0);

    function cartWidget() {
      const items = cartItems();
      const total = cartTotal();
      const qty = items.reduce((s, it) => s + it.qty, 0);
      const last = state.lastOrder;
      if (qty === 0) return "";

      return `
        <div class="cart-root" aria-hidden="false">
          <button class="cart-icon" data-action="proceed-payment" aria-label="Berikut">
            <div class="cart-badge">${qty}</div>
            <div style="font-weight:800;">Berikut</div>
          </button>
        </div>
      `;
    }

    function showSweetAlert(message, type = "success", title = "Berhasil") {
      if (!window.Swal) return;

      const colorMap = {
        success: { icon: "success", title: "Berhasil" },
        error: { icon: "error", title: "Gagal" },
        warning: { icon: "warning", title: "Perhatian" },
        info: { icon: "info", title: "Informasi" }
      };

      const config = colorMap[type] || colorMap.success;
      Swal.fire({
        icon: config.icon,
        title: title || config.title,
        text: message,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2200,
        timerProgressBar: true,
        customClass: {
          popup: "simart-swal"
        }
      });
    }

    function flash(message, type = "ok") {
      if (window.Swal) {
        const mapped = type === "err" ? "error" : "success";
        showSweetAlert(message, mapped, type === "err" ? "Gagal" : "Berhasil");
      }
    }

    function flyToCart(startRect, emoji) {
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const target = document.querySelector(".cart-icon");
      let endX = window.innerWidth - 110;
      let endY = 58;
      if (target) {
        const r = target.getBoundingClientRect();
        endX = r.left + r.width / 2;
        endY = r.top + r.height / 2;
      }
      const sx = startRect ? startRect.left + startRect.width / 2 : endX;
      const sy = startRect ? startRect.top + startRect.height / 2 : endY;

      const flyer = document.createElement("div");
      flyer.className = "fly-to-cart";
      flyer.textContent = emoji || "ðŸ›ï¸";
      document.body.appendChild(flyer);

      // Kurva Bezier: titik kontrol di atas agar jalannya melengkung seperti dilempar
      const cx = (sx + endX) / 2;
      const cy = Math.min(sy, endY) - 130;
      const duration = 720;
      const t0 = performance.now();

      function step(now) {
        const t = Math.min((now - t0) / duration, 1);
        const inv = 1 - t;
        const x = inv * inv * sx + 2 * inv * t * cx + t * t * endX;
        const y = inv * inv * sy + 2 * inv * t * cy + t * t * endY;
        const scale = Math.max(1 - 0.55 * t, 0.3);
        flyer.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale}) rotate(${t * 30}deg)`;
        flyer.style.opacity = t > 0.85 ? String((1 - t) / 0.15) : "1";
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          flyer.remove();
          const cart = document.querySelector(".cart-icon");
          if (cart) {
            cart.classList.remove("cart-bump");
            void cart.offsetWidth;
            cart.classList.add("cart-bump");
          }
        }
      }
      requestAnimationFrame(step);
    }

    function pushHistory(entry) {
      state.history = [
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          admin: "Admin",
          ...entry
        },
        ...state.history
      ];
    }

    function openPaymentPin() {
      const student = selectedStudent();
      const total = cartTotal();
      if (total <= 0) {
        flash("Keranjang masih kosong.", "err");
        return;
      }
      if (student.saldo < total) {
        state.topupAmount = total - student.saldo;
        state.paymentPhase = "none";
        state.pinValue = "";
        state.pinError = "";
        state.notice = "Saldo tidak mencukupi. Silakan top up saldo terlebih dahulu.";
        state.noticeType = "err";
        state.activeTab = "topup";
        render();
        return;
      }
      state.paymentTotal = total;
      state.pinValue = "";
      state.pinError = "";
      state.paymentPhase = "pin";
      render();
    }

    function submitPinPayment() {
      const student = selectedStudent();
      const pin = state.pinValue;

      if (pin.length < 6) {
        state.pinError = "Masukkan PIN 6 digit terlebih dahulu.";
        render();
        return;
      }

      if (pin !== "123456") {
        state.pinError = "PIN salah. Silakan coba lagi.";
        state.pinValue = "";
        render();
        return;
      }

      state.pinError = "";
      // save last order details so cart icon can show it
      state.lastOrder = {
        studentName: student.name,
        items: cartItems(),
        total: state.paymentTotal,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      };
      student.saldo -= state.paymentTotal;
      state.stats.transaksi += 1;
      pushHistory({ type: "payment", name: student.name, amount: state.paymentTotal });
      state.cart = {};
      state.cartOpen = false;
      state.paymentPhase = "success";
      state.activeTab = "history";
      render();
    }

    function openTopupPin() {
      const custom = document.getElementById("customTopup");
      const customAmount = custom ? Number(String(custom.value || "").replace(/[^\d]/g, "")) : 0;
      const amount = state.topupAmount || customAmount;
      const student = selectedStudent();
      if (!amount || amount <= 0) {
        flash("Pilih nominal top up dulu.", "err");
        return;
      }
      if (!student) {
        flash("Pilih santri terlebih dahulu.", "err");
        return;
      }
      state.topupPinValue = "";
      state.topupPinError = "";
      state.topupAmount = amount;
      state.topupPhase = "pin";
      render();
    }

    function submitTopupPin() {
      const student = selectedStudent();
      const pin = state.topupPinValue;

      if (pin.length < 6) {
        state.topupPinError = "Masukkan PIN 6 digit terlebih dahulu.";
        render();
        return;
      }

      if (pin !== "123456") {
        state.topupPinError = "PIN salah. Silakan coba lagi.";
        state.topupPinValue = "";
        render();
        return;
      }

      student.saldo += state.topupAmount;
      state.stats.topupTotal += state.topupAmount;
      pushHistory({ type: "topup", name: student.name, amount: state.topupAmount });
      state.topupAmount = 0;
      state.topupPhase = "success";
      state.activeTab = "history";
      render();
    }

    function loginView() {
      return `
        <div class="login-wrap">
          <div class="card-shell">
            <div class="login-grid">
              <section class="hero">
                <div class="brand">
                  <div class="logo" aria-hidden="true">
                    <img src="assets/simart-logo.png" alt="SIMART" />
                  </div>
                  <div>SIMART</div>
                </div>
                <h1>Kelola SIMART<br/></h1>
                <p class="lead">
                  Mulia di Dunia dengan Teknologi, Bisnis dan Dakwah.
                </p>
                <div class="hero-badges">
                  <div class="badge">Pembayaran <small>Jadi lebih mudah</small></div>
                  <div class="badge">Transaksi <small>Aman</small></div>
                </div>
              </section>
              <section class="login-form">
                <div>
                  <div class="title">Masuk ke aplikasi</div>
                  <p class="muted" style="margin-top:10px;">Gunakan demo login: <strong>admin</strong> / <strong>admin123</strong></p>
                </div>
                <form id="loginForm">
                  <div class="field" style="margin-bottom:14px;">
                    <label>Username</label>
                    <div class="input-shell">
                      <span class="input-icon">U</span>
                      <input name="username" autocomplete="username" placeholder="admin" />
                    </div>
                  </div>
                  <div class="field" style="margin-bottom:14px;">
                    <label>Kata sandi</label>
                    <div class="input-shell">
                      <span class="input-icon">P</span>
                      <input name="password" type="password" autocomplete="current-password" placeholder="admin123" />
                    </div>
                  </div>
                  <button class="btn btn-orange" type="submit" style="width:100%;">Masuk</button>
                </form>
              </section>
            </div>
          </div>
        </div>
      `;
    }

    function sidebar() {
      const tabs = [
        ["home", "Home"],
        ["payment", "Bayar"],
        ["topup", "Top Up"],
        ["products", "Produk"],
        ["history", "Riwayat"],
        ["scan", "Scan"]
      ];
      return `
        <aside class="sidebar">
          <div>
            <div class="brand">
              <div class="logo" aria-hidden="true" style="width:38px;height:38px;border-radius:12px;">
                <img src="assets/simart-logo.png" alt="SIMART" />
              </div>
              <div>SIMART</div>
            </div>
            <nav>
              ${tabs.map(([key, label]) => `
                <button class="nav-btn ${state.activeTab === key ? "active" : ""}" data-action="nav" data-tab="${key}">
                  <span class="nav-pill"></span>
                  <span>${label}</span>
                </button>
              `).join("")}
            </nav>
          </div>
          <div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
              <img class="profile-avatar" src="assets/simart-logo.png" alt="Profil SIMART" />
              <div>
                <div style="font-weight:800;">Admin</div>
                <div style="font-size:12px;color:var(--muted);">Kasir SIMART</div>
              </div>
            </div>
            <button class="btn btn-ghost" style="width:100%;" data-action="logout">Keluar</button>
          </div>
        </aside>
      `;
    }

    function bottomNav() {
      const tabs = [
        ["home", "Home"],
        ["payment", "Bayar"],
        ["topup", "Top Up"],
        ["products", "Produk"],
        ["history", "Riwayat"],
        ["scan", "Scan"]
      ];
      return `
        <div class="bottom-nav">
          <div class="bottom-bar">
            ${tabs.map(([key, label]) => `
              <button class="nav-btn ${state.activeTab === key ? "active" : ""}" data-action="nav" data-tab="${key}">
                <span>${label}</span>
              </button>
            `).join("")}
          </div>
        </div>
      `;
    }

    async function loadStudentsFromApi() {
      try {
        const response = await fetch(`${API_BASE}/api/students`);
        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Gagal memuat data santri");
        }

        state.students = result.data || [];
        if (!state.selectedStudentId && state.students.length) {
          state.selectedStudentId = state.students[0].id;
        }
        return true;
      } catch (error) {
        console.error(error);
        state.students = [];
        flash("API server tidak tersedia. Pastikan server backend aktif di port 3000.", "err");
        return false;
      }
    }

    async function processRfidScan(cardId) {
      const normalized = String(cardId || "").trim();
      if (!normalized) {
        flash("Silakan tempel atau masukkan ID kartu santri terlebih dahulu.", "err");
        return;
      }

      try {
        state.scanAnimating = true;
        state.rfidInput = "Scanning...";
        render();

        const response = await fetch(`${API_BASE}/api/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: normalized })
        });

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Kartu tidak valid");
        }

        const student = result.data;
        state.selectedStudentId = student.id;
        state.rfidScanned = true;
        state.rfidInput = "";
        state.activeTab = "payment";
        state.notice = `Santri terdeteksi: ${student.name}`;
        state.noticeType = "ok";
        state.scanAnimating = false;
        showSweetAlert(`Santri terdeteksi: ${student.name}`, "success", "Scan berhasil");
        render();
      } catch (error) {
        state.scanAnimating = false;
        state.rfidInput = "";
        showSweetAlert(error.message || "Gagal membaca kartu RFID.", "error", "Scan gagal");
        flash(error.message || "Gagal membaca kartu RFID.", "err");
      }
    }

    // ID scan terakhir yang sudah diproses, supaya tidak memproses ulang
    // scan yang sama berkali-kali saat polling.
    let lastHandledScanId = 0;
    let scanPollTimer = null;

    async function pollLastScan() {
      // Hanya polling saat tab Scan aktif dan tidak sedang di tengah proses lain.
      if (!state.loggedIn || state.activeTab !== "scan" || state.scanAnimating) return;

      try {
        const response = await fetch(`${API_BASE}/api/last-scan`);
        const result = await response.json();

        if (!result.ok || !result.data) return;

        const scan = result.data;

        // Scan baru dari ESP32 yang belum pernah diproses di web ini.
        if (scan.scanId && scan.scanId !== lastHandledScanId) {
          lastHandledScanId = scan.scanId;

          if (scan.ok && scan.data) {
            state.selectedStudentId = scan.data.id;
            state.rfidScanned = true;
            state.rfidInput = "";
            state.activeTab = "payment";
            state.notice = `Santri terdeteksi: ${scan.data.name}`;
            state.noticeType = "ok";
            render();
            showSweetAlert(`Santri terdeteksi: ${scan.data.name}`, "success", "Scan berhasil");
          } else {
            flash(scan.message || "Kartu tidak dikenali.", "err");
          }
        }
      } catch (error) {
        // Diamkan saja kalau polling gagal (misal server sedang restart),
        // biar tidak spam notifikasi error tiap 1.5 detik.
      }
    }

    function startScanPolling() {
      if (scanPollTimer) return;
      scanPollTimer = setInterval(pollLastScan, 1500);
    }

    function stopScanPolling() {
      if (scanPollTimer) {
        clearInterval(scanPollTimer);
        scanPollTimer = null;
      }
    }

    async function triggerAutoScan() {
      if (!state.students.length) {
        const loaded = await loadStudentsFromApi();
        if (!loaded) return;
      }

      const sequence = state.students.map((student) => String(student.card_id || student.cardId || ""));
      const nextId = sequence[(state.selectedStudentId || 0) % Math.max(sequence.length, 1)] || "212202211";
      state.scanAnimating = true;
      state.rfidInput = "Scanning...";
      render();
      setTimeout(() => {
        processRfidScan(nextId);
      }, 900);
    }

    function scanView() {
      const detectedStudent = state.selectedStudentId ? selectedStudent() : null;
      const hasError = state.noticeType === "err" && state.notice;
      const scanning = !!state.scanAnimating;
      return `
        <div class="page-grid">
          <div class="panel scan-panel">
            <div class="scan-head">
              <div>
                <h2 class="scan-title">Scan Kartu Santri</h2>
                <p class="scan-subtitle">Tempelkan kartu RFID santri pada perangkat pembaca untuk mengenali identitas dan lanjut ke pembayaran.</p>
              </div>
              <div class="status-pill ${hasError ? "fail" : ""}" aria-label="Status RFID">
                <span class="status-dot"></span>
                <span>${hasError ? "Gagal baca" : scanning ? "Membaca..." : "Tersambung"}</span>
              </div>
            </div>

            <div class="scan-stage ${scanning ? "is-scanning" : ""} ${hasError ? "is-fail" : ""}">
              <span class="stage-ring r1"></span>
              <span class="stage-ring r2"></span>
              <span class="stage-line"></span>
              <div class="scan-card-art" aria-hidden="true">
                <div class="art-chip"></div>
                <div class="art-waves"><i></i><i></i><i></i></div>
                <div class="art-num">â€¢â€¢â€¢â€¢ 2201</div>
              </div>
              <p class="stage-hint">${scanning ? "Membaca kartu..." : hasError ? "Kartu tidak dikenali, coba lagi" : "Arahkan kartu ke area ini"}</p>
            </div>

            <form id="rfidForm" class="scan-form">
              <label class="field-label" for="rfidInput">ID Kartu RFID</label>
              <div class="rfid-reader ${scanning ? "is-scanning" : ""}">
                <span class="scan-icon">â—‰</span>
                <input id="rfidInput" name="rfid" type="text" placeholder="Contoh: RFID-001" value="${esc(state.rfidInput)}" autocomplete="off" />
              </div>

              <div class="scan-actions">
                <button class="scan-auto-btn ${scanning ? "is-active" : ""}" type="button" data-action="scan-auto">${scanning ? "Scanning..." : "Scan otomatis"}</button>
                <button class="btn btn-dark" type="submit">Scan Kartu</button>
              </div>
            </form>

            ${detectedStudent ? `
              <div class="selected-student-box">
                <span class="student-box-label">Santri aktif</span>
                <strong>${esc(detectedStudent.name)}</strong>
              </div>
            ` : ""}

            <div class="scan-note">
              ID demo:
              <span class="demo-chip">RFID-001</span>
              <span class="demo-chip">RFID-002</span>
              <span class="demo-chip">RFID-003</span>
            </div>
          </div>
        </div>
      `;
    }

    function homeView() {
      return `
        <div class="page-grid">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;">
            <div>
              <div class="muted">Selamat datang kembali</div>
              <h2 style="font-size:24px;letter-spacing:-0.04em;margin-top:4px;">Admin</h2>
            </div>
            <button class="btn btn-dark" data-action="nav" data-tab="scan">Mulai Bayar</button>
          </div>

          <div class="home-hero">
            <section class="hero-card">
              <h2>Kelola transaksi santri dengan cepat</h2>
              <p>Top up saldo, catat pembayaran, dan lihat riwayat transaksi dalam satu tampilan yang nyaman dipakai di laptop maupun tablet.</p>
              <div class="hero-chip">Top Up Sekarang</div>
            </section>
            <section class="stat-grid">
              <div class="stat-card" style="animation-delay:0.08s;">
                <div style="font-size:12px;color:var(--muted);font-weight:700;">Transaksi</div>
                <div class="stat-value">${state.stats.transaksi}</div>
                <div class="stat-label">Hari ini</div>
              </div>
              <div class="stat-card" style="animation-delay:0.16s;">
                <div style="font-size:12px;color:var(--muted);font-weight:700;">Top Up</div>
                <div class="stat-value">${rupiah(state.stats.topupTotal)}</div>
                <div class="stat-label">Total top up</div>
              </div>
            </section>
          </div>

          <div class="quick-actions">
            <button class="quick-card panel" data-action="nav" data-tab="payment" style="animation-delay:0.12s;">
              <strong>Pembayaran belanja santri</strong>
              <p class="muted">Pilih santri, tambah produk, lalu konfirmasi dengan PIN.</p>
            </button>
            <button class="quick-card panel" data-action="nav" data-tab="topup" style="animation-delay:0.2s;">
              <strong>Top up saldo cepat</strong>
              <p class="muted">Pilih nominal tetap atau isi nominal lain secara manual.</p>
            </button>
          </div>

          <div>
            <div class="section-title">Santri</div>
            <div class="student-row">
              ${state.students.map((s, i) => `
                <button class="student-card ${state.selectedStudentId === s.id ? "active" : ""}" data-action="select-student" data-id="${s.id}" style="animation-delay:${(i + 1) * 0.08}s;">
                  <div class="student-name">${esc(s.name)}</div>
                  <div class="student-sub">${esc(s.kelas)}</div>
                  <div style="margin-top:12px;font-weight:800;color:var(--ink);">${rupiah(s.saldo)}</div>
                </button>
              `).join("")}
            </div>
          </div>
        </div>
      `;
    }

    function paymentView() {
      const student = selectedStudent();
      const total = cartTotal();
      const items = cartItems();
      return `
        <div class="page-grid">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;">
            <div>
              <div class="muted">Pembayaran</div>
              <h2 style="font-size:24px;letter-spacing:-0.04em;margin-top:4px;">Detail belanja</h2>
            </div>
            <button class="btn btn-ghost" data-action="nav" data-tab="scan">Scan Ulang</button>
          </div>

          <div class="field">
            <label>Santri terdeteksi</label>
            <div class="selected-student-box">
              <div>
                <div style="font-size:12px;color:var(--muted);margin-bottom:4px;">Nama</div>
                <div>${esc(selectedStudent().name)}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:12px;color:var(--muted);margin-bottom:4px;">Kelas</div>
                <div>${esc(selectedStudent().kelas)}</div>
              </div>
            </div>
          </div>

          <div>
            <section class="panel" style="padding:18px;">
              <div class="section-title">Produk Tersedia</div>
              ${(() => {
                const cats = [...new Set(state.products.map(p => p.cat))];
                return cats.map(cat => `
                  <div style="margin-top:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><div style="font-weight:800;">${esc(cat)}</div></div>
                    <div class="catalog-grid">
                      ${state.products.filter(p => p.cat === cat).map((p, i) => `
                        <div class="product" style="animation-delay:${(i + 1) * 0.04}s;">
                          <div class="product-top">
                            <div>
                              <div class="emoji-dot">${esc(p.emoji)}</div>
                            </div>
                            <div class="pill">${rupiah(p.price)}</div>
                          </div>
                          <div class="product-name">${esc(p.name)}</div>
                          <div class="product-cat">${esc(p.cat)}</div>
                          ${(() => {
                            const inCart = Number(state.cart[p.id] || 0);
                            return inCart > 0 ? `
                              <div class="qty-stepper">
                                <button type="button" class="qty-btn" data-action="cart-dec" data-id="${p.id}" aria-label="Kurangi jumlah">âˆ’</button>
                                <span class="qty-val">${inCart}</span>
                                <button type="button" class="qty-btn qty-plus" data-action="cart-inc" data-id="${p.id}" aria-label="Tambah jumlah">+</button>
                              </div>
                            ` : `
                              <button class="btn btn-dark" style="width:100%;margin-top:14px;" data-action="add-product" data-id="${p.id}">+ Tambah</button>
                            `;
                          })()}
                        </div>
                      `).join("")}
                    </div>
                  </div>
                `).join("");
              })()}
            </section>
          </div>
        </div>
      `;
    }

    function productsView() {
      const editing = !!state.editingProductId;
      return `
        <div class="page-grid">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;">
            <div>
              <div class="muted">Admin</div>
              <h2 style="font-size:24px;letter-spacing:-0.04em;margin-top:4px;">Dashboard Produk</h2>
            </div>
            <button class="btn btn-ghost" data-action="nav" data-tab="home">Kembali</button>
          </div>

          <div class="panel product-panel">
            <div class="product-panel-head">
              <div class="product-panel-title">
                <span class="panel-icon-chip">${editing ? "âœï¸" : "âž•"}</span>
                <div>
                  <h3 style="margin:0;font-size:18px;letter-spacing:-0.02em;color:var(--ink);">${editing ? "Edit Produk" : "Tambah Produk Baru"}</h3>
                  <div class="muted" style="font-size:12px;margin-top:2px;">Lengkapi detail produk untuk katalog jualan</div>
                </div>
              </div>
              ${editing ? `<span class="edit-badge">Mode Edit</span>` : ""}
            </div>

            <form id="productForm" class="product-form">
              <div class="product-field">
                <span class="field-ico">ðŸ™‚</span>
                <input name="pemoji" placeholder="Emoji" maxlength="4" value="${esc(state.productForm.emoji)}" aria-label="Emoji produk" />
              </div>
              <div class="product-field">
                <span class="field-ico">ðŸ·ï¸</span>
                <input name="pname" placeholder="Nama produk" value="${esc(state.productForm.name)}" aria-label="Nama produk" />
              </div>
              <div class="product-field">
                <span class="field-ico">ðŸ“</span>
                <input name="pcat" placeholder="Kategori" value="${esc(state.productForm.cat)}" aria-label="Kategori produk" />
              </div>
              <div class="product-field">
                <span class="field-ico">ðŸ’°</span>
                <input name="pprice" inputmode="numeric" placeholder="Harga" value="${state.productForm.price || ""}" aria-label="Harga produk" />
              </div>
              <div class="product-actions" style="grid-column:1/-1;">
                <button class="product-primary-btn" type="submit">${editing ? "ðŸ’¾ Simpan Perubahan" : "ï¼‹ Tambah Produk"}</button>
                ${editing ? `<button class="btn btn-ghost" type="button" data-action="cancel-edit-product">Batal</button>` : ""}
              </div>
            </form>
          </div>

          <div style="margin-top:6px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
              <div class="section-title" style="margin-bottom:0;">Daftar Produk</div>
              <span class="count-chip">ðŸ“¦ ${state.products.length} produk</span>
            </div>
            ${state.products.length === 0 ? `
              <div class="empty-state">
                <div style="font-size:30px;">ðŸ“¦</div>
                <div style="font-weight:800;color:var(--ink2);margin-top:8px;">Belum ada produk</div>
                <div style="font-size:13px;margin-top:4px;">Tambahkan produk pertama lewat formulir di atas.</div>
              </div>
            ` : `
              <div class="catalog-grid">
                ${state.products.map((p) => `
                  <div class="product">
                    <div class="product-top">
                      <div><div class="emoji-dot">${esc(p.emoji)}</div></div>
                      <div class="pill">${rupiah(p.price)}</div>
                    </div>
                    <div class="product-name">${esc(p.name)}</div>
                    <div class="product-cat">${esc(p.cat)}</div>
                    <div class="product-card-actions">
                      <button type="button" class="card-btn" data-action="edit-product" data-id="${p.id}">âœï¸ Edit</button>
                      <button type="button" class="card-btn danger" data-action="delete-product" data-id="${p.id}">ðŸ—‘ï¸ Hapus</button>
                    </div>
                  </div>
                `).join("")}
              </div>
            `}
          </div>
        </div>
      `;
    }

    function cartView() {
      const student = selectedStudent();
      const items = cartItems();
      const total = cartTotal();
      const remaining = student.saldo - total;
      return `
        <div class="page-grid">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;">
            <div>
              <div class="muted">Keranjang</div>
              <h2 style="font-size:24px;letter-spacing:-0.04em;margin-top:4px;">Rincian Pesanan</h2>
            </div>
            <button class="btn btn-ghost" data-action="nav" data-tab="payment">Kembali</button>
          </div>

          <div class="panel" style="padding:18px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-weight:900;">${esc(student.name)}</div>
                <div class="muted">${esc(student.kelas)}</div>
              </div>
              <div style="font-weight:900;">Saldo: ${rupiah(student.saldo)}</div>
            </div>

            <div style="margin-top:14px;">
              ${items.length === 0 ? `<div class="muted">Keranjang masih kosong.</div>` : items.map(it => `
                <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px dashed rgba(24,26,20,0.06);">
                  <div style="font-weight:800;">${esc(it.name)} <span class="muted">x ${it.qty}</span></div>
                  <div style="font-weight:900;">${rupiah(it.qty * it.price)}</div>
                </div>
              `).join("")}
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;font-weight:900;">
              <div>Total</div>
              <div>${rupiah(total)}</div>
            </div>

            <div style="margin-top:8px;color:var(--muted);">Sisa saldo setelah bayar: <strong>${rupiah(remaining)}</strong></div>

            <div style="display:flex;gap:10px;margin-top:18px;">
              <button class="btn btn-ghost" data-action="nav" data-tab="payment">Tambah lagi</button>
              <button class="btn btn-orange" data-action="open-payment-pin" ${items.length === 0 ? "disabled" : ""}>Bayar Sekarang</button>
            </div>
          </div>
        </div>
      `;
    }

    function topupView() {
      const student = selectedStudent();
      const amount = state.topupAmount || 0;
      return `
        <div class="page-grid">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;">
            <div>
              <div class="muted">Top Up</div>
              <h2 style="font-size:24px;letter-spacing:-0.04em;margin-top:4px;">Isi saldo santri</h2>
            </div>
            <button class="btn btn-ghost" data-action="nav" data-tab="home">Kembali</button>
          </div>

          <div class="topup-grid">
            <section class="topup-hero">
              <div class="topup-label">Santri dipilih</div>
              <div style="font-size:22px;font-weight:900;letter-spacing:-0.03em;margin-top:8px;">${esc(student.name)}</div>
              <div class="muted" style="margin-top:6px;color:rgba(255,247,220,0.86);">${esc(student.kelas)}</div>

              <div style="margin-top:24px;color:rgba(255,247,220,0.88);font-size:12px;font-weight:700;">Saldo sekarang</div>
              <div class="topup-value">${rupiah(student.saldo)}</div>
              <div class="topup-note">Nominal top up dipilih</div>
              <div style="display:inline-flex; margin-top:16px; padding:10px 16px; border-radius:999px; background:rgba(255,255,255,0.16); border:1px solid rgba(255,255,255,0.2); font-weight:800;">${rupiah(amount)}</div>
            </section>

            <section class="topup-card">
              <div class="section-title" style="margin-bottom:6px;">Pilih nominal</div>
              <div class="chip-grid">
                ${state.chips.map((v, i) => `
                  <button class="chip ${state.topupAmount === v ? "active" : ""}" data-action="pick-topup" data-amount="${v}" style="animation-delay:${(i + 1) * 0.05}s;">${rupiah(v)}</button>
                `).join("")}
              </div>

              <div class="custom-topup field">
                <label class="custom-topup-label">Atau nominal lain</label>
                <div class="input-shell">
                  <span class="input-icon">Rp</span>
                  <input id="customTopup" inputmode="numeric" placeholder="0" />
                </div>
              </div>

              <button class="topup-cta" data-action="open-topup-pin">Top Up</button>
            </section>
          </div>
        </div>
      `;
    }

    function historyView() {
      return `
        <div class="page-grid">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;">
            <div>
              <div class="muted">Riwayat</div>
              <h2 style="font-size:24px;letter-spacing:-0.04em;margin-top:4px;">Transaksi terakhir</h2>
            </div>
            <button class="btn btn-ghost" data-action="nav" data-tab="home">Kembali</button>
          </div>

          <div class="history-grid">
            ${state.history.length === 0 ? `
              <div class="panel" style="padding:28px;text-align:center;color:var(--muted);grid-column:1/-1;">Belum ada transaksi hari ini.</div>
            ` : state.history.map((h, i) => `
              <div class="history-card ${h.type}" style="animation-delay:${(i + 1) * 0.05}s;">
                <div class="history-top">
                  <div>
                    <div class="pill" style="margin-bottom:12px;">${h.type === "topup" ? "Top Up" : "Pembayaran"}</div>
                    <div style="font-weight:900;font-size:16px;">${esc(h.name)}</div>
                    <div class="muted" style="margin-top:4px;">Kasir ${esc(h.admin)} | ${esc(h.time)}</div>
                  </div>
                  <div class="pill">${rupiah(h.amount)}</div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    function pinView() {
      const student = selectedStudent();
      const pinDots = Array.from({ length: 6 }, (_, idx) => `
        <span class="pin-dot ${idx < state.pinValue.length ? "filled" : ""}"></span>
      `).join("");

      return `
        <div class="page-grid">
          <div class="panel pin-panel">
            <div class="pin-header">
              <button class="btn btn-ghost" data-action="cancel-pin">Batal</button>
              <div class="muted">Checkout aman</div>
            </div>

            <div class="pin-summary">
              <div class="pin-icon">ðŸ’³</div>
              <div>
                <div class="muted" style="font-size:11px;">Pembayaran untuk</div>
                <div style="font-weight:900;font-size:22px;letter-spacing:-0.03em;">${esc(student.name)}</div>
              </div>
            </div>

            <div class="pin-total">${rupiah(state.paymentTotal)}</div>

            <div class="pin-display">
              ${pinDots}
            </div>

            ${state.pinError ? `<div class="flash err">${esc(state.pinError)}</div>` : ""}

            <div class="pin-pad">
              ${["1","2","3","4","5","6","7","8","9"].map((d) => `
                <button class="pin-key" data-action="pin-key" data-digit="${d}">${d}</button>
              `).join("")}
              <div></div>
              <button class="pin-key" data-action="pin-key" data-digit="0">0</button>
              <button class="pin-key pin-del" data-action="pin-del">âŒ«</button>
            </div>

            <div class="pin-actions">
              <button class="btn btn-ghost" data-action="cancel-pin">Batalkan</button>
              <button class="btn btn-orange" data-action="pin-submit" ${state.pinValue.length !== 6 ? "disabled" : ""}>Bayar Sekarang</button>
            </div>
          </div>
        </div>
      `;
    }

    function paymentSuccessView() {
      const student = selectedStudent();
      return `
        <div class="page-grid">
          <div class="panel success-panel">
            <div class="success-badge">âœ“</div>
            <div class="success-title">Pembayaran Berhasil</div>
            <p class="muted" style="text-align:center;line-height:1.6;">
              Transaksi untuk <strong>${esc(student.name)}</strong> sudah diproses dengan aman.
            </p>

            <div class="success-box">
              <div class="success-row">
                <span>Nama Santri</span>
                <strong>${esc(student.name)}</strong>
              </div>
              <div class="success-row">
                <span>Total Bayar</span>
                <strong>${rupiah(state.paymentTotal)}</strong>
              </div>
              <div class="success-row">
                <span>Sisa Saldo</span>
                <strong>${rupiah(student.saldo)}</strong>
              </div>
            </div>

            <button class="btn btn-dark" data-action="payment-success-done" style="width:100%;margin-top:18px;">
              Kembali ke Menu
            </button>
          </div>
        </div>
      `;
    }

    function topupPinView() {
      const student = selectedStudent();
      const pinDots = Array.from({ length: 6 }, (_, idx) => `
        <span class="pin-dot ${idx < state.topupPinValue.length ? "filled" : ""}"></span>
      `).join("");

      return `
        <div class="page-grid">
          <div class="panel pin-panel" style="padding:24px;">
            <div class="pin-header">
              <button class="btn btn-ghost" data-action="cancel-topup-pin">Batal</button>
              <div class="muted">Verifikasi aman</div>
            </div>

            <div class="pin-summary">
              <div class="pin-icon">ðŸ”’</div>
              <div>
                <div class="muted" style="font-size:11px;">Top Up untuk</div>
                <div style="font-weight:900;font-size:22px;letter-spacing:-0.03em;">${esc(student.name)}</div>
              </div>
            </div>

            <div class="pin-total">${rupiah(state.topupAmount)}</div>

            <div class="pin-display">
              ${pinDots}
            </div>

            ${state.topupPinError ? `<div class="flash err">${esc(state.topupPinError)}</div>` : ""}

            <div class="pin-pad">
              ${["1","2","3","4","5","6","7","8","9"].map((d) => `
                <button class="pin-key" data-action="topup-pin-key" data-digit="${d}">${d}</button>
              `).join("")}
              <div></div>
              <button class="pin-key" data-action="topup-pin-key" data-digit="0">0</button>
              <button class="pin-key pin-del" data-action="topup-pin-del">âŒ«</button>
            </div>

            <div class="pin-actions">
              <button class="btn btn-ghost" data-action="cancel-topup-pin">Batalkan</button>
              <button class="btn btn-orange" data-action="topup-pin-submit" ${state.topupPinValue.length !== 6 ? "disabled" : ""}>Konfirmasi Top Up</button>
            </div>
          </div>
        </div>
      `;
    }

    function topupSuccessView() {
      const student = selectedStudent();
      return `
        <div class="page-grid">
          <div class="panel success-panel">
            <div class="success-badge">âœ“</div>
            <div class="success-title">Top Up Berhasil</div>
            <p class="muted" style="text-align:center;line-height:1.6;">
              Saldo <strong>${esc(student.name)}</strong> berhasil ditambahkan.
            </p>

            <div class="success-box">
              <div class="success-row">
                <span>Nama Santri</span>
                <strong>${esc(student.name)}</strong>
              </div>
              <div class="success-row">
                <span>Nominal</span>
                <strong>${rupiah(state.topupAmount)}</strong>
              </div>
              <div class="success-row">
                <span>Saldo Baru</span>
                <strong>${rupiah(student.saldo)}</strong>
              </div>
            </div>

            <button class="btn btn-dark" data-action="topup-success-done" style="width:100%;margin-top:18px;">
              Kembali ke Menu
            </button>
          </div>
        </div>
      `;
    }

    function appView() {
      return `
        <div class="main-wrap">
          <div class="card-shell" style="display:flex;min-height:calc(100vh - 48px);">
            ${sidebar()}
            <main class="main">
              <div class="main-scroll">
                ${state.paymentPhase === "pin" ? pinView() : ""}
                ${state.paymentPhase === "success" ? paymentSuccessView() : ""}
                ${state.topupPhase === "pin" ? topupPinView() : ""}
                ${state.topupPhase === "success" ? topupSuccessView() : ""}
                ${state.paymentPhase === "none" && state.topupPhase === "none" && state.activeTab === "scan" ? scanView() : ""}
                ${state.paymentPhase === "none" && state.topupPhase === "none" && state.activeTab === "home" ? homeView() : ""}
                ${state.paymentPhase === "none" && state.topupPhase === "none" && state.activeTab === "payment" ? paymentView() : ""}
                ${state.paymentPhase === "none" && state.topupPhase === "none" && state.activeTab === "cart" ? cartView() : ""}
                ${state.paymentPhase === "none" && state.topupPhase === "none" && state.activeTab === "products" ? productsView() : ""}
                ${state.paymentPhase === "none" && state.topupPhase === "none" && state.activeTab === "topup" ? topupView() : ""}
                ${state.paymentPhase === "none" && state.topupPhase === "none" && state.activeTab === "history" ? historyView() : ""}
              </div>
              ${bottomNav()}
            </main>
            ${cartWidget()}
          </div>
        </div>
      `;
    }

    function render() {
      root.innerHTML = state.loggedIn ? appView() : loginView();
    }

    root.addEventListener("submit", (e) => {
      if (e.target && e.target.id === "loginForm") {
        e.preventDefault();
        const fd = new FormData(e.target);
        const username = String(fd.get("username") || "").trim();
        const password = String(fd.get("password") || "");
        if (username === "admin" && password === "admin123") {
          state.loggedIn = true;
          state.activeTab = "scan";
          state.selectedStudentId = null;
          state.rfidScanned = false;
          state.rfidInput = "";
          state.notice = "";
          loadStudentsFromApi();
          render();
        } else {
          flash("Username atau kata sandi salah.", "err");
        }
      }

      // product form submit (add / save)
      if (e.target && e.target.id === "productForm") {
        e.preventDefault();
        const fd = new FormData(e.target);
        const emoji = String(fd.get("pemoji") || "").trim();
        const name = String(fd.get("pname") || "").trim();
        const cat = String(fd.get("pcat") || "").trim() || "Umum";
        const price = Number(String(fd.get("pprice") || "0").replace(/[^0-9]/g, "")) || 0;
        if (!name || price <= 0) {
          flash("Nama dan harga produk harus diisi.", "err");
          return;
        }

        if (state.editingProductId) {
          // update
          const idx = state.products.findIndex(p => p.id === state.editingProductId);
          if (idx >= 0) {
            state.products[idx] = { ...state.products[idx], emoji, name, cat, price };
            flash("Produk diperbarui.", "ok");
          }
          state.editingProductId = null;
          state.productForm = { id: null, name: "", price: 0, emoji: "", cat: "" };
          render();
          return;
        }

        // add new
        const id = Date.now();
        state.products.push({ id, name, price, emoji: emoji || "â€¢", cat });
        flash("Produk ditambahkan.", "ok");
        state.productForm = { id: null, name: "", price: 0, emoji: "", cat: "" };
        render();
      }

      if (e.target && e.target.id === "rfidForm") {
        e.preventDefault();
        const fd = new FormData(e.target);
        const cardId = String(fd.get("rfid") || "").trim();
        state.rfidInput = cardId;
        processRfidScan(cardId);
      }
    });

    root.addEventListener("click", (e) => {
      const el = e.target.closest("[data-action]");
      if (!el) return;
      const action = el.dataset.action;

      if (action === "logout") {
        state.loggedIn = false;
        state.cart = {};
        state.topupAmount = 0;
        state.paymentPhase = "none";
        state.paymentTotal = 0;
        state.pinValue = "";
        state.pinError = "";
        state.notice = "";
        render();
        return;
      }

      if (action === "toggle-cart") {
        state.cartOpen = !state.cartOpen;
        render();
        return;
      }

      if (action === "proceed-payment") {
        state.activeTab = 'cart';
        state.cartOpen = false;
        render();
        return;
      }

      if (action === "open-payment-pin") {
        // from cart page: open PIN to confirm payment
        openPaymentPin();
        return;
      }

      if (action === "nav") {
        state.activeTab = el.dataset.tab;
        state.paymentPhase = "none";
        state.paymentTotal = 0;
        state.pinValue = "";
        state.pinError = "";
        state.notice = "";
        if (state.activeTab === "scan") {
          state.rfidInput = "";
        }
        render();
        return;
      }

      if (action === "scan-auto") {
        triggerAutoScan();
        return;
      }

      if (action === "demo-scan") {
        processRfidScan("RFID-001");
        return;
      }

      if (action === "select-student") {
        state.selectedStudentId = Number(el.dataset.id);
        render();
        return;
      }

      if (action === "add-product") {
        const id = Number(el.dataset.id);
        const product = state.products.find((p) => p.id === id);
        const cardEl = el.closest(".product");
        const dotEl = cardEl ? cardEl.querySelector(".emoji-dot") : null;
        const startRect = dotEl ? dotEl.getBoundingClientRect() : null;
        state.cart[id] = (state.cart[id] || 0) + 1;
        render();
        flyToCart(startRect, product ? product.emoji : "");
        return;
      }

      if (action === "cart-inc") {
        const id = Number(el.dataset.id);
        const product = state.products.find((p) => p.id === id);
        const cardEl = el.closest(".product");
        const dotEl = cardEl ? cardEl.querySelector(".emoji-dot") : null;
        const startRect = dotEl ? dotEl.getBoundingClientRect() : null;
        state.cart[id] = (state.cart[id] || 0) + 1;
        render();
        flyToCart(startRect, product ? product.emoji : "");
        return;
      }

      if (action === "cart-dec") {
        const id = Number(el.dataset.id);
        state.cart[id] = Math.max(0, (state.cart[id] || 0) - 1);
        if (state.cart[id] === 0) delete state.cart[id];
        render();
        return;
      }

      if (action === "cart-remove") {
        delete state.cart[Number(el.dataset.id)];
        render();
        return;
      }

      if (action === "edit-product") {
        const id = Number(el.dataset.id);
        const p = state.products.find(x => x.id === id);
        if (!p) return;
        state.editingProductId = id;
        state.productForm = { id: p.id, name: p.name, price: p.price, emoji: p.emoji, cat: p.cat };
        render();
        return;
      }

      if (action === "delete-product") {
        const id = Number(el.dataset.id);
        state.products = state.products.filter(x => x.id !== id);
        // remove from cart if present
        if (state.cart[id]) delete state.cart[id];
        flash("Produk dihapus.", "ok");
        render();
        return;
      }

      if (action === "cancel-edit-product") {
        state.editingProductId = null;
        state.productForm = { id: null, name: "", price: 0, emoji: "", cat: "" };
        render();
        return;
      }

      if (action === "pick-topup") {
        state.topupAmount = Number(el.dataset.amount);
        render();
        return;
      }

      if (action === "confirm-payment") {
        openPaymentPin();
        return;
      }

      if (action === "cancel-pin") {
        state.paymentPhase = "none";
        state.pinValue = "";
        state.pinError = "";
        render();
        return;
      }

      if (action === "pin-key") {
        const digit = el.dataset.digit;
        if (state.pinValue.length >= 6) return;
        state.pinValue += digit;
        state.pinError = "";
        render();
        return;
      }

      if (action === "pin-del") {
        state.pinValue = state.pinValue.slice(0, -1);
        state.pinError = "";
        render();
        return;
      }

      if (action === "pin-submit") {
        submitPinPayment();
        return;
      }

      if (action === "payment-success-done") {
        state.paymentPhase = "none";
        state.pinValue = "";
        state.pinError = "";
        state.paymentTotal = 0;
        state.activeTab = "home";
        state.notice = "Pembayaran berhasil.";
        state.noticeType = "ok";
        render();
        return;
      }

      if (action === "open-topup-pin") {
        openTopupPin();
        return;
      }

      if (action === "cancel-topup-pin") {
        state.topupPhase = "none";
        state.topupPinValue = "";
        state.topupPinError = "";
        render();
        return;
      }

      if (action === "topup-pin-key") {
        const digit = el.dataset.digit;
        if (state.topupPinValue.length >= 6) return;
        state.topupPinValue += digit;
        state.topupPinError = "";
        render();
        return;
      }

      if (action === "topup-pin-del") {
        state.topupPinValue = state.topupPinValue.slice(0, -1);
        state.topupPinError = "";
        render();
        return;
      }

      if (action === "topup-pin-submit") {
        submitTopupPin();
        return;
      }

      if (action === "topup-success-done") {
        state.topupPhase = "none";
        state.topupPinValue = "";
        state.topupPinError = "";
        state.topupAmount = 0;
        state.activeTab = "home";
        state.notice = "Top up berhasil.";
        state.noticeType = "ok";
        render();
        return;
      }

      if (action === "confirm-topup") {
        openTopupPin();
      }
    });

    // close cart dropdown when clicking outside
    window.addEventListener("click", (e) => {
      if (state.cartOpen && !e.target.closest('.cart-root')) {
        state.cartOpen = false;
        render();
      }
    });

    async function initScanBaseline() {
      // Tandai scan yang sudah ada sebelum web ini dibuka sebagai "sudah
      // ditangani", supaya saat pertama buka tab Scan tidak langsung
      // memunculkan scan lama.
      try {
        const response = await fetch(`${API_BASE}/api/last-scan`);
        const result = await response.json();
        if (result.ok && result.data && result.data.scanId) {
          lastHandledScanId = result.data.scanId;
        }
      } catch (error) {
        // Server mungkin belum siap, tidak apa-apa, polling akan coba lagi.
      }
    }

    loadStudentsFromApi();
    render();
    initScanBaseline();
    // Polling berjalan terus di background; pollLastScan sendiri yang
    // memutuskan kapan boleh memproses (hanya saat login & tab Scan aktif).
    startScanPolling();
  

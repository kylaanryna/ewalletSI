import { useState, useMemo, useEffect } from "react";
import {
  QrCode,
  ShoppingBasket,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Delete,
  CheckCircle2,
  Wallet,
  Lock,
  User,
  Receipt,
  TrendingUp,
  Search,
  SlidersHorizontal,
  Heart,
  MoreVertical,
  Home as HomeIcon,
  LogOut,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/* Tokens                                                                   */
/* ---------------------------------------------------------------------- */
const C = {
  bg: "#FAFAF6",
  surface: "#FFFFFF",
  line: "rgba(24,26,20,0.08)",
  lineSoft: "rgba(24,26,20,0.05)",
  ink: "#1B1D17",
  ink2: "#4A4C42",
  muted: "#8B8D80",
  mint: "#57C9A3",
  mintTint: "#E6F6EF",
  gold: "#E3A93F",
  goldTint: "#FBF1DE",
  orange: "#E07B3F",
  orangeTint: "#FCEBDE",
  inkTint: "#EEEFE9",
  danger: "#C24D4D",
};

const FONT = "Manrope, ui-sans-serif, system-ui, sans-serif";

const STUDENTS = [
  { id: 1, name: "Ahmad Fauzan", kelas: "VII · Ibnu Sina", saldo: 85000 },
  { id: 2, name: "Siti Aisyah", kelas: "VIII · Az-Zahra", saldo: 42500 },
  { id: 3, name: "Muhammad Rizki", kelas: "IX · Al-Farabi", saldo: 128000 },
];

const CATEGORIES = [
  { key: "Semua", emoji: "🧺" },
  { key: "Makanan", emoji: "🍞" },
  { key: "Minuman", emoji: "🧃" },
  { key: "Alat Tulis", emoji: "📓" },
];

const PRODUCTS = [
  { id: 1, name: "Roti Coklat", price: 4000, emoji: "🍞", cat: "Makanan" },
  { id: 2, name: "Nasi Uduk", price: 8000, emoji: "🍚", cat: "Makanan" },
  { id: 3, name: "Keripik Singkong", price: 3500, emoji: "🥔", cat: "Makanan" },
  { id: 4, name: "Donat Gula", price: 3000, emoji: "🍩", cat: "Makanan" },
  { id: 5, name: "Telur Gulung", price: 2500, emoji: "🍢", cat: "Makanan" },
  { id: 6, name: "Air Mineral", price: 3000, emoji: "💧", cat: "Minuman" },
  { id: 7, name: "Teh Kotak", price: 4000, emoji: "🧃", cat: "Minuman" },
  { id: 8, name: "Susu Kotak", price: 5000, emoji: "🥛", cat: "Minuman" },
  { id: 9, name: "Es Cincau", price: 4500, emoji: "🧋", cat: "Minuman" },
  { id: 10, name: "Buku Tulis", price: 4500, emoji: "📓", cat: "Alat Tulis" },
  { id: 11, name: "Pulpen", price: 2500, emoji: "🖊️", cat: "Alat Tulis" },
  { id: 12, name: "Penghapus", price: 1500, emoji: "🧽", cat: "Alat Tulis" },
];

const TOPUP_CHIPS = [10000, 20000, 50000, 100000, 200000];
const CARD_TINTS = [C.mintTint, C.goldTint, C.orangeTint];
const NAV_TABS = [
  { key: "home", label: "Home", icon: HomeIcon },
  { key: "payment", label: "Bayar", icon: ShoppingBasket },
  { key: "topup", label: "Top Up", icon: Wallet },
  { key: "history", label: "Riwayat", icon: Receipt },
];

const rupiah = (n) =>
  "Rp" + Math.round(n).toLocaleString("id-ID", { maximumFractionDigits: 0 });

/* ---------------------------------------------------------------------- */
/* Responsive helper                                                        */
/* ---------------------------------------------------------------------- */

function useIsDesktop(breakpoint = 1024) {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= breakpoint : false
  );
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= breakpoint);
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isDesktop;
}

/* ---------------------------------------------------------------------- */
/* Shared bits                                                              */
/* ---------------------------------------------------------------------- */

function Logo({ size = 28 }) {
  const cols = [C.mint, C.gold, C.orange, C.ink];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        overflow: "hidden",
        boxShadow: `0 0 0 1px ${C.line}`,
        flexShrink: 0,
      }}
    >
      {cols.map((c, i) => (
        <div key={i} style={{ background: c }} />
      ))}
    </div>
  );
}

function BackChip({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition shrink-0"
      style={{ background: "#fff", border: `1px solid ${C.line}`, boxShadow: "0 3px 10px -4px rgba(24,26,20,0.15)" }}
    >
      <ChevronLeft size={18} color={C.ink} />
    </button>
  );
}

function IconChip({ icon: Icon }) {
  return (
    <button
      className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition shrink-0"
      style={{ background: C.inkTint }}
    >
      <Icon size={15} color={C.ink2} />
    </button>
  );
}

function CategoryPill({ emoji, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-full pl-1.5 pr-4 py-1.5 shrink-0 active:scale-95 transition"
      style={{ background: active ? C.mintTint : "#fff", border: `1.5px solid ${active ? C.mint : C.line}` }}
    >
      <span className="w-7 h-7 rounded-full flex items-center justify-center text-[13px]" style={{ background: "#fff" }}>
        {emoji}
      </span>
      <span className="text-[11.5px] font-bold" style={{ color: C.ink }}>
        {label}
      </span>
    </button>
  );
}

function PillButton({ children, onClick, disabled, tone = "ink" }) {
  const tones = {
    ink: { bg: C.ink, fg: "#fff" },
    mint: { bg: C.mint, fg: "#fff" },
    orange: { bg: C.orange, fg: "#fff" },
  };
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-full py-4 flex items-center justify-center gap-2 text-[13.5px] font-bold active:scale-[0.98] transition disabled:opacity-35"
      style={{ background: t.bg, color: t.fg, boxShadow: `0 14px 24px -12px ${t.bg}aa` }}
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/* Navigation — sidebar (desktop) / bottom nav (mobile & tablet)           */
/* ---------------------------------------------------------------------- */

function Sidebar({ active, onNav, adminName, onLogout }) {
  return (
    <div
      className="w-64 shrink-0 min-h-screen flex flex-col justify-between py-8 px-5"
      style={{ background: C.surface, borderRight: `1px solid ${C.line}` }}
    >
      <div>
        <div className="flex items-center gap-2.5 px-2 mb-10">
          <Logo size={32} />
          <span className="text-[15px] font-extrabold" style={{ color: C.ink }}>
            SIMART
          </span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_TABS.map((t) => {
            const isActive = t.key === active;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => onNav(t.key)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition active:scale-[0.98]"
                style={{ background: isActive ? C.ink : "transparent", color: isActive ? "#fff" : C.ink2 }}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div>
        <div className="flex items-center gap-2.5 px-2 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold" style={{ background: C.ink, color: "#fff" }}>
            {adminName ? adminName[0].toUpperCase() : "A"}
          </div>
          <div>
            <p className="text-[11.5px] font-bold" style={{ color: C.ink }}>
              {adminName || "Admin"}
            </p>
            <p className="text-[9.5px]" style={{ color: C.muted }}>
              Kasir SIMART
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition active:scale-[0.98]"
          style={{ color: C.muted }}
        >
          <LogOut size={16} /> Keluar
        </button>
      </div>
    </div>
  );
}

function MobileBottomNav({ active, onNav }) {
  return (
    <div className="px-4 sm:px-6 pb-3 pt-2 shrink-0">
      <div className="flex items-center justify-between rounded-full px-2 py-2 max-w-2xl mx-auto" style={{ background: C.ink }}>
        {NAV_TABS.map((t) => {
          const isActive = t.key === active;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => onNav(t.key)}
              className="flex items-center gap-1.5 rounded-full px-3 py-2.5 transition active:scale-95"
              style={{ background: isActive ? "rgba(255,255,255,0.16)" : "transparent" }}
            >
              <Icon size={16} color={isActive ? "#fff" : "rgba(255,255,255,0.55)"} />
              {isActive && <span className="text-[10.5px] font-semibold text-white">{t.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Login                                                                     */
/* ---------------------------------------------------------------------- */

function LoginScreen({ onLogin, desktop }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (username.trim() === "admin" && password === "admin123") {
      setError("");
      onLogin(username.trim());
    } else {
      setError("Username atau kata sandi salah.");
    }
  };

  const hero = (
    <div
      className={desktop ? "relative flex flex-col justify-center px-10 py-12 w-full lg:w-[42%]" : "relative mx-5 mt-2 rounded-[28px] px-6 pt-8 pb-14 overflow-hidden"}
      style={{ background: `linear-gradient(155deg, ${C.mintTint}, ${C.goldTint})`, borderRadius: desktop ? 0 : 28 }}
    >
      <Logo size={38} />
      <h1 className="text-[26px] font-extrabold leading-tight mt-7" style={{ color: C.ink }}>
        Kelola SIMART
        <br />
        Jadi Lebih Mudah
      </h1>
      <p className="text-[12.5px] mt-2 max-w-[240px]" style={{ color: C.ink2 }}>
        Satu aplikasi kasir untuk pembayaran dan top up saldo santri — di HP, tablet, maupun laptop.
      </p>

      {!desktop && (
        <>
          <div
            className="absolute -bottom-5 left-6 rounded-2xl px-3.5 py-2.5 flex items-center gap-2"
            style={{ background: "#fff", boxShadow: "0 10px 24px -10px rgba(24,26,20,0.25)" }}
          >
            <Lock size={14} color={C.mint} />
            <div>
              <p className="text-[11px] font-extrabold leading-none" style={{ color: C.ink }}>
                PIN Terenkripsi
              </p>
              <p className="text-[9px] mt-0.5" style={{ color: C.muted }}>
                Transaksi aman
              </p>
            </div>
          </div>
          <div
            className="absolute -bottom-5 right-6 rounded-2xl px-3.5 py-2.5 flex items-center gap-2"
            style={{ background: "#fff", boxShadow: "0 10px 24px -10px rgba(24,26,20,0.25)" }}
          >
            <Receipt size={14} color={C.orange} />
            <div>
              <p className="text-[11px] font-extrabold leading-none" style={{ color: C.ink }}>
                Real-time
              </p>
              <p className="text-[9px] mt-0.5" style={{ color: C.muted }}>
                Catat otomatis
              </p>
            </div>
          </div>
        </>
      )}

      {desktop && (
        <div className="flex gap-3 mt-8">
          <div className="rounded-2xl px-3.5 py-2.5 flex items-center gap-2" style={{ background: "#fff" }}>
            <Lock size={14} color={C.mint} />
            <p className="text-[11px] font-extrabold" style={{ color: C.ink }}>
              PIN Terenkripsi
            </p>
          </div>
          <div className="rounded-2xl px-3.5 py-2.5 flex items-center gap-2" style={{ background: "#fff" }}>
            <Receipt size={14} color={C.orange} />
            <p className="text-[11px] font-extrabold" style={{ color: C.ink }}>
              Real-time
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const form = (
    <div className={desktop ? "flex-1 flex flex-col justify-center px-10 py-12 lg:px-16" : "px-6 mt-10"}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold" style={{ color: C.ink2 }}>
            Username
          </span>
          <div className="flex items-center gap-2 rounded-2xl px-3.5 py-3.5" style={{ background: C.bg, border: `1.5px solid ${C.line}` }}>
            <User size={15} color={C.muted} />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="bg-transparent outline-none text-[13px] w-full"
              style={{ color: C.ink }}
            />
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold" style={{ color: C.ink2 }}>
            Kata sandi
          </span>
          <div className="flex items-center gap-2 rounded-2xl px-3.5 py-3.5" style={{ background: C.bg, border: `1.5px solid ${C.line}` }}>
            <Lock size={15} color={C.muted} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-transparent outline-none text-[13px] w-full"
              style={{ color: C.ink }}
            />
          </div>
        </label>

        {error && (
          <p className="text-[11px] font-semibold" style={{ color: C.danger }}>
            {error}
          </p>
        )}

        <div className={desktop ? "mt-4 max-w-xs" : "mt-3"}>
          <PillButton onClick={submit} tone="orange">
            Masuk <ChevronRight size={16} />
          </PillButton>
        </div>
      </form>

      <p className="text-[11px] text-center mt-4" style={{ color: C.muted }}>
        Demo — gunakan{" "}
        <span className="font-semibold" style={{ color: C.ink2 }}>
          admin
        </span>{" "}
        /{" "}
        <span className="font-semibold" style={{ color: C.ink2 }}>
          admin123
        </span>
      </p>
    </div>
  );

  if (desktop) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center p-8" style={{ background: C.bg }}>
        <div
          className="w-full max-w-4xl rounded-[32px] overflow-hidden flex"
          style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: "0 30px 60px -30px rgba(24,26,20,0.35)" }}
        >
          {hero}
          {form}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col" style={{ background: C.bg }}>
      {hero}
      {form}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Home                                                                       */
/* ---------------------------------------------------------------------- */

function HomeScreen({ adminName, stats, onPick, onLogout, desktop }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        {desktop ? (
          <div>
            <p className="text-[11px]" style={{ color: C.muted }}>
              Selamat datang kembali
            </p>
            <p className="text-[19px] font-extrabold" style={{ color: C.ink }}>
              {adminName || "Admin"}
            </p>
          </div>
        ) : (
          <button onClick={onLogout} className="flex items-center gap-2.5 active:opacity-70 transition">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-extrabold" style={{ background: C.ink, color: "#fff" }}>
              {adminName ? adminName[0].toUpperCase() : "A"}
            </div>
            <span className="flex items-center gap-1 text-[12px] font-bold" style={{ color: C.ink }}>
              Pesantren Al-Hidayah
              <ChevronDown size={13} color={C.muted} />
            </span>
          </button>
        )}
        <button
          onClick={() => onPick("payment")}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: C.inkTint }}
        >
          <ShoppingBasket size={16} color={C.ink2} />
        </button>
      </div>

      <h1 className={desktop ? "text-[26px] font-extrabold leading-snug mt-6" : "text-[21px] font-extrabold leading-snug mt-4"} style={{ color: C.ink }}>
        Kelola Transaksi Santri
        <br />
        dengan Cepat
      </h1>

      <div className="flex items-center gap-2 mt-4">
        <div className="flex-1 flex items-center gap-2.5 rounded-full px-4 py-3" style={{ background: C.inkTint }}>
          <Search size={15} color={C.muted} />
          <span className="text-[12px]" style={{ color: C.muted }}>
            Cari transaksi, santri…
          </span>
        </div>
        <button className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: C.ink }}>
          <SlidersHorizontal size={15} color="#fff" />
        </button>
      </div>

      <div className={desktop ? "grid grid-cols-3 gap-4 mt-6 items-stretch" : "flex flex-col gap-5 mt-5"}>
        <button
          onClick={() => onPick("topup")}
          className={`relative rounded-3xl p-5 overflow-hidden text-left active:scale-[0.98] transition ${desktop ? "col-span-2" : ""}`}
          style={{ background: C.mintTint }}
        >
          <p className="text-[13.5px] font-extrabold max-w-[220px] leading-snug relative z-10" style={{ color: C.ink }}>
            Top up saldo tanpa biaya admin
          </p>
          <p className="text-[10.5px] mt-1 max-w-[220px] relative z-10" style={{ color: C.ink2 }}>
            Isi saldo santri kapan saja, prosesnya instan.
          </p>
          <span className="inline-block mt-4 rounded-full px-4 py-2 text-[11px] font-bold relative z-10" style={{ background: C.ink, color: "#fff" }}>
            Top Up Sekarang
          </span>
          <Wallet size={90} color={C.mint} strokeWidth={1.1} className="absolute -bottom-4 -right-3 opacity-60" />
        </button>

        <div className={desktop ? "flex flex-col gap-2.5" : "flex gap-2.5"}>
          <CategoryPill emoji="🧾" label="Pembayaran" active onClick={() => onPick("payment")} />
          <CategoryPill emoji="💳" label="Top Up" onClick={() => onPick("topup")} />
        </div>
      </div>

      <p className="text-[13px] font-extrabold mt-7 mb-3" style={{ color: C.ink }}>
        Ringkasan Hari Ini
      </p>
      <div className="grid grid-cols-2 gap-3 pb-2">
        <div className="relative rounded-3xl p-4 pb-7" style={{ background: C.goldTint }}>
          <Receipt size={18} color={C.gold} />
          <p className="text-[17px] font-extrabold mt-3" style={{ color: C.ink }}>
            {stats.transaksi}
          </p>
          <p className="text-[10.5px]" style={{ color: C.ink2 }}>
            Transaksi
          </p>
          <div
            className="absolute -bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: C.ink, boxShadow: "0 8px 16px -6px rgba(24,26,20,0.4)" }}
          >
            <ChevronRight size={14} color="#fff" />
          </div>
        </div>
        <div className="relative rounded-3xl p-4 pb-7" style={{ background: C.orangeTint }}>
          <TrendingUp size={18} color={C.orange} />
          <p className="text-[13px] font-extrabold mt-3 truncate" style={{ color: C.ink }}>
            {rupiah(stats.topupTotal)}
          </p>
          <p className="text-[10.5px]" style={{ color: C.ink2 }}>
            Top Up
          </p>
          <div
            className="absolute -bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: C.ink, boxShadow: "0 8px 16px -6px rgba(24,26,20,0.4)" }}
          >
            <ChevronRight size={14} color="#fff" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Scan (shared)                                                             */
/* ---------------------------------------------------------------------- */

function ScanScreen({ mode, onBack, onScan }) {
  const [scanning, setScanning] = useState(false);
  const accent = mode === "topup" ? C.mint : C.orange;
  const tint = mode === "topup" ? C.mintTint : C.orangeTint;

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      const s = STUDENTS[Math.floor(Math.random() * STUDENTS.length)];
      setScanning(false);
      onScan(s);
    }, 650);
  };

  return (
    <div className="flex flex-col h-full min-h-[520px]">
      <div className="flex items-center gap-3 pb-2">
        <BackChip onClick={onBack} />
        <div>
          <p className="text-[10px] font-semibold" style={{ color: accent }}>
            LANGKAH 1 DARI {mode === "topup" ? "2" : "3"}
          </p>
          <h1 className="text-[15px] font-bold" style={{ color: C.ink }}>
            {mode === "topup" ? "Top Up Saldo" : "Pembayaran"}
          </h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
        <div
          className="relative w-36 h-36 rounded-[32px] flex items-center justify-center mb-7"
          style={{ background: `linear-gradient(155deg, ${tint}, #fff)`, border: `1px solid ${C.line}` }}
        >
          <QrCode size={56} color={accent} strokeWidth={1.4} className={scanning ? "animate-pulse" : ""} />
          <div
            className="absolute -top-2.5 -right-3 rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={{ background: "#fff", color: accent, boxShadow: "0 6px 14px -6px rgba(24,26,20,0.25)" }}
          >
            QR Aktif
          </div>
        </div>
        <h2 className="text-[16px] font-bold mb-1.5" style={{ color: C.ink }}>
          Pindai kartu santri
        </h2>
        <p className="text-[12.5px] mb-8 leading-relaxed max-w-[260px]" style={{ color: C.muted }}>
          Tempelkan kartu ber-QR santri pada pemindai untuk melanjutkan.
        </p>
        <div className="w-full max-w-[260px]">
          <PillButton onClick={handleScan} disabled={scanning} tone="ink">
            {scanning ? "Memindai…" : "Pindai Kartu"}
          </PillButton>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Payment — catalog                                                         */
/* ---------------------------------------------------------------------- */

function CatalogScreen({ student, cart, setCart, onBack, onCheckout, desktop }) {
  const [cat, setCat] = useState("Semua");
  const [query, setQuery] = useState("");
  const [favs, setFavs] = useState(new Set());

  const items = useMemo(
    () => PRODUCTS.filter((p) => (cat === "Semua" || p.cat === cat) && p.name.toLowerCase().includes(query.toLowerCase())),
    [cat, query]
  );

  const cartLines = Object.entries(cart).map(([id, qty]) => {
    const p = PRODUCTS.find((pp) => pp.id === +id);
    return { ...p, qty, subtotal: p.price * qty };
  });
  const cartCount = cartLines.reduce((a, l) => a + l.qty, 0);
  const total = cartLines.reduce((a, l) => a + l.subtotal, 0);

  const change = (id, delta) => {
    setCart((prev) => {
      const next = { ...prev };
      const qty = (next[id] || 0) + delta;
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  };

  const toggleFav = (id) => {
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const grid = (
    <div className={`grid gap-x-2.5 gap-y-5 ${desktop ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3"}`}>
      {items.map((p, i) => {
        const qty = cart[p.id] || 0;
        const isFav = favs.has(p.id);
        const tint = CARD_TINTS[i % CARD_TINTS.length];
        return (
          <div key={p.id} className="relative rounded-3xl p-3.5" style={{ background: tint }}>
            <div className="flex items-start justify-between mb-2">
              <span className="rounded-full px-2 py-0.5 text-[8.5px] font-bold" style={{ background: "#fff", color: C.ink2 }}>
                {p.cat}
              </span>
              <button
                onClick={() => toggleFav(p.id)}
                className="w-6 h-6 rounded-full flex items-center justify-center active:scale-90 transition"
                style={{ background: "#fff" }}
              >
                <Heart size={11} color={isFav ? C.orange : C.muted} fill={isFav ? C.orange : "none"} />
              </button>
            </div>
            <div className="text-4xl text-center mb-2">{p.emoji}</div>
            <p className="text-[12px] font-bold leading-tight mb-0.5" style={{ color: C.ink }}>
              {p.name}
            </p>
            <p className="text-[11px] font-semibold" style={{ color: C.ink2 }}>
              {rupiah(p.price)}
            </p>

            {qty === 0 ? (
              <button
                onClick={() => change(p.id, 1)}
                className="absolute -bottom-3.5 right-3 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition"
                style={{ background: C.ink, boxShadow: "0 8px 16px -6px rgba(24,26,20,0.4)" }}
              >
                <Plus size={15} color="#fff" />
              </button>
            ) : (
              <div
                className="absolute -bottom-3.5 right-3 flex items-center gap-2 rounded-full pl-2.5 pr-1 py-1"
                style={{ background: C.ink, boxShadow: "0 8px 16px -6px rgba(24,26,20,0.4)" }}
              >
                <button onClick={() => change(p.id, -1)} className="active:scale-90 transition">
                  <Minus size={12} color="#fff" />
                </button>
                <span className="text-[11px] font-bold" style={{ color: "#fff" }}>
                  {qty}
                </span>
                <button
                  onClick={() => change(p.id, 1)}
                  className="w-6 h-6 rounded-full flex items-center justify-center active:scale-90 transition"
                  style={{ background: "rgba(255,255,255,0.2)" }}
                >
                  <Plus size={12} color="#fff" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const cartPanel = (
    <div className="w-80 shrink-0 rounded-3xl p-5 self-start sticky top-6" style={{ border: `1px solid ${C.line}`, background: "#fff" }}>
      <p className="text-[13px] font-extrabold mb-3" style={{ color: C.ink }}>
        Keranjang
      </p>
      {cartLines.length === 0 ? (
        <p className="text-[12px]" style={{ color: C.muted }}>
          Belum ada produk dipilih.
        </p>
      ) : (
        <div className="space-y-2 mb-4 max-h-80 overflow-y-auto pr-1">
          {cartLines.map((l) => (
            <div key={l.id} className="flex items-center justify-between text-[12px]">
              <span style={{ color: C.ink2 }}>
                {l.emoji} {l.name} ×{l.qty}
              </span>
              <span className="font-semibold shrink-0 ml-2" style={{ color: C.ink }}>
                {rupiah(l.subtotal)}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-between text-[13px] font-extrabold pt-3" style={{ borderTop: `1px solid ${C.line}`, color: C.ink }}>
        <span>Total</span>
        <span>{rupiah(total)}</span>
      </div>
      <div className="mt-4">
        <PillButton onClick={onCheckout} disabled={cartCount === 0} tone="ink">
          Lanjut ke Pembayaran
        </PillButton>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-[520px]">
      <div className="flex items-center gap-3 pb-3 shrink-0">
        <BackChip onClick={onBack} />
        <div className="flex-1">
          <p className="text-[10px] font-semibold" style={{ color: C.orange }}>
            LANGKAH 2 DARI 3
          </p>
          <h1 className="text-[15px] font-bold" style={{ color: C.ink }}>
            {student.name}
          </h1>
        </div>
        <div className="relative w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.inkTint }}>
          <ShoppingBasket size={15} color={C.ink2} />
          {cartCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
              style={{ background: C.orange, color: "#fff" }}
            >
              {cartCount}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pb-3 shrink-0">
        <div className="flex-1 flex items-center gap-2.5 rounded-full px-4 py-2.5" style={{ background: C.inkTint }}>
          <Search size={14} color={C.muted} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari produk…"
            className="bg-transparent outline-none text-[12.5px] w-full"
            style={{ color: C.ink }}
          />
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: C.ink }}>
          <SlidersHorizontal size={13} color="#fff" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2.5 pb-4 shrink-0">
        {CATEGORIES.map((c) => (
          <CategoryPill key={c.key} emoji={c.emoji} label={c.key} active={c.key === cat} onClick={() => setCat(c.key)} />
        ))}
      </div>

      {desktop ? (
        <div className="flex gap-6 items-start flex-1">
          <div className="flex-1 min-w-0">{grid}</div>
          {cartPanel}
        </div>
      ) : (
        <>
          <div className="flex-1">{grid}</div>
          <div className="pt-5 pb-2 shrink-0">
            <button
              disabled={cartCount === 0}
              onClick={onCheckout}
              className="w-full rounded-full py-3.5 flex items-center justify-between px-5 font-bold text-[12.5px] active:scale-[0.98] transition disabled:opacity-35"
              style={{ background: C.ink, color: "#fff", boxShadow: "0 12px 22px -10px rgba(24,26,20,0.5)" }}
            >
              <span className="flex items-center gap-2">
                <ShoppingBasket size={15} />
                {cartCount} item
              </span>
              <span>Lanjutkan · {rupiah(total)}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Payment — detail + PIN                                                    */
/* ---------------------------------------------------------------------- */

function PaymentPinScreen({ student, cart, onBack, onSubmitPin, error, desktop }) {
  const [pin, setPin] = useState("");

  const lines = Object.entries(cart).map(([id, qty]) => {
    const p = PRODUCTS.find((pp) => pp.id === +id);
    return { ...p, qty, subtotal: p.price * qty };
  });
  const total = lines.reduce((s, l) => s + l.subtotal, 0);
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);

  const press = (d) => {
    if (pin.length >= 6) return;
    setPin(pin + d);
  };

  const summary = (
    <div>
      <div className="rounded-3xl h-28 flex items-center justify-center" style={{ background: `linear-gradient(155deg, ${C.orangeTint}, ${C.goldTint})` }}>
        <ShoppingBasket size={54} color={C.orange} strokeWidth={1.3} />
      </div>
      <div
        className="relative -mt-7 rounded-3xl p-5 z-10"
        style={{ background: "#fff", border: `1px solid ${C.line}`, boxShadow: "0 16px 32px -20px rgba(24,26,20,0.25)" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[15px] font-extrabold" style={{ color: C.ink }}>
              {student.name}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
              {student.kelas}
            </p>
          </div>
          <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.inkTint }}>
            <Heart size={13} color={C.orange} />
          </button>
        </div>

        <p className="text-[24px] font-extrabold mt-3" style={{ color: C.orange }}>
          {rupiah(total)}
        </p>

        <div className="flex items-center gap-2 mt-2.5 text-[11px] flex-wrap" style={{ color: C.ink2 }}>
          <span className="flex items-center gap-1">
            <ShoppingBasket size={12} /> {itemCount} item
          </span>
          <span style={{ color: C.line }}>•</span>
          <span className="flex items-center gap-1">
            <Wallet size={12} /> {rupiah(student.saldo)}
          </span>
          <span style={{ color: C.line }}>•</span>
          <span className="flex items-center gap-1">
            <Lock size={12} /> PIN 6 digit
          </span>
        </div>

        <div className="flex items-center gap-2.5 mt-4 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: C.ink, color: "#fff" }}>
            K
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold" style={{ color: C.ink }}>
              Kasir Bertugas
            </p>
            <p className="text-[9.5px]" style={{ color: C.muted }}>
              Admin · Siap melayani
            </p>
          </div>
        </div>
      </div>

      <p className="text-[11.5px] font-bold mt-5 mb-2" style={{ color: C.ink }}>
        Rincian Belanja
      </p>
      <div className="rounded-2xl p-4" style={{ border: `1px solid ${C.line}` }}>
        <div className="space-y-1.5">
          {lines.map((l) => (
            <div key={l.id} className="flex justify-between text-[12px]">
              <span style={{ color: C.ink2 }}>
                {l.emoji} {l.name} <span style={{ color: C.muted }}>×{l.qty}</span>
              </span>
              <span className="font-semibold" style={{ color: C.ink }}>
                {rupiah(l.subtotal)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const pinPad = (
    <div className={desktop ? "rounded-3xl p-6" : ""} style={desktop ? { border: `1px solid ${C.line}`, background: "#fff" } : {}}>
      <p className="text-center text-[12.5px] font-bold mb-4" style={{ color: C.ink }}>
        Santri, masukkan 6 digit PIN
      </p>
      <div className="flex justify-center gap-2.5 mb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-3 h-3 rounded-full transition" style={{ background: i < pin.length ? C.ink : C.line }} />
        ))}
      </div>
      {error && (
        <p className="text-center text-[11px] font-bold mb-1" style={{ color: C.danger }}>
          {error}
        </p>
      )}

      <div className={desktop ? "mt-6" : "mt-6"}>
        <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              onClick={() => press(d)}
              className="py-3 rounded-2xl text-[14px] font-bold active:scale-90 transition"
              style={{ background: C.bg, color: C.ink }}
            >
              {d}
            </button>
          ))}
          <div />
          <button
            onClick={() => press("0")}
            className="py-3 rounded-2xl text-[14px] font-bold active:scale-90 transition"
            style={{ background: C.bg, color: C.ink }}
          >
            0
          </button>
          <button
            onClick={() => setPin((p) => p.slice(0, -1))}
            className="py-3 rounded-2xl flex items-center justify-center active:scale-90 transition"
            style={{ background: C.bg }}
          >
            <Delete size={16} color={C.ink2} />
          </button>
        </div>
      </div>

      <div className={desktop ? "mt-6 max-w-[280px] mx-auto" : "mt-5"}>
        <PillButton onClick={() => onSubmitPin(pin, total)} disabled={pin.length < 6} tone="orange">
          Konfirmasi Pembayaran
        </PillButton>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-[520px]">
      <div className="flex items-center gap-3 pb-2 shrink-0">
        <BackChip onClick={onBack} />
        <h1 className="flex-1 text-[15px] font-bold" style={{ color: C.ink }}>
          Detail Pembayaran
        </h1>
        <IconChip icon={MoreVertical} />
      </div>

      {desktop ? (
        <div className="flex gap-6 items-start flex-1">
          <div className="flex-1 min-w-0">{summary}</div>
          <div className="w-96 shrink-0">{pinPad}</div>
        </div>
      ) : (
        <div className="flex-1">
          {summary}
          <div className="mt-5">{pinPad}</div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Top up                                                                     */
/* ---------------------------------------------------------------------- */

function TopupScreen({ student, onBack, onConfirm, desktop }) {
  const [amount, setAmount] = useState(0);
  const [custom, setCustom] = useState("");

  const pick = (v) => {
    setAmount(v);
    setCustom("");
  };

  const onCustomChange = (v) => {
    const digits = v.replace(/[^\d]/g, "");
    setCustom(digits);
    setAmount(digits ? parseInt(digits, 10) : 0);
  };

  const hero = (
    <div>
      <div className="rounded-3xl h-28 flex items-center justify-center" style={{ background: `linear-gradient(155deg, ${C.mintTint}, ${C.goldTint})` }}>
        <Wallet size={52} color={C.mint} strokeWidth={1.3} />
      </div>
      <div
        className="relative -mt-7 rounded-3xl p-5 z-10"
        style={{ background: "#fff", border: `1px solid ${C.line}`, boxShadow: "0 16px 32px -20px rgba(24,26,20,0.25)" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[15px] font-extrabold" style={{ color: C.ink }}>
              {student.name}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
              {student.kelas}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px]" style={{ color: C.muted }}>
              Saldo Kini
            </p>
            <p className="text-[13px] font-extrabold" style={{ color: C.ink }}>
              {rupiah(student.saldo)}
            </p>
          </div>
        </div>
        <p className="text-[24px] font-extrabold mt-3" style={{ color: C.mint }}>
          {amount > 0 ? rupiah(amount) : "Rp0"}
        </p>
        <p className="text-[11px]" style={{ color: C.ink2 }}>
          Nominal top up dipilih
        </p>
      </div>
    </div>
  );

  const picker = (
    <div className={desktop ? "rounded-3xl p-6" : ""} style={desktop ? { border: `1px solid ${C.line}`, background: "#fff" } : {}}>
      <p className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: C.muted }}>
        Pilih nominal
      </p>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {TOPUP_CHIPS.map((v) => {
          const active = amount === v && custom === "";
          return (
            <button
              key={v}
              onClick={() => pick(v)}
              className="py-3 rounded-2xl text-[12px] font-bold active:scale-95 transition"
              style={{ background: active ? C.ink : C.bg, color: active ? "#fff" : C.ink2 }}
            >
              {rupiah(v)}
            </button>
          );
        })}
      </div>

      <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: C.muted }}>
        Atau nominal lain
      </p>
      <div className="flex items-center gap-2 rounded-2xl px-4 py-3.5 mb-6" style={{ background: C.bg, border: `1.5px solid ${C.line}` }}>
        <span className="text-[13px] font-semibold" style={{ color: C.muted }}>
          Rp
        </span>
        <input
          value={custom}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder="0"
          inputMode="numeric"
          className="bg-transparent outline-none text-[13px] w-full font-semibold"
          style={{ color: C.ink }}
        />
      </div>

      <PillButton onClick={() => onConfirm(amount)} disabled={amount <= 0} tone="mint">
        Top Up {amount > 0 ? rupiah(amount) : ""}
      </PillButton>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-[520px]">
      <div className="flex items-center gap-3 pb-2 shrink-0">
        <BackChip onClick={onBack} />
        <h1 className="flex-1 text-[15px] font-bold" style={{ color: C.ink }}>
          Top Up Saldo
        </h1>
        <IconChip icon={MoreVertical} />
      </div>

      {desktop ? (
        <div className="flex gap-6 items-start flex-1">
          <div className="flex-1 min-w-0">{hero}</div>
          <div className="w-96 shrink-0">{picker}</div>
        </div>
      ) : (
        <div className="flex-1">
          {hero}
          <div className="mt-6">{picker}</div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Success (shared)                                                          */
/* ---------------------------------------------------------------------- */

function SuccessScreen({ mode, student, cart, total, amount, onDone }) {
  const isTopup = mode === "topup";
  const newBalance = isTopup ? student.saldo + amount : student.saldo - total;
  const lines = !isTopup
    ? Object.entries(cart).map(([id, qty]) => {
        const p = PRODUCTS.find((pp) => pp.id === +id);
        return { ...p, qty };
      })
    : [];

  return (
    <div className="flex flex-col items-center justify-center min-h-[520px] text-center max-w-sm mx-auto">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: isTopup ? C.mintTint : C.orangeTint }}>
        <CheckCircle2 size={38} color={isTopup ? C.mint : C.orange} strokeWidth={1.6} />
      </div>
      <h2 className="text-[17px] font-extrabold mb-1" style={{ color: C.ink }}>
        {isTopup ? "Top Up Berhasil" : "Transaksi Berhasil"}
      </h2>
      <p className="text-[11.5px] mb-6" style={{ color: C.muted }}>
        {isTopup ? `Saldo ${student.name} telah ditambahkan` : `${lines.reduce((a, l) => a + l.qty, 0)} item untuk ${student.name}`}
      </p>

      <div className="w-full rounded-3xl p-5 mb-6" style={{ background: isTopup ? C.mintTint : C.orangeTint }}>
        <div className="flex justify-between text-[12.5px] mb-2">
          <span style={{ color: C.ink2 }}>Nama Santri</span>
          <span className="font-bold" style={{ color: C.ink }}>
            {student.name}
          </span>
        </div>
        <div className="flex justify-between text-[12.5px] mb-2">
          <span style={{ color: C.ink2 }}>{isTopup ? "Nominal Top Up" : "Total Belanja"}</span>
          <span className="font-bold" style={{ color: C.ink }}>
            {rupiah(isTopup ? amount : total)}
          </span>
        </div>
        <div className="flex justify-between text-[12.5px] pt-2" style={{ borderTop: `1px dashed rgba(24,26,20,0.15)` }}>
          <span style={{ color: C.ink2 }}>Saldo Terkini</span>
          <span className="font-extrabold" style={{ color: C.ink }}>
            {rupiah(newBalance)}
          </span>
        </div>
      </div>

      <PillButton onClick={onDone} tone="ink">
        Kembali ke Menu
      </PillButton>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* History                                                                     */
/* ---------------------------------------------------------------------- */

function HistoryScreen({ history, desktop }) {
  return (
    <div className="flex flex-col">
      <h1 className="text-[15px] font-bold mb-4" style={{ color: C.ink }}>
        Riwayat Transaksi
      </h1>

      {history.length === 0 ? (
        <div className="pt-16 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: C.inkTint }}>
            <Receipt size={22} color={C.muted} />
          </div>
          <p className="text-[12.5px]" style={{ color: C.muted }}>
            Belum ada transaksi hari ini.
          </p>
        </div>
      ) : (
        <div className={`grid gap-3 ${desktop ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
          {history.map((h, i) => {
            const isTopup = h.type === "topup";
            const tint = CARD_TINTS[i % CARD_TINTS.length];
            const Icon = isTopup ? Wallet : ShoppingBasket;
            return (
              <div key={h.id} className="rounded-3xl p-4" style={{ background: tint }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff" }}>
                    <Icon size={15} color={C.ink2} />
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: "#fff", color: C.ink }}>
                    {rupiah(h.amount)}
                  </span>
                </div>
                <p className="text-[13px] font-bold" style={{ color: C.ink }}>
                  {h.name}
                </p>
                <p className="text-[10.5px] mb-3" style={{ color: C.ink2 }}>
                  {isTopup ? "Top up saldo" : "Pembayaran belanja"}
                </p>
                <div className="flex items-center gap-2 pt-2.5" style={{ borderTop: `1px solid rgba(24,26,20,0.08)` }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: C.ink, color: "#fff" }}>
                    {h.admin ? h.admin[0].toUpperCase() : "A"}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10.5px] font-semibold" style={{ color: C.ink }}>
                      {h.admin || "Admin"}
                    </p>
                    <p className="text-[9px]" style={{ color: C.muted }}>
                      Kasir · {h.time}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Root                                                                        */
/* ---------------------------------------------------------------------- */

export default function SimartKasir() {
  const isDesktop = useIsDesktop(1024);

  const [stage, setStage] = useState("login");
  const [adminName, setAdminName] = useState("");
  const [mode, setMode] = useState(null);
  const [student, setStudent] = useState(null);
  const [cart, setCart] = useState({});
  const [pinError, setPinError] = useState("");
  const [finalTotal, setFinalTotal] = useState(0);
  const [topupAmount, setTopupAmount] = useState(0);
  const [stats, setStats] = useState({ transaksi: 12, topupTotal: 350000 });
  const [history, setHistory] = useState([]);

  const goHome = () => {
    setStage("home");
    setMode(null);
    setStudent(null);
    setCart({});
    setPinError("");
    setFinalTotal(0);
    setTopupAmount(0);
  };

  const handleLogin = (name) => {
    setAdminName(name);
    setStage("home");
  };

  const handleLogout = () => {
    setAdminName("");
    setStage("login");
  };

  const pickMode = (m) => {
    setMode(m);
    setStage("scan");
  };

  const handleNav = (key) => {
    if (key === "home") return setStage("home");
    if (key === "history") return setStage("history");
    pickMode(key);
  };

  const handleScan = (s) => {
    setStudent(s);
    setStage(mode === "topup" ? "topup" : "catalog");
  };

  const pushHistory = (record) => {
    setHistory((h) => [
      { ...record, id: Date.now(), admin: adminName, time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) },
      ...h,
    ]);
  };

  const handleSubmitPin = (pin, total) => {
    if (pin === "000000") {
      setPinError("PIN salah, silakan coba lagi.");
      return;
    }
    if (total > student.saldo) {
      setPinError("Saldo tidak mencukupi.");
      return;
    }
    setPinError("");
    setFinalTotal(total);
    setStats((s) => ({ ...s, transaksi: s.transaksi + 1 }));
    pushHistory({ type: "payment", name: student.name, amount: total });
    setStage("success");
  };

  const handleConfirmTopup = (amount) => {
    setTopupAmount(amount);
    setStats((s) => ({ ...s, topupTotal: s.topupTotal + amount }));
    pushHistory({ type: "topup", name: student.name, amount });
    setStage("success");
  };

  if (stage === "login") {
    return (
      <div style={{ fontFamily: FONT }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');`}</style>
        <LoginScreen onLogin={handleLogin} desktop={isDesktop} />
      </div>
    );
  }

  const section = stage === "home" ? "home" : stage === "history" ? "history" : mode === "topup" ? "topup" : "payment";

  const screen = (
    <>
      {stage === "home" && <HomeScreen adminName={adminName} stats={stats} onPick={pickMode} onLogout={handleLogout} desktop={isDesktop} />}
      {stage === "scan" && <ScanScreen mode={mode} onBack={goHome} onScan={handleScan} />}
      {stage === "catalog" && student && (
        <CatalogScreen student={student} cart={cart} setCart={setCart} onBack={() => setStage("scan")} onCheckout={() => setStage("pin")} desktop={isDesktop} />
      )}
      {stage === "pin" && student && (
        <PaymentPinScreen
          student={student}
          cart={cart}
          onBack={() => {
            setPinError("");
            setStage("catalog");
          }}
          onSubmitPin={handleSubmitPin}
          error={pinError}
          desktop={isDesktop}
        />
      )}
      {stage === "topup" && student && <TopupScreen student={student} onBack={() => setStage("scan")} onConfirm={handleConfirmTopup} desktop={isDesktop} />}
      {stage === "success" && student && (
        <SuccessScreen mode={mode} student={student} cart={cart} total={finalTotal} amount={topupAmount} onDone={goHome} />
      )}
      {stage === "history" && <HistoryScreen history={history} desktop={isDesktop} />}
    </>
  );

  return (
    <div className="w-full min-h-screen relative" style={{ background: C.bg, fontFamily: FONT }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');`}</style>

      <div
        className="absolute rounded-full pointer-events-none"
        style={{ width: 420, height: 420, background: C.mint, opacity: 0.16, filter: "blur(100px)", top: -140, left: -140 }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{ width: 380, height: 380, background: C.orange, opacity: 0.14, filter: "blur(100px)", bottom: -160, right: -100 }}
      />

      <div className="relative z-10 w-full min-h-screen flex">
        {isDesktop && <Sidebar active={section} onNav={handleNav} adminName={adminName} onLogout={handleLogout} />}

        <div className="flex-1 min-h-screen flex flex-col min-w-0">
          <div className="flex-1 min-h-0 flex flex-col">
            {isDesktop ? (
              <div className="flex-1 min-h-0 flex justify-center px-10 py-10 overflow-y-auto">
                <div className="w-full max-w-5xl">{screen}</div>
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 pt-6">
                <div className="w-full max-w-2xl mx-auto">{screen}</div>
              </div>
            )}
          </div>

          {!isDesktop && (stage === "home" || stage === "history") && <MobileBottomNav active={section} onNav={handleNav} />}
        </div>
      </div>
    </div>
  );
}

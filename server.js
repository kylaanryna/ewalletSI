require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGINS = new Set((process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000,null')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean));
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 90;
const rateBuckets = new Map();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ewalletsi',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: false
};

const pool = mysql.createPool(DB_CONFIG);

app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  next();
});

app.use(cors({
  origin(origin, cb) {
    if (!origin || ALLOWED_ORIGINS.has(origin)) return cb(null, true);
    return cb(new Error('CORS blocked'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '10kb' }));

function clientKey(req) {
  return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
}

function limitApi(req, res, next) {
  const key = `${clientKey(req)}:${req.path}`;
  const now = Date.now();
  const bucket = rateBuckets.get(key) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (now >= bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }

  bucket.count += 1;
  rateBuckets.set(key, bucket);

  if (bucket.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ ok: false, message: 'Terlalu banyak request. Coba lagi nanti.' });
  }

  next();
}

app.use(['/api/health', '/api/students', '/api/scan', '/api/payments', '/api/topup', '/api/dashboard'], limitApi);

function safeText(value, maxLength = 120) {
  return String(value || '').trim().slice(0, maxLength);
}

function safeCardId(value) {
  const cardId = safeText(value, 50);
  return /^[A-Za-z0-9_-]+$/.test(cardId) ? cardId : '';
}

function safeAmount(value) {
  const amount = Number(value);
  return Number.isInteger(amount) && amount > 0 ? amount : 0;
}

// Saldo awal seorang santri boleh 0 atau lebih (integer positif).
function safeInitSaldo(value) {
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= 0 ? amount : -1;
}

// Menyimpan hasil scan RFID terakhir di memori, supaya web bisa polling
// dan tahu ada kartu baru yang ditap oleh alat ESP32.
let lastScan = null; // { cardId, scanId, student|null, message, ok, timestamp }
let scanCounter = 0;

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.execute(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

async function initDb() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        card_id VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        kelas VARCHAR(100) NOT NULL,
        saldo INT DEFAULT 0
      ) ENGINE=InnoDB
    `);

    // Migrasi: tambahkan kolom password jika belum ada
    // (CREATE TABLE IF NOT EXISTS tidak menambah kolom pada tabel lama).
    try {
      const passwordCols = await query(
        "SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'password'"
      );
      if (!passwordCols.length) {
        await query("ALTER TABLE students ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT ''");
      }
    } catch (error) {
      console.error('Migrasi kolom password gagal:', error.message);
    }

    await query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        card_id VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        amount INT NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS topups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        card_id VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        amount INT NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    const rows = await query('SELECT COUNT(*) AS total FROM students');
    if (Number(rows[0].total) === 0) {
      const seed = [
        { card_id: '212202211', name: 'Kayla Nuryana', kelas: 'VII-A', saldo: 120000 },
        { card_id: '212202226', name: 'Zalfa Taher', kelas: 'VII-B', saldo: 95000 },
        { card_id: '212202212', name: 'Kayyisah A', kelas: 'VIII-A', saldo: 140000 }
      ];

      for (const student of seed) {
        await query(
          'INSERT INTO students (card_id, name, kelas, saldo) VALUES (?, ?, ?, ?)',
          [student.card_id, student.name, student.kelas, student.saldo]
        );
      }
    }

    console.log('MySQL database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
  }
}

app.get('/api/health', async (req, res) => {
  try {
    const rows = await query('SELECT 1 AS ok');
    res.json({ ok: true, message: 'RFID API ready', db: 'mysql', test: rows[0] });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Database tidak terhubung' });
  }
});

app.get('/api/students', async (req, res) => {
  try {
    const rows = await query('SELECT id, card_id, name, kelas, saldo, password FROM students ORDER BY name ASC');
    res.json({ ok: true, data: rows });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Gagal mengambil data santri' });
  }
});

app.get('/api/students/:cardId', async (req, res) => {
  const cardId = safeCardId(req.params.cardId);

  if (!cardId) {
    return res.status(400).json({ ok: false, message: 'cardId tidak valid' });
  }

  try {
    const rows = await query('SELECT id, card_id, name, kelas, saldo FROM students WHERE card_id = ?', [cardId]);
    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Kartu tidak terdaftar' });
    }

    res.json({ ok: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Gagal mencari santri' });
  }
});

// Tambah santri baru oleh admin: nama, password, saldo awal (kelas & ID kartu opsional).
app.post('/api/students', async (req, res) => {
  const safeName = safeText(req.body.name, 120);
  const safePassword = safeText(req.body.password, 50);
  const safeKelas = (safeText(req.body.kelas, 100) || '-');
  const safeSaldo = safeInitSaldo(req.body.saldo);
  const providedCardId = safeCardId(req.body.cardId);

  if (!safeName) {
    return res.status(400).json({ ok: false, message: 'Nama santri wajib diisi' });
  }
  if (safePassword.length < 4) {
    return res.status(400).json({ ok: false, message: 'Password santri wajib diisi minimal 4 karakter' });
  }
  if (safeSaldo < 0) {
    return res.status(400).json({ ok: false, message: 'Saldo harus berupa angka bulat 0 atau lebih' });
  }

  const cardId = providedCardId || `ST${Date.now()}`;

  try {
    const exists = await query('SELECT id FROM students WHERE card_id = ?', [cardId]);
    if (exists.length) {
      return res.status(409).json({ ok: false, message: 'ID kartu sudah terdaftar. Gunakan ID lain.' });
    }

    await query(
      'INSERT INTO students (card_id, name, kelas, saldo, password) VALUES (?, ?, ?, ?, ?)',
      [cardId, safeName, safeKelas, safeSaldo, safePassword]
    );

    const rows = await query(
      'SELECT id, card_id, name, kelas, saldo, password FROM students WHERE card_id = ?',
      [cardId]
    );

    res.json({
      ok: true,
      message: 'Santri berhasil ditambahkan',
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Gagal menambahkan santri' });
  }
});

app.post('/api/scan', async (req, res) => {
  const cardId = safeCardId(req.body.cardId);

  if (!cardId) {
    return res.status(400).json({ ok: false, message: 'cardId wajib diisi dan harus valid' });
  }

  try {
    const rows = await query('SELECT id, card_id, name, kelas, saldo FROM students WHERE card_id = ?', [cardId]);

    scanCounter += 1;

    if (!rows.length) {
      lastScan = {
        scanId: scanCounter,
        cardId,
        ok: false,
        message: 'ID santri tidak ditemukan',
        data: null,
        timestamp: Date.now()
      };
      return res.status(404).json({ ok: false, message: 'ID santri tidak ditemukan' });
    }

    lastScan = {
      scanId: scanCounter,
      cardId,
      ok: true,
      message: 'Scan berhasil',
      data: rows[0],
      timestamp: Date.now()
    };

    return res.json({ ok: true, message: 'Scan berhasil', data: rows[0] });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Gagal memproses scan' });
  }
});

// Dipanggil (polling) oleh web setiap beberapa detik untuk mengecek
// apakah ada tap kartu baru yang masuk dari alat ESP32.
app.get('/api/last-scan', (req, res) => {
  if (!lastScan) {
    return res.json({ ok: true, data: null });
  }
  res.json({ ok: true, data: lastScan });
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const payToday = await query(
      'SELECT COUNT(*) AS transaksi, COALESCE(SUM(amount), 0) AS omzet FROM payments WHERE DATE(created_at) = CURDATE()'
    );
    const topToday = await query(
      'SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total FROM topups WHERE DATE(created_at) = CURDATE()'
    );
    const recentPay = await query(
      'SELECT id, card_id, name, amount, note, created_at FROM payments ORDER BY created_at DESC LIMIT 10'
    );
    const recentTop = await query(
      'SELECT id, card_id, name, amount, note, created_at FROM topups ORDER BY created_at DESC LIMIT 10'
    );
    const recent = [
      ...recentPay.map((row) => ({ ...row, type: 'payment' })),
      ...recentTop.map((row) => ({ ...row, type: 'topup' }))
    ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 12);

    res.json({
      ok: true,
      data: {
        today: {
          transaksi: Number(payToday[0].transaksi || 0),
          omzet: Number(payToday[0].omzet || 0)
        },
        topupToday: {
          count: Number(topToday[0].count || 0),
          total: Number(topToday[0].total || 0)
        },
        recent
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Gagal memuat dashboard' });
  }
});

app.post('/api/topup', async (req, res) => {
  const safeCardIdValue = safeCardId(req.body.cardId);
  const safeAmountValue = safeAmount(req.body.amount);
  const safeNote = safeText(req.body.note || 'Top up saldo', 120);

  if (!safeCardIdValue || !safeAmountValue) {
    return res.status(400).json({ ok: false, message: 'cardId dan amount harus valid' });
  }

  try {
    const rows = await query('SELECT id, card_id, name, kelas, saldo FROM students WHERE card_id = ?', [safeCardIdValue]);
    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Santri tidak ditemukan' });
    }

    const student = rows[0];
    const newSaldo = Number(student.saldo) + safeAmountValue;

    await query('UPDATE students SET saldo = ? WHERE card_id = ?', [newSaldo, safeCardIdValue]);
    await query(
      'INSERT INTO topups (card_id, name, amount, note) VALUES (?, ?, ?, ?)',
      [safeCardIdValue, student.name, safeAmountValue, safeNote]
    );

    res.json({
      ok: true,
      message: 'Top up berhasil',
      data: {
        id: student.id,
        cardId: safeCardIdValue,
        name: student.name,
        kelas: student.kelas,
        amount: safeAmountValue,
        saldoTerbaru: newSaldo
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Gagal memproses top up' });
  }
});

app.post('/api/payments', async (req, res) => {
  const { cardId, amount, note } = req.body;
  const safeCardIdValue = safeCardId(cardId);
  const safeAmountValue = safeAmount(amount);
  const safeNote = safeText(note || 'Pembayaran produk', 120);

  if (!safeCardIdValue || !safeAmountValue) {
    return res.status(400).json({ ok: false, message: 'cardId dan amount harus valid' });
  }

  try {
    const rows = await query('SELECT id, card_id, name, saldo FROM students WHERE card_id = ?', [safeCardIdValue]);

    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Santri tidak ditemukan' });
    }

    const student = rows[0];

    if (Number(student.saldo) < safeAmountValue) {
      return res.status(400).json({ ok: false, message: 'Saldo santri tidak mencukupi', saldo: student.saldo });
    }

    const newSaldo = Number(student.saldo) - safeAmountValue;

    await query('UPDATE students SET saldo = ? WHERE card_id = ?', [newSaldo, safeCardIdValue]);
    await query('INSERT INTO payments (card_id, name, amount, note) VALUES (?, ?, ?, ?)', [safeCardIdValue, student.name, safeAmountValue, safeNote]);

    res.json({
      ok: true,
      message: 'Pembayaran berhasil',
      data: {
        cardId: safeCardIdValue,
        name: student.name,
        amount: safeAmountValue,
        saldoTerbaru: newSaldo
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Gagal memproses pembayaran' });
  }
});

app.listen(PORT, async () => {
  await initDb();
  console.log(`RFID API running at http://localhost:${PORT}`);
  console.log('Database config:', {
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    database: DB_CONFIG.database,
    user: DB_CONFIG.user
  });
});

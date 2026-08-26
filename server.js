require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3000;

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

app.use(cors());
app.use(express.json());

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
    res.status(500).json({ ok: false, message: 'Database tidak terhubung', error: error.message });
  }
});

app.get('/api/students', async (req, res) => {
  try {
    const rows = await query('SELECT id, card_id, name, kelas, saldo FROM students ORDER BY name ASC');
    res.json({ ok: true, data: rows });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Gagal mengambil data santri', error: error.message });
  }
});

app.get('/api/students/:cardId', async (req, res) => {
  const cardId = String(req.params.cardId).trim();

  try {
    const rows = await query('SELECT id, card_id, name, kelas, saldo FROM students WHERE card_id = ?', [cardId]);
    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Kartu tidak terdaftar' });
    }

    res.json({ ok: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Gagal mencari santri', error: error.message });
  }
});

app.post('/api/scan', async (req, res) => {
  const cardId = String(req.body.cardId || '').trim();

  if (!cardId) {
    return res.status(400).json({ ok: false, message: 'cardId wajib diisi' });
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
    return res.status(500).json({ ok: false, message: 'Gagal memproses scan', error: error.message });
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

app.post('/api/payments', async (req, res) => {
  const { cardId, amount, note } = req.body;
  const safeCardId = String(cardId || '').trim();
  const safeAmount = Number(amount || 0);

  if (!safeCardId || !safeAmount || safeAmount <= 0) {
    return res.status(400).json({ ok: false, message: 'cardId dan amount harus valid' });
  }

  try {
    const rows = await query('SELECT id, card_id, name, saldo FROM students WHERE card_id = ?', [safeCardId]);

    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Santri tidak ditemukan' });
    }

    const student = rows[0];

    if (Number(student.saldo) < safeAmount) {
      return res.status(400).json({ ok: false, message: 'Saldo santri tidak mencukupi', saldo: student.saldo });
    }

    const newSaldo = Number(student.saldo) - safeAmount;

    await query('UPDATE students SET saldo = ? WHERE card_id = ?', [newSaldo, safeCardId]);
    await query('INSERT INTO payments (card_id, name, amount, note) VALUES (?, ?, ?, ?)', [safeCardId, student.name, safeAmount, note || 'Pembayaran produk']);

    res.json({
      ok: true,
      message: 'Pembayaran berhasil',
      data: {
        cardId: safeCardId,
        name: student.name,
        amount: safeAmount,
        saldoTerbaru: newSaldo
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Gagal memproses pembayaran', error: error.message });
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

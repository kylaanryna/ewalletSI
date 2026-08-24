const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data.sqlite');

app.use(cors());
app.use(express.json());

function initDb() {
  const db = new sqlite3.Database(DB_PATH);

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        kelas TEXT NOT NULL,
        saldo INTEGER DEFAULT 0
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_id TEXT NOT NULL,
        name TEXT NOT NULL,
        amount INTEGER NOT NULL,
        note TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const seed = [
      { card_id: '212202211', name: 'Kayla Nuryana', kelas: 'VII-A', saldo: 120000 },
      { card_id: '212202226', name: 'Zalfa Taher', kelas: 'VII-B', saldo: 95000 },
      { card_id: '212202212', name: 'Kayyisah A', kelas: 'VIII-A', saldo: 140000 }
    ];

    db.get('SELECT COUNT(*) as total FROM students', (err, row) => {
      if (err) {
        db.close();
        return;
      }

      if (row && row.total === 0) {
        const stmt = db.prepare('INSERT INTO students (card_id, name, kelas, saldo) VALUES (?, ?, ?, ?)');
        seed.forEach((student) => {
          stmt.run(student.card_id, student.name, student.kelas, student.saldo);
        });
        stmt.finalize(() => db.close());
        return;
      }

      db.close();
    });
  });
}

function openDb() {
  return new sqlite3.Database(DB_PATH);
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'RFID API ready' });
});

app.get('/api/students', (req, res) => {
  const db = openDb();

  db.all('SELECT id, card_id, name, kelas, saldo FROM students ORDER BY name ASC', (err, rows) => {
    db.close();
    if (err) {
      return res.status(500).json({ ok: false, message: 'Gagal mengambil data santri', error: err.message });
    }

    res.json({ ok: true, data: rows });
  });
});

app.get('/api/students/:cardId', (req, res) => {
  const cardId = String(req.params.cardId).trim();
  const db = openDb();

  db.get('SELECT id, card_id, name, kelas, saldo FROM students WHERE card_id = ?', [cardId], (err, row) => {
    db.close();
    if (err) {
      return res.status(500).json({ ok: false, message: 'Gagal mencari santri', error: err.message });
    }

    if (!row) {
      return res.status(404).json({ ok: false, message: 'Kartu tidak terdaftar' });
    }

    res.json({ ok: true, data: row });
  });
});

app.post('/api/scan', (req, res) => {
  const cardId = String(req.body.cardId || '').trim();

  if (!cardId) {
    return res.status(400).json({ ok: false, message: 'cardId wajib diisi' });
  }

  const db = openDb();

  db.get('SELECT id, card_id, name, kelas, saldo FROM students WHERE card_id = ?', [cardId], (err, row) => {
    db.close();
    if (err) {
      return res.status(500).json({ ok: false, message: 'Gagal memproses scan', error: err.message });
    }

    if (!row) {
      return res.status(404).json({ ok: false, message: 'ID santri tidak ditemukan' });
    }

    res.json({ ok: true, message: 'Scan berhasil', data: row });
  });
});

app.post('/api/payments', (req, res) => {
  const { cardId, amount, note } = req.body;
  const safeCardId = String(cardId || '').trim();
  const safeAmount = Number(amount || 0);

  if (!safeCardId || !safeAmount || safeAmount <= 0) {
    return res.status(400).json({ ok: false, message: 'cardId dan amount harus valid' });
  }

  const db = openDb();

  db.get('SELECT id, card_id, name, saldo FROM students WHERE card_id = ?', [safeCardId], (err, row) => {
    if (err) {
      db.close();
      return res.status(500).json({ ok: false, message: 'Gagal mengecek saldo', error: err.message });
    }

    if (!row) {
      db.close();
      return res.status(404).json({ ok: false, message: 'Santri tidak ditemukan' });
    }

    if (row.saldo < safeAmount) {
      db.close();
      return res.status(400).json({ ok: false, message: 'Saldo santri tidak mencukupi', saldo: row.saldo });
    }

    const newSaldo = row.saldo - safeAmount;

    db.run('UPDATE students SET saldo = ? WHERE card_id = ?', [newSaldo, safeCardId], (updateErr) => {
      if (updateErr) {
        db.close();
        return res.status(500).json({ ok: false, message: 'Gagal update saldo', error: updateErr.message });
      }

      db.run(
        'INSERT INTO payments (card_id, name, amount, note) VALUES (?, ?, ?, ?)',
        [safeCardId, row.name, safeAmount, note || 'Pembayaran produk'],
        (insertErr) => {
          db.close();
          if (insertErr) {
            return res.status(500).json({ ok: false, message: 'Gagal mencatat transaksi', error: insertErr.message });
          }

          res.json({
            ok: true,
            message: 'Pembayaran berhasil',
            data: {
              cardId: safeCardId,
              name: row.name,
              amount: safeAmount,
              saldoTerbaru: newSaldo
            }
          });
        }
      );
    });
  });
});

app.listen(PORT, () => {
  initDb();
  console.log(`RFID API running at http://localhost:${PORT}`);
});

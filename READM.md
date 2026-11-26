<div align="center">

<img src="images/logo.png" alt="Ketenangan Jiwa" width="160" />

# Ketenangan Jiwa

**Website Pengajian Online & Tiket Kajian Islami**

Aplikasi web untuk mengelola kajian/event islami secara online — melihat jadwal, mendaftar, membayar tiket, hingga menerima e-ticket ber-QR. Dilengkapi dzikir dan sholawatan.

[![JavaScript](https://img.shields.io/badge/JavaScript-ESM-f7df1e?logo=javascript&logoColor=000)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-ffca28?logo=firebase&logoColor=000)](https://firebase.google.com)
[![Tripay](https://img.shields.io/badge/Pembayaran-Tripay-0ea5e9)](https://tripay.co.id)
[![Tests](https://img.shields.io/badge/tests-29%20passed-22c55e?logo=jest&logoColor=fff)](https://jestjs.io)

</div>

## Tentang Proyek

**Ketenangan Jiwa** memudahkan jamaah mengikuti kajian islami secara online. Mulai dari melihat daftar event, melihat detail (jadwal, lokasi, pemateri, harga), memilih tiket reguler/VIP, menggunakan kode referral, hingga membayar melalui **Virtual Account bank** atau **QRIS** dan menerima **e-ticket digital ber-QR** langsung ke email.

---

## Fitur Utama

| Kategori | Fitur |
|---|---|
| Autentikasi | Registrasi, login email/password & Google, lupa password (Firebase Auth) |
| Event | Daftar event, detail event, status kuota/sold out |
| Pemesanan | Pilih tiket reguler/VIP, validasi data peserta (wajib email Gmail) |
| Referral | Validasi kode referral & potongan harga dengan batas pemakaian |
| Pembayaran | Virtual Account bank (BCA/BNI/BRI/Mandiri/BSI/Permata), QRIS, tiket gratis |
| Tiket | Tiket digital + kode QR, e-ticket via email (Resend) + lampiran PDF |
| Pelengkap | Halaman Dzikir Pagi & Sore, Sholawatan |
| Admin | Dashboard pengelolaan event, transaksi, check-in, dan referral |

---

## Teknologi

**Frontend** — HTML5, CSS3, JavaScript (ES Modules via CDN), Tailwind CSS, Firebase Web SDK 10.12.2.

**Backend & Data** — Firebase Authentication, Cloud Firestore, Cloud Functions (Node 22, Express 5), Vercel Serverless Functions (`api/`).

**Integrasi** — Tripay (payment gateway), Resend (email transaksional), PDFKit (tiket PDF), QR code.

**Testing** — Jest.

---

## Struktur Proyek

```
.
├── index.html              Halaman utama (event, dzikir, kontak)
├── event-detail.html       Detail event + form pemesanan & pembayaran
├── ticket.html             Halaman e-ticket & QR
├── admin.html              Dashboard admin
├── dzikir-pagi.html        Halaman dzikir pagi
├── dzikir-sore.html        Halaman dzikir sore
├── sholawatan.html         Halaman sholawatan
├── js/                     Logika frontend (auth, event, pembayaran)
├── css/                    Stylesheet
├── api/                    Vercel serverless functions + _lib helper
│   ├── payments/           create, status, cancel, webhook
│   ├── referrals/          validasi kode referral
│   └── _lib/               tripay, email, referral, ticket_pdf
├── functions/              Cloud Functions Firebase (Express)
├── src/utils/              Validasi registrasi akun
├── __tests__/              Unit test (Jest)
└── images/                 Aset gambar & logo
```

---

## Menjalankan Secara Lokal

### Prasyarat

- Node.js 18+ (Cloud Functions memakai Node 22)
- Akun [Firebase](https://firebase.google.com) (proyek `pengajian-online`)
- Kredensial [Tripay](https://tripay.co.id) (mode sandbox untuk pengujian)
- API key [Resend](https://resend.com) (untuk kirim email)

### Langkah

```bash
# 1. Clone repositori
git clone https://github.com/renowahyusanrama/ketenangan-jiwa.git
cd ketenangan-jiwa

# 2. Install dependensi root (untuk unit test)
npm install

# 3. Jalankan unit test
npm test

# 4. Sajikan frontend (misal dengan server statis)
npx serve .
```

> Frontend memuat Firebase lewat CDN; pastikan konfigurasi Firebase pada `js/auth.js`, `js/events_feed.js`, dan `js/event_detail.js` menunjuk ke proyek kamu.

### Backend (Cloud Functions & Serverless Functions)

```bash
cd functions
npm install
firebase emulators:start --only functions
```

---

## Variabel Environment

| Variabel | Fungsi |
|---|---|
| `TRIPAY_API_KEY` | API key Tripay |
| `TRIPAY_PRIVATE_KEY` | Private key untuk signature callback |
| `TRIPAY_MERCHANT_CODE` | Kode merchant Tripay |
| `TRIPAY_MODE` | `sandbox` (default) atau `production` |
| `TRIPAY_CALLBACK_URL` | URL webhook pembayaran |
| `TRIPAY_RETURN_URL` | URL kembali setelah pembayaran |
| `TRIPAY_GATEWAY_CREATE_URL` / `TRIPAY_GATEWAY_CANCEL_URL` | Gateway pembayaran (opsional) |
| `RESEND_API_KEY` | API key Resend |
| `RESEND_FROM` | Alamat pengirim email |
| `RESEND_OWNER_EMAIL` | Email penerima (mode testing Resend) |
| `TICKET_BASE_URL` | Base URL halaman tiket |

---

## Pengujian

```bash
npm test
```

| Suite | Keterangan |
|---|---|
| `registrationValidator.test.js` | Validasi form registrasi akun |
| `referral.test.js` | Pemakaian & batas referral (Stub, Spy, Dummy, Fake) |

---

## Dokumentasi & QA

Dokumentasi *Software Quality Assurance* tersedia pada folder `docs/`:

| Modul | Isi |
|---|---|
| Modul 1 | Test Plan, Risk Register, Draf Sumber Requirement |
| Modul 2 | Pre-Lab, Test Design Specification (TDS), Test Traceability Matrix (TTM) |

---

## Alur Pemesanan

```text
Pilih event
   │
   ▼
Pilih tiket (Reguler / VIP)
   │
   ▼
Isi data peserta  ──▶  Kode referral (opsional, maks. 5x per email per kode)
   │
   ▼
Bayar (Virtual Account / QRIS / gratis)
   │
   ▼
E-ticket PDF + QR  ──▶  Email (Resend)
```

1. **Pilih event** — daftar event dengan pencarian kata kunci dan filter kategori.
2. **Pilih tiket** — Reguler atau VIP, lengkap dengan status kuota/sold out.
3. **Isi data peserta** — nama, nomor WhatsApp, dan email (wajib Gmail).
4. **Kode referral (opsional)** — divalidasi ke Firestore, maksimal 5 pemakaian per email per kode.
5. **Bayar** — Virtual Account (BCA, BNI, BRI, Mandiri, BSI, Permata), QRIS, atau gratis.
6. **E-ticket** — PDF ber-QR dikirim ke email setelah pembayaran dikonfirmasi.

---

## Arsitektur

```text
Browser (HTML/CSS/JS + Firebase Web SDK)
│
├─ Firebase Auth ......... registrasi, login, reset password
├─ Cloud Firestore ....... events, orders, referrals/{kode}/uses/{email}
│
├─ api/ (Vercel) ......... payments/, referrals/, _lib/
│    ├─ Tripay ........... Virtual Account & QRIS
│    └─ Resend ........... email e-ticket (PDF + QR)
│
└─ functions/ (Firebase) . endpoint pembayaran versi Express
```

---

## Model Data

| Path Firestore | Isi |
|---|---|
| `events/{eventId}` | Data event: jadwal, lokasi, pemateri, harga, kuota |
| `orders/{orderId}` | Transaksi: tiket, status pembayaran, data peserta |
| `referrals/{kode}` | Aturan referral: berlaku untuk tiket apa, harga setelah diskon |
| `referrals/{kode}/uses/{email}` | Jumlah pemakaian kode oleh satu email |

---

## Catatan Teknis

- **Webhook terverifikasi.** Callback Tripay dicek signature-nya memakai raw body sebelum order diubah (`api/payments/webhook.js`).
- **Referral dibatasi.** Pemakaian dicatat per email di dalam Firestore transaction, maksimal **5x**; hasilnya ditulis ke order (`usageApplied`, `usageError`) sebagai jejak audit (`api/_lib/referral.js`).
- **E-ticket.** PDF dibuat dengan PDFKit, kode QR dengan `qrcode`, lalu dikirim lewat Resend.
- **Dua backend.** `api/` untuk Vercel Serverless dan `functions/` untuk Firebase Cloud Functions (Express) dengan endpoint pembayaran yang sama.
- **Unit test tanpa database.** Firestore diisolasi dengan Stub, Spy, Dummy, dan Fake (`api/_lib/referral.test.js`).

---

## Filosofi Nama

> "Ingatlah, hanya dengan mengingat Allah hati menjadi tenang."
> — QS. Ar-Ra'd: 28

Nama **Ketenangan Jiwa** merujuk pada ayat tersebut — sejalan dengan tujuan aplikasi: memudahkan jamaah mengikuti kajian, dzikir, dan sholawatan.

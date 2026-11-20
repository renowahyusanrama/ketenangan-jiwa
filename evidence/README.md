# Evidence — Modul 3 (Black Box Functional Testing)

Folder bukti untuk eksekusi test case 8 fitur User (peserta) pada aplikasi **Ketenangan Jiwa** (workbook `Reno Wahyu Sanrama_202310370311102_Modul3.xlsx`).

## Cakupan 8 fitur yang diuji

| # | Fitur | Kebutuhan | Teknik |
|---|---|---|---|
| F1 | Registrasi akun | RQ-001 | BVA (batas bawah password) + EP |
| F2 | Login | RQ-002 | EP |
| F3 | Lupa password | RQ-003 | EP |
| F4 | Daftar & pencarian event | RQ-004 | EP |
| F5 | Detail event | RQ-005 | EP |
| F6 | Pemesanan tiket & data peserta | RQ-006 | BVA (4n+1, n=2) + EP |
| F7 | Kode referral | RQ-007 | EP |
| F8 | Pembayaran | RQ-008 | EP |

## Cara membaca bukti

1. **Screenshot browser** (`screenshots/`) — dieksekusi via Playwright (Chromium headless).
2. **Kode sumber** — titik validasi/perilaku nyata.
3. **Patch** (`perbaikan-INC-001-004.patch`) — diff perbaikan cair dan penambahan fitur pencarian/filter.

## Screenshot (bukti eksekusi)

### F6 — Pemesanan (setelah perbaikan, ditolak dengan benar)

| Screenshot | Test Case | Pesan |
|---|---|---|
| `TC-EP-03.png` | TC-EP-03 | "Email harus menggunakan Gmail…" |
| `TC-EP-05.png` | TC-EP-05 | "Ditolak pada Nama Lengkap: minimal 3 karakter." |
| `TC-EP-06.png` | TC-EP-06 | "Ditolak pada No. WhatsApp: minimal 10 digit." |
| `TC-EP-07.png` | TC-EP-07 | "… maksimal 50 karakter." |
| `TC-EP-08.png` | TC-EP-08 | "… maksimal 15 digit." |
| `TC-EP-09.png` | TC-EP-09 | "… hanya boleh angka." |
| `BEFORE-TC-EP-05.png` | TC-EP-05 (sebelum) | "Failed to fetch" — bukti cacat (nama 2 karakter diterima) |
| `BEFORE-TC-EP-09.png` | TC-EP-09 (sebelum) | "Failed to fetch" — bukti cacat (WA berhuruf diterima) |

### F4 — Pencarian & filter (setelah fitur ditambahkan)

| Screenshot | Test Case | Keterangan |
|---|---|---|
| `TC-EP-29.png` | TC-EP-29 | Pencarian "al-baqarah" menyaring daftar event |
| `TC-EP-30.png` | TC-EP-30 | Filter kategori "Tafsir" |
| `TC-EP-31.png` | TC-EP-31 | Pencarian "zzzz" → state kosong tampil |

### Screenshot `BEFORE-*`

Direproduksi dari build asli (commit `7902cb9`) via route interception tanpa mengubah file kerja, untuk menunjukkan cacat sebelum perbaikan.

## Defect ditemukan & diperbaiki

| Incident | Ringkasan | Status |
|---|---|---|
| INC-001 | Nama Lengkap tidak divalidasi panjang (3-50) | Diperbaiki & diverifikasi |
| INC-002 | No. WhatsApp tidak divalidasi digit (10-15) | Diperbaiki & diverifikasi |
| INC-003 | No. WhatsApp menerima huruf | Diperbaiki & diverifikasi |
| INC-004 | Pencarian & filter event belum ada (RQ-004) | Ditambahkan & diverifikasi |

Detail tiap insiden (lingkungan, langkah, hasil diharapkan vs aktual, severity) ada di sheet **06_Indeks_Incident**.

## File

- `screenshots/` — 11 screenshot bukti eksekusi.
- `perbaikan-INC-001-004.patch` — diff perbaikan validasi (`js/event_detail.js`) + penambahan pencarian/filter (`index.html`, `js/events_feed.js`).
# Refactoring Summary - QR Scanner & Cloudinary Extraction

## 📁 File Structure Baru

```
/ketenangan-jiwa/
├── src/
│   ├── admin-refactored.js          [BARU] Entry point untuk services
│   └── services/
│       ├── QrScannerService.js      [BARU] QR scanner logic
│       └── UploadWidgetService.js   [BARU] Cloudinary upload logic
├── js/
│   └── admin.js                     [DIUBAH] Menghapus QR & Cloudinary code
└── REFACTORING_GUIDE.md             [BARU] Detail lengkap
```

---

## 🔴 Bagian js/admin.js Yang Harus DIHAPUS

### 1. KONSTANTA QR SCANNER (Baris ~80-82)
```javascript
const SCAN_DELAY_MS = 300;
const SCAN_COOLDOWN_MS = 1200;
```
✅ **Dipindahkan ke:** QrScannerService.js

---

### 2. VARIABEL GLOBAL QR (Baris ~130-134)
```javascript
let qrScanner = null;
let qrScanning = false;
let scanBusy = false;
let lastUsedWarningRef = null;  // Untuk verification logic
```
✅ **Dipindahkan ke:** QrScannerService.js

---

### 3. KONSTANTA CLOUDINARY (Baris ~38-41)
```javascript
const CLOUDINARY_CLOUD_NAME = "dkhieufnk";
const CLOUDINARY_UPLOAD_PRESET = "posters";
const CLOUDINARY_FOLDER = "posters";
```
✅ **Dipindahkan ke:** UploadWidgetService.js

---

### 4. VARIABEL CLOUDINARY (Baris ~128)
```javascript
let cloudinaryWidget = null;
```
✅ **Dipindahkan ke:** UploadWidgetService.js

---

## 🟡 Fungsi Yang Harus DIHAPUS atau DIUBAH

### HAPUS: `initCloudinaryWidget()` (Baris ~2170-2198)
```javascript
function initCloudinaryWidget() {
  if (cloudinaryWidget || !window.cloudinary) return;
  if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME.startsWith("GANTI")) {
    console.warn("Cloudinary belum dikonfigurasi...");
    return;
  }
  cloudinaryWidget = window.cloudinary.createUploadWidget({ ... }, (error, result) => { ... });
}
```
✅ **Ganti dengan:** `uploadWidget.init(onSuccess, onError)` di dalam onAuthStateChanged

---

### HAPUS: `openUpload()` (Baris ~2200-2210)
```javascript
function openUpload() {
  if (!cloudinaryWidget && window.cloudinary) {
    initCloudinaryWidget();
  }
  if (!cloudinaryWidget) {
    alert("Widget Cloudinary belum siap atau konfigurasi belum diisi.");
    return;
  }
  cloudinaryWidget.open();
}
```
✅ **Ganti dengan:** `uploadWidget.open()` di event listener

---

### HAPUS: `startQrScan()` (Baris ~334-360)
```javascript
async function startQrScan() {
  if (!qrReaderEl) { ... }
  if (qrScanning) { ... }
  if (typeof window.Html5Qrcode === "undefined") { ... }
  try {
    qrScanner = new Html5Qrcode(qrReaderEl.id);
    await qrScanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 220 }, 
      async (decodedText) => { ... },
      () => { ... }
    );
    qrScanning = true;
    setQrStatus("Memindai... arahkan kamera ke QR tiket.");
  } catch (err) { ... }
}
```
✅ **Ganti dengan:** `await qrScanner.start(onScan, onError)` di event listener

---

### HAPUS: `stopQrScan()` (Baris ~315-331)
```javascript
async function stopQrScan() {
  if (qrScanner && qrScanning) {
    try {
      await qrScanner.stop();
      await qrScanner.clear();
    } catch (err) { ... }
  }
  qrScanner = null;
  qrScanning = false;
  setQrStatus("Scanner berhenti.");
}
```
✅ **Ganti dengan:** `await qrScanner.stop()` di event listener

---

### HAPUS: `extractRefFromQr()` (Baris ~286-299)
```javascript
function extractRefFromQr(text) {
  if (!text) return "";
  const raw = String(text).trim();
  try {
    const url = new URL(raw);
    const fromParam = url.searchParams.get("ref");
    if (fromParam) return fromParam;
  } catch (err) { ... }
  const match = raw.match(/ref=([^&]+)/i);
  if (match && match[1]) return decodeURIComponent(match[1]);
  return raw;
}
```
✅ **Dipindahkan ke:** `QrScannerService.extractRef()`

---

## 🟢 Event Listeners Yang Harus DIUBAH

### UPDATE: `toggleQrPanelBtn` listener (Baris ~2281-2298)
**BEFORE:**
```javascript
toggleQrPanelBtn?.addEventListener("click", () => {
  if (!qrPanel) return;
  const hidden = qrPanel.classList.contains("hidden");
  if (hidden) {
    qrPanel.classList.remove("hidden");
    startQrScan();
  } else {
    qrPanel.classList.add("hidden");
    stopQrScan();
  }
});
```

**AFTER:**
```javascript
toggleQrPanelBtn?.addEventListener("click", async () => {
  if (!qrPanel || !qrScanner) return;
  const hidden = qrPanel.classList.contains("hidden");
  if (hidden) {
    qrPanel.classList.remove("hidden");
    try {
      await qrScanner.start(
        (ref) => verifyByRef(ref),
        (error) => setQrStatus("Error: " + error.message, true)
      );
      setQrStatus("Memindai... arahkan kamera ke QR tiket.");
    } catch (error) {
      setQrStatus("Tidak bisa memulai kamera: " + error.message, true);
    }
  } else {
    qrPanel.classList.add("hidden");
    await qrScanner.stop();
    setQrStatus("Scanner berhenti.");
  }
});
```

---

### UPDATE: `qrStopBtn` listener (Baris ~2299-2303)
**BEFORE:**
```javascript
qrStopBtn?.addEventListener("click", () => {
  stopQrScan();
  qrPanel?.classList.add("hidden");
});
```

**AFTER:**
```javascript
qrStopBtn?.addEventListener("click", async () => {
  await qrScanner?.stop();
  qrPanel?.classList.add("hidden");
  setQrStatus("Scanner berhenti.");
});
```

---

### UPDATE: `uploadPosterBtn` listener (Baris ~2274)
**BEFORE:**
```javascript
uploadPosterBtn?.addEventListener("click", openUpload);
```

**AFTER:**
```javascript
uploadPosterBtn?.addEventListener("click", () => {
  if (!uploadWidget) {
    alert("Widget Cloudinary belum siap atau konfigurasi belum diisi.");
    return;
  }
  try {
    uploadWidget.open();
  } catch (error) {
    alert("Gagal membuka widget: " + error.message);
  }
});
```

---

## 📝 Perubahan di onAuthStateChanged (Baris ~2337-2357)

### TAMBAH di awal file:
```javascript
import { initializeServices } from "./src/admin-refactored.js";

// Deklarasi global services
let qrScanner, uploadWidget;
```

### UPDATE callback:
**BEFORE (bagian akhir):**
```javascript
onAuthStateChanged(auth, async (user) => {
  // ... auth checks ...
  if (!isAdmin) {
    stopQrScan();           // ❌ HAPUS
    // ... 
  }
  // ...
  initCloudinaryWidget();   // ❌ HAPUS/GANTI
});
```

**AFTER:**
```javascript
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (!user) {
    isAdmin = false;
    await qrScanner?.stop();   // ✅ GANTI
    qrPanel?.classList.add("hidden");
    resetOrdersRealtime();
    setDashboardVisible(false);
    setGuard("Silakan login dengan akun admin.");
    showLoggedOutUI();
    return;
  }

  setGuard("Memeriksa hak akses admin...");

  try {
    isAdmin = await requireAdmin(user);
  } catch (err) {
    console.error(err);
    isAdmin = false;
  }

  adminStatus.textContent = isAdmin ? "admin" : "bukan admin";
  adminStatus.className = isAdmin ? "badge green" : "badge gray";

  if (!isAdmin) {
    await qrScanner?.stop();    // ✅ GANTI
    qrPanel?.classList.add("hidden");
    resetOrdersRealtime();
    setDashboardVisible(false);
    showLoggedOutUI();
    setGuard("Akun ini tidak memiliki akses admin. Minta panitia menambahkan custom claim admin.", false);
    return;
  }

  // ✅ TAMBAH: Initialize services
  const services = initializeServices();
  qrScanner = services.qrScanner;
  uploadWidget = services.uploadWidget;

  showLoggedInUI(user.email || user.uid);
  setGuard("Akses admin diberikan.", true);
  setDashboardVisible(true);
  resetForm();
  await loadEvents();
  loadOrders(true);
  loadReferrals();
  
  // ✅ GANTI initCloudinaryWidget() dengan:
  uploadWidget.init(
    (info) => {
      const url = info.secure_url;
      const finalUrl = normalizePosterUrl(url);
      eventForm.imageUrl.value = finalUrl;
      renderPosterPreview(finalUrl);
      const dimensionNote = info.width && info.height ? ` (${info.width}x${info.height})` : "";
      formStatus.textContent = `Poster diunggah${dimensionNote}.`;
    },
    (error) => {
      console.error("Upload error:", error);
      alert("Upload gagal: " + error.message);
    }
  );
});
```

---

## ✅ Fungsi Yang Tetap di js/admin.js

```javascript
function setQrStatus(message, isError = false, isSuccess = false) { ... }     // ✅ TETAP
function verifyByRef(refValue) { ... }                                         // ✅ TETAP
function findOrderIdByRef(refValue) { ... }                                    // ✅ TETAP
function updateCheckin(orderId, verified) { ... }                              // ✅ TETAP
function normalizePosterUrl(url) { ... }                                       // ✅ TETAP
```

---

## 📊 Statistik Refactoring

| Kategori | Sebelum | Sesudah | Dihapus |
|----------|---------|---------|---------|
| Baris kode js/admin.js | 2355 | ~2155 | ~200 |
| Variabel global | 106+ | 100+ | 6 |
| Konstanta | ~30 | ~27 | 3 |
| Fungsi | ~80 | ~76 | 4 |
| Services | 0 | 2 | - |
| Class definitions | 0 | 2 | - |

---

## 🎯 Keuntungan Setelah Refactoring

✅ **SRP (Single Responsibility Principle)**
- Masing-masing service punya satu tanggung jawab jelas
- Tidak ada mixing logic antara QR/Cloudinary/Auth

✅ **Testability**
- QrScannerService dapat di-test tanpa Firebase/DOM
- UploadWidgetService dapat di-test tanpa html5qrcode

✅ **Reusability**
- Services dapat diimport di file JS lain
- Tidak perlu copy-paste kode

✅ **Maintainability**
- Update Cloudinary widget hanya di satu tempat
- Update QR scanner logic hanya di satu tempat
- js/admin.js menjadi lebih fokus pada domain logic

---

## 🚀 Cara Implementasi

1. Buat file-file baru:
   - `src/services/QrScannerService.js` ✅ SUDAH DIBUAT
   - `src/services/UploadWidgetService.js` ✅ SUDAH DIBUAT
   - `src/admin-refactored.js` ✅ SUDAH DIBUAT

2. Edit `js/admin.js`:
   - Tambah import
   - Hapus kode yang sudah dipindahkan
   - Update event listeners
   - Update onAuthStateChanged callback

3. Test di browser:
   - Verifikasi QR scanner berfungsi
   - Verifikasi upload widget berfungsi
   - Check console untuk errors

---

## 📚 Referensi Implementasi Lengkap

Lihat `REFACTORING_GUIDE.md` untuk contoh lengkap dan detail implementation.

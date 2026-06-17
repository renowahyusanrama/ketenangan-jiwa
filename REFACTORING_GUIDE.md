# Refactoring Documentation: SRP Implementation

## Overview
File `js/admin.js` telah direfactor untuk mengikuti **Single Responsibility Principle (SRP)**. Logika QR Scanner dan Cloudinary Upload Widget telah dipisahkan ke service-service terpisah.

---

## File-File Baru Dibuat

### 1. `src/services/QrScannerService.js`
**Tanggung Jawab:**
- Inisialisasi dan kontrol Html5Qrcode scanner
- Parsing QR data dan ekstraksi reference code
- Debouncing dan throttling scan events

**Interface Public:**
```javascript
class QrScannerService {
  constructor(scannerElementId)
  
  // Statics
  static isLibraryAvailable()
  
  // Methods
  async start(onScan, onError)
  async stop()
  extractRef(qrData)           // Extract reference from QR data
  getIsScanning()
  isInitialized()
  async destroy()
}
```

**Contoh Penggunaan:**
```javascript
import { QrScannerService } from "./src/services/QrScannerService.js";

const qrScanner = new QrScannerService("qrReader");

// Start scanning
await qrScanner.start(
  (ref) => {
    console.log("QR detected:", ref);
    // Do verification logic here (call verifyByRef)
  },
  (error) => console.error("Scanner error:", error)
);

// Stop scanning
await qrScanner.stop();
```

### 2. `src/services/UploadWidgetService.js`
**Tanggung Jawab:**
- Inisialisasi Cloudinary upload widget
- Konfigurasi widget settings
- Pembukaan modal upload

**Interface Public:**
```javascript
class UploadWidgetService {
  constructor(cloudName, uploadPreset, folder)
  
  // Statics
  static isLibraryAvailable()
  
  // Methods
  init(onSuccess, onError)
  open()
  isConfigured()
  isInitialized()
  setCallbacks(onSuccess, onError)
  destroy()
}
```

**Contoh Penggunaan:**
```javascript
import { UploadWidgetService } from "./src/services/UploadWidgetService.js";

const uploadWidget = new UploadWidgetService(
  "dkhieufnk",    // cloudName
  "posters",      // uploadPreset
  "posters"       // folder
);

uploadWidget.init(
  (info) => {
    console.log("Upload success:", info);
    // Update form, preview, etc.
  },
  (error) => console.error("Upload error:", error)
);

// Open widget
uploadWidget.open();
```

### 3. `src/admin-refactored.js`
**Tanggung Jawab:**
- Entry point bersih untuk inisialisasi services
- Wiring configuration
- Dependency injection

**Interface Public:**
```javascript
export function initializeServices(overrideConfig = {})
export function getServiceConfig()
export function updateServiceConfig(newConfig = {})
export { QrScannerService, UploadWidgetService }
```

**Contoh Penggunaan:**
```javascript
import { initializeServices } from "./src/admin-refactored.js";

// Di dalam onAuthStateChanged callback:
onAuthStateChanged(auth, async (user) => {
  if (!user || !isAdmin) return;
  
  // Initialize services
  const { qrScanner, uploadWidget } = initializeServices();
  
  // Wire QR scanner
  qrScanner.on("scan", (ref) => verifyByRef(ref));
  
  // Wire upload widget
  uploadWidget.init((info) => {
    // Handle upload
  });
});
```

---

## Kode Yang Harus Dihapus dari js/admin.js

### KODE QR SCANNER (Total: ~200 baris)

**Konstanta:**
```javascript
const SCAN_DELAY_MS = 300;
const SCAN_COOLDOWN_MS = 1200;
```
❌ **HAPUS** - Sudah di QrScannerService

**Variabel Global:**
```javascript
let qrScanner = null;
let qrScanning = false;
let scanBusy = false;
let lastUsedWarningRef = null;
```
❌ **HAPUS** - Sudah di QrScannerService (kecuali `lastUsedWarningRef` yang harus dipindahkan ke verificaton logic)

**DOM Elements:**
```javascript
const toggleQrPanelBtn = document.getElementById("toggleQrPanel");
const qrPanel = document.getElementById("qrPanel");
const qrStatus = document.getElementById("qrStatus");
const qrReaderEl = document.getElementById("qrReader");
const qrInput = document.getElementById("qrInput");
const qrSubmitBtn = document.getElementById("qrSubmitBtn");
const qrStopBtn = document.getElementById("qrStopBtn");
```
✅ **TETAP** - Masih diperlukan untuk DOM interaction

**Fungsi:**
```javascript
function setQrStatus(message, isError = false, isSuccess = false) { ... }
function extractRefFromQr(text) { ... }
async function findOrderIdByRef(refValue) { ... }
async function verifyByRef(refValue) { ... }
async function stopQrScan() { ... }
async function startQrScan() { ... }
```
✅ **REFACTOR** - `setQrStatus()`, `extractRefFromQr()` tetap di admin.js karena untuk DOM update
❌ **PINDAHKAN** - `findOrderIdByRef()`, `verifyByRef()` tetap di admin.js (Firebase logic)
❌ **HAPUS** - `stopQrScan()`, `startQrScan()` - diganti dengan QrScannerService methods

**Event Listeners untuk QR:**
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

qrStopBtn?.addEventListener("click", () => {
  stopQrScan();
  qrPanel?.classList.add("hidden");
});

qrSubmitBtn?.addEventListener("click", () => verifyByRef(qrInput?.value));
qrInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    verifyByRef(qrInput?.value);
  }
});
```
❌ **REFACTOR** - Ganti `startQrScan()` dengan `qrScanner.start()` dan `stopQrScan()` dengan `qrScanner.stop()`

---

### KODE CLOUDINARY (Total: ~100 baris)

**Konstanta:**
```javascript
const CLOUDINARY_CLOUD_NAME = "dkhieufnk";
const CLOUDINARY_UPLOAD_PRESET = "posters";
const CLOUDINARY_FOLDER = "posters";
const POSTER_TRANSFORM = "f_auto,q_auto:good,c_limit,w_2000";
```
❌ **HAPUS** - CLOUDINARY_CLOUD_NAME, UPLOAD_PRESET, FOLDER sudah di UploadWidgetService
✅ **TETAP** - POSTER_TRANSFORM masih diperlukan untuk normalisasi URL

**Variabel Global:**
```javascript
let cloudinaryWidget = null;
```
❌ **HAPUS** - Sudah di UploadWidgetService

**Fungsi:**
```javascript
function normalizePosterUrl(url) { ... }
function initCloudinaryWidget() { ... }
function openUpload() { ... }
```
✅ **TETAP** - `normalizePosterUrl()` tetap di admin.js (utility untuk URL)
❌ **HAPUS** - `initCloudinaryWidget()` diganti dengan `uploadWidget.init()`
❌ **HAPUS** - `openUpload()` diganti dengan `uploadWidget.open()`

**Event Listener untuk Upload:**
```javascript
uploadPosterBtn?.addEventListener("click", openUpload);
```
❌ **REFACTOR** - Ganti `openUpload()` dengan `uploadWidget.open()`

---

## Minimal Changes Required di js/admin.js

### Langkah 1: Tambahkan import di awal file
```javascript
import { initializeServices } from "./src/admin-refactored.js";
```

### Langkah 2: Update onAuthStateChanged callback
**BEFORE:**
```javascript
onAuthStateChanged(auth, async (user) => {
  // ... auth checks ...
  if (!isAdmin) {
    stopQrScan();
    qrPanel?.classList.add("hidden");
    // ...
  }
  
  // ... at the end ...
  initCloudinaryWidget();
});
```

**AFTER:**
```javascript
let qrScanner, uploadWidget;

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (!user) {
    isAdmin = false;
    await qrScanner?.stop();
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
    await qrScanner?.stop();
    qrPanel?.classList.add("hidden");
    resetOrdersRealtime();
    setDashboardVisible(false);
    showLoggedOutUI();
    setGuard("Akun ini tidak memiliki akses admin...", false);
    return;
  }

  // Initialize services untuk admin
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
  
  // Initialize upload widget
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

### Langkah 3: Update QR Scanner event listeners
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

qrStopBtn?.addEventListener("click", () => {
  stopQrScan();
  qrPanel?.classList.add("hidden");
});

qrSubmitBtn?.addEventListener("click", () => verifyByRef(qrInput?.value));
qrInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    verifyByRef(qrInput?.value);
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

qrStopBtn?.addEventListener("click", async () => {
  await qrScanner?.stop();
  qrPanel?.classList.add("hidden");
  setQrStatus("Scanner berhenti.");
});

qrSubmitBtn?.addEventListener("click", () => verifyByRef(qrInput?.value));
qrInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    verifyByRef(qrInput?.value);
  }
});
```

### Langkah 4: Update Upload Widget event listener
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

## Summary of Deletions

### Dari js/admin.js, HAPUS sepenuhnya:

**Konstanta (2 baris):**
- `const SCAN_DELAY_MS = 300;`
- `const SCAN_COOLDOWN_MS = 1200;`

**Variabel Global (4 baris):**
- `let qrScanner = null;`
- `let qrScanning = false;`
- `let scanBusy = false;`
- `let cloudinaryWidget = null;`

**DOM Elements (8 baris):**
- Semua const untuk QR panel, button, input
- Tidak perlu hapus - gunakan untuk DOM interaction

**Konstanta Cloudinary (3 baris):**
- `const CLOUDINARY_CLOUD_NAME = ...`
- `const CLOUDINARY_UPLOAD_PRESET = ...`
- `const CLOUDINARY_FOLDER = ...`

**Fungsi (6 fungsi):**
- `initCloudinaryWidget()` (~30 baris)
- `openUpload()` (~10 baris)
- `startQrScan()` (~40 baris)
- `stopQrScan()` (~15 baris)
- `extractRefFromQr()` (~20 baris) - refactor ke service

**Event Listeners (~40 baris):**
- QR scanner toggle/stop listeners
- Upload button listener

**Total Kode yang Dihapus: ~150-200 baris**

---

## Benefits

✅ **Single Responsibility**
- QrScannerService: Hanya tangani QR scanning logic
- UploadWidgetService: Hanya tangani Cloudinary widget
- admin.js: Fokus pada Firebase auth, event CRUD, orders, referrals

✅ **Testability**
- Services dapat di-test secara isolated tanpa Firebase/DOM
- Callbacks membuat testing lebih mudah

✅ **Reusability**
- Services dapat digunakan di halaman lain (admin, events, etc)
- Configuration dapat di-inject di constructor

✅ **Maintainability**
- Kode lebih organized dan modular
- Changes di Cloudinary/Html5Qrcode hanya affect services
- Easier to debug dan trace errors

---

## Next Steps

1. ✅ Buat QrScannerService.js
2. ✅ Buat UploadWidgetService.js
3. ✅ Buat admin-refactored.js entry point
4. 📝 Refactor js/admin.js dengan langkah 1-4 di atas
5. 🧪 Test QR scanner functionality
6. 🧪 Test Cloudinary upload functionality
7. 📚 Update dokumentasi API untuk team

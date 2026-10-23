// js/auth.js — Google Sign-In + Email/Password (login & daftar) dengan Firebase

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  getRedirectResult, onAuthStateChanged, signOut, getIdTokenResult,
  setPersistence, browserLocalPersistence,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// === Config proyekmu ===
const firebaseConfig = {
  apiKey: "AIzaSyCoa_Ioa-Gp9TnL5eke6fwTkfQGkbWGJBw",
  authDomain: "pengajian-online.firebaseapp.com",
  projectId: "pengajian-online",
  storageBucket: "pengajian-online.firebasestorage.app",
  messagingSenderId: "965180253441",
  appId: "1:965180253441:web:f03f6cb969e422fd7e2700",
  measurementId: "G-YJ81SDXM5E"
};

// === Init ===
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'id';
const db = getFirestore(app);
await setPersistence(auth, browserLocalPersistence).catch(console.error);
const authGate = document.getElementById('auth-gate');
const bodyEl = document.body;

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

const modal     = document.getElementById('loginModal');
const form      = document.getElementById('loginForm');
const linkReg   = document.querySelector('.link-register');
const linkLoginBack = document.querySelector('.link-login-back');
const footRegister = document.querySelector('.auth-footnote-register');
const footLogin = document.querySelector('.auth-footnote-login');
const submitBtn = form?.querySelector('.btn-login-submit');
let isAdmin = false;
const userOrdersStatus = document.getElementById('userOrdersStatus') || document.getElementById('cartOrdersStatus');
const userOrdersList = document.getElementById('userOrdersList') || document.getElementById('cartOrdersList');
const USER_ORDER_LIMIT = 10;
let userOrdersLoading = false;
const ORDER_STATUS_CLASSES = {
  paid: "green",
  pending: "yellow",
  expired: "gray",
  failed: "red",
  canceled: "red",
  refunded: "blue",
};

// ——— Modal helpers (FIX: TOMBOL SILANG AKTIF)
function closeModal(){
  if(!modal) return;
  modal.classList.remove('open');
  modal.style.display = 'none'; // Tambahkan ini agar overlay tidak menghalangi
  document.body.style.overflow = '';
}

function openModal() {
  if(!modal) return;
  modal.classList.add('open');
  modal.style.display = 'block'; // Tambahkan ini agar modal muncul
  document.body.style.overflow = 'hidden';
}

// Tambahan Event Listener untuk Tombol Silang dan Area Luar
document.addEventListener('click', (e) => {
  if (e.target.closest('.modal-close') || e.target.closest('[data-close="true"]') || e.target.classList.contains('modal-overlay')) {
    closeModal();
  }
});

// ——— Pastikan ada #auth-slot untuk swap UI
function ensureAuthSlot(){
  let slot = document.getElementById('profileDropdown');
  if (slot) return slot;
  const navRight = document.querySelector('.nav-right');
  if (!navRight) return null;
  slot = document.createElement('div');
  slot.id = 'profileDropdown';
  slot.className = 'profile-dropdown hidden';
  navRight.appendChild(slot);
  return slot;
}
function getAuthSlot(){ return ensureAuthSlot(); }

// ——— Renderers
function renderLoginButton(){
  const slot = getAuthSlot();
  if(!slot) return;
  slot.dataset.state = 'logged-out';
  slot.classList.remove('open');
  slot.classList.remove('hidden');
  slot.innerHTML = `
    <div class="login-inline">
      <button type="button" class="btn-inline-login" style="padding: 8px 16px; background: #3775B5; color: white; border-radius: 8px; border: none; cursor: pointer;">Login</button>
    </div>
  `;
  slot.querySelector('.btn-inline-login')?.addEventListener('click', (e)=>{
    e.preventDefault();
    openModal();
  });
}

// FIX: TAMPILAN PROFIL LURUS (Tidak Miring)
function renderUserChip(user){
  const slot = getAuthSlot();
  if(!slot) return;
  slot.dataset.state = 'logged-in';
  slot.classList.remove('hidden');
  const photo = user.photoURL
    ? `<img class="avatar" src="${user.photoURL}" alt="" style="width:35px; height:35px; border-radius:50%; object-fit:cover; flex-shrink:0;">`
    : `<span class="avatar avatar-fallback" style="width:35px; height:35px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; background:#eee; flex-shrink:0;">${(user.displayName||user.email||'U').charAt(0)}</span>`;
  
  slot.innerHTML = `
    <div class="profile-head" style="display:flex; align-items:center; gap:12px; padding:15px; border-bottom:1px solid #eee;">
      ${photo}
      <div style="display:flex; flex-direction:column; text-align:left; line-height:1.2; overflow:hidden;">
        <p class="profile-name" style="font-weight:bold; font-size:14px; margin:0; color:#333; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${user.displayName || user.email}</p>
        <p class="profile-email" style="font-size:11px; color:#777; margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${user.email || ''}</p>
      </div>
    </div>
    <ul class="menu" style="list-style:none; padding:10px; margin:0;">
      ${isAdmin ? '<li><a href="admin.html" style="padding:8px 0; display:block; color:#3775B5;">Admin</a></li>' : ''}
    </ul>
    <button class="logout-btn" type="button" style="width:100%; text-align:left; padding:10px; color:#e11d48; border:none; background:none; cursor:pointer; font-weight:600;">Keluar</button>
  `;
  slot.querySelector('.logout-btn')?.addEventListener('click', async ()=>{
    try{ await signOut(auth); location.reload(); }catch(e){ console.error(e); }
  });
}

// ——— Helper functions (Tetap dipertahankan sesuai kode Reno)
function formatCurrency(amount) {
  const n = Number(amount) || 0;
  if (!n) return "Gratis";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function formatDateTime(value) {
  if (!value) return "-";
  try {
    const date = value?.toDate ? value.toDate() : new Date(value);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(date);
  } catch (err) { return "-"; }
}

function getStatusClass(status) {
  const key = (status || "").toLowerCase();
  return ORDER_STATUS_CLASSES[key] || "gray";
}

function setOrdersPlaceholder(message) {
  if (!userOrdersList) return;
  userOrdersList.innerHTML = `<p class="muted text-center">${message}</p>`;
}

function setOrdersStatus(message) {
  if (!userOrdersStatus) return;
  userOrdersStatus.textContent = message || "";
}

function buildOrderCardHtml(order) {
  const status = (order.status || "pending").toLowerCase();
  const statusClass = getStatusClass(status);
  const totalAmount = order.totalAmount ?? order.amount ?? 0;
  const amountText = formatCurrency(totalAmount);
  const method = order.paymentType === "bank_transfer" ? `VA ${order.bank?.toUpperCase() || "BANK"}` : (order.paymentType || order.method || "-").toString().toUpperCase();
  const reference = order.reference || order.merchantRef || order.orderId || "-";
  return `
    <article class="order-card">
      <div class="order-card-header">
        <h3 class="order-card-heading">${order.eventTitle || order.eventId || "Event"}</h3>
        <span class="badge ${statusClass}">${status.toUpperCase()}</span>
      </div>
      <div class="order-row">
        <div><span class="order-label">Total Bayar</span><span class="order-value">${amountText}</span></div>
        <div><span class="order-label">Metode</span><span class="order-value">${method}</span></div>
      </div>
      <div class="order-card-meta">
        <span><i class="fa-regular fa-clock"></i> ${formatDateTime(order.createdAt || order.created_at)}</span>
        <span><i class="fa-solid fa-hashtag"></i> ${reference}</span>
      </div>
    </article>
  `;
}

async function loadUserOrders(email) {
  if (!userOrdersList) return;
  if (!email) {
    setOrdersPlaceholder("Silakan login untuk melihat pesanan.");
    return;
  }
  if (userOrdersLoading) return;
  userOrdersLoading = true;
  try {
    const ref = collection(db, "orders");
    const q = query(ref, where("customer.email", "==", email), orderBy("createdAt", "desc"), limit(USER_ORDER_LIMIT));
    const snap = await getDocs(q);
    if (!snap || !snap.docs.length) {
      setOrdersPlaceholder("Belum ada pesanan.");
      return;
    }
    const orders = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    userOrdersList.innerHTML = orders.map(buildOrderCardHtml).join("");
  } catch (err) { console.error(err); } finally { userOrdersLoading = false; }
}

function hideAuthGate(){
  authGate?.classList.add('hidden');
  if(authGate) authGate.style.display = 'none'; // Sembunyikan total agar tidak menghalangi tombol
  bodyEl.classList.remove('auth-locked');
  document.body.style.overflow = '';
}

async function refreshAdminFlag(user){
  if(!user){ isAdmin = false; return; }
  try{
    const token = await getIdTokenResult(user);
    isAdmin = !!token.claims?.admin;
  }catch(err){ isAdmin = false; }
}

async function renderAfterAuth(user){
  await refreshAdminFlag(user);
  renderUserChip(user);
  hideAuthGate();
  closeModal();
}

// ——— GOOGLE LOGIN (FIX: TOMBOL GOOGLE AKTIF)
let authBusy = false;
document.addEventListener('click', async (e)=>{
  const btn = e.target.closest('.btn-google');
  if(!btn) return;
  e.preventDefault();
  if(authBusy) return;
  authBusy = true; btn.disabled = true;

  try{
    const res = await signInWithPopup(auth, provider);
    if(res?.user){ await renderAfterAuth(res.user); }
  }catch(err){
    if (err.code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, provider);
    } else { console.error(err); }
  }finally{
    authBusy = false; btn.disabled = false;
  }
});

getRedirectResult(auth).then(async (res) => { if(res?.user){ await renderAfterAuth(res.user); } });

// ——— Observer state (FIX: Dashboard jangan dikunci)
onAuthStateChanged(auth, (user)=>{
  loadUserOrders(user ? user.email : null);
  if(user) {
    renderAfterAuth(user);
    hideAuthGate();
    modal?.classList.remove('open');
  } else {
    isAdmin = false;
    renderLoginButton();
    hideAuthGate(); 
    modal?.classList.remove('open');
  }
});

// ——— Email/Password: Masuk, Daftar, dan Lupa Password
const AUTH_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'Email sudah terdaftar. Silakan masuk atau gunakan Lupa Password.',
  'auth/invalid-email': 'Format email tidak valid.',
  'auth/weak-password': 'Password terlalu lemah. Minimal 6 karakter.',
  'auth/user-not-found': 'Akun dengan email tersebut tidak ditemukan.',
  'auth/wrong-password': 'Email atau password salah.',
  'auth/invalid-credential': 'Email atau password salah.',
  'auth/missing-password': 'Password wajib diisi.',
  'auth/too-many-requests': 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
  'auth/network-request-failed': 'Koneksi bermasalah. Periksa jaringan Anda.',
  'auth/operation-not-allowed': 'Metode email/password belum diaktifkan pada Firebase Console.',
};

function translateAuthError(err) {
  return AUTH_ERROR_MESSAGES[err?.code] || err?.message || 'Terjadi kesalahan. Coba lagi.';
}

function showAuthMessage(formEl, text, type = 'error') {
  const el = formEl?.querySelector('[data-auth-message]');
  if (!el) return;
  el.textContent = text || '';
  el.style.color = type === 'success' ? '#16a34a' : '#dc2626';
  el.style.fontSize = '0.85rem';
  el.style.marginTop = '10px';
  el.style.textAlign = 'center';
}

function setFormBusy(formEl, busy) {
  const btn = formEl?.querySelector('.btn-login-submit');
  if (!btn) return;
  btn.disabled = busy;
  btn.style.opacity = busy ? '0.7' : '';
}

function getField(formEl, name) {
  return formEl?.querySelector(`[name="${name}"]`);
}

function buildEmailAuthUi() {
  const body = document.querySelector('#loginModal .modal-body');
  if (!body || body.querySelector('.auth-email-panel')) return;

  const style = document.createElement('style');
  style.textContent = `
    .auth-email-panel { margin-top: 8px; }
    .auth-tabs { display: flex; gap: 6px; background: #f3f4f6; padding: 4px; border-radius: 12px; margin: 8px 0 4px; }
    .auth-tab { flex: 1; border: 0; background: transparent; padding: 9px 6px; border-radius: 9px; cursor: pointer; font-weight: 600; font-size: 0.85rem; color: #6b7280; }
    .auth-tab.active { background: #fff; color: #3775B5; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .auth-form .btn-login-submit { margin-top: 18px; cursor: pointer; }
  `;
  body.appendChild(style);

  const panel = document.createElement('div');
  panel.className = 'auth-email-panel';
  panel.innerHTML = `
    <div class="divider">atau</div>
    <div class="auth-tabs" role="tablist">
      <button type="button" class="auth-tab active" data-auth-tab="login">Masuk</button>
      <button type="button" class="auth-tab" data-auth-tab="register">Daftar</button>
      <button type="button" class="auth-tab" data-auth-tab="forgot">Lupa Password</button>
    </div>
    <form class="auth-form" data-auth-form="login" novalidate>
      <label class="label" for="authLoginEmail">Email</label>
      <input class="input" id="authLoginEmail" name="email" type="email" autocomplete="email" required />
      <label class="label" for="authLoginPassword">Password</label>
      <input class="input" id="authLoginPassword" name="password" type="password" autocomplete="current-password" required />
      <button class="btn-login-submit" type="submit">Masuk</button>
      <p data-auth-message></p>
    </form>
    <form class="auth-form" data-auth-form="register" hidden novalidate>
      <label class="label" for="authRegisterName">Nama Lengkap</label>
      <input class="input" id="authRegisterName" name="fullname" type="text" autocomplete="name" required />
      <label class="label" for="authRegisterEmail">Email (gunakan Gmail)</label>
      <input class="input" id="authRegisterEmail" name="email" type="email" autocomplete="email" required />
      <label class="label" for="authRegisterPassword">Password (min. 6 karakter)</label>
      <input class="input" id="authRegisterPassword" name="password" type="password" autocomplete="new-password" required />
      <button class="btn-login-submit" type="submit">Daftar</button>
      <p data-auth-message></p>
    </form>
    <form class="auth-form" data-auth-form="forgot" hidden novalidate>
      <label class="label" for="authForgotEmail">Email</label>
      <input class="input" id="authForgotEmail" name="email" type="email" autocomplete="email" required />
      <button class="btn-login-submit" type="submit">Kirim Tautan Reset</button>
      <p data-auth-message></p>
    </form>
  `;
  body.appendChild(panel);

  panel.querySelectorAll('[data-auth-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      panel.querySelectorAll('[data-auth-tab]').forEach((t) => t.classList.toggle('active', t === tab));
      panel.querySelectorAll('[data-auth-form]').forEach((f) => { f.hidden = f.dataset.authForm !== tab.dataset.authTab; });
    });
  });

  panel.querySelector('[data-auth-form="login"]')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const email = getField(formEl, 'email').value.trim();
    const password = getField(formEl, 'password').value;
    if (!email || !password) { showAuthMessage(formEl, 'Email dan password wajib diisi.'); return; }
    setFormBusy(formEl, true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      showAuthMessage(formEl, translateAuthError(err));
    } finally {
      setFormBusy(formEl, false);
    }
  });

  panel.querySelector('[data-auth-form="register"]')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const name = getField(formEl, 'fullname').value.trim();
    const email = getField(formEl, 'email').value.trim();
    const password = getField(formEl, 'password').value;
    if (!email || !password) { showAuthMessage(formEl, 'Email dan password wajib diisi.'); return; }
    if (!/@gmail\.com$/i.test(email)) { showAuthMessage(formEl, 'Pendaftaran hanya untuk alamat Gmail.'); return; }
    if (password.length < 6) { showAuthMessage(formEl, 'Password minimal 6 karakter.'); return; }
    setFormBusy(formEl, true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) { try { await updateProfile(cred.user, { displayName: name }); } catch (err) { console.error(err); } }
      await renderAfterAuth(cred.user);
    } catch (err) {
      showAuthMessage(formEl, translateAuthError(err));
    } finally {
      setFormBusy(formEl, false);
    }
  });

  panel.querySelector('[data-auth-form="forgot"]')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const email = getField(formEl, 'email').value.trim();
    if (!email) { showAuthMessage(formEl, 'Email wajib diisi.'); return; }
    setFormBusy(formEl, true);
    try {
      await sendPasswordResetEmail(auth, email);
      showAuthMessage(formEl, 'Tautan reset password telah dikirim ke email Anda.', 'success');
      formEl.reset();
    } catch (err) {
      showAuthMessage(formEl, translateAuthError(err));
    } finally {
      setFormBusy(formEl, false);
    }
  });
}

buildEmailAuthUi();
window.addEventListener('DOMContentLoaded', buildEmailAuthUi);

// Init awal
renderLoginButton();
hideAuthGate();
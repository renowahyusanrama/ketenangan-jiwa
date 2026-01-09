// js/events_feed.js - render list event di halaman utama dari Firestore

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { EVENT_SEED_DATA } from "./events_seed_data.js";

const firebaseConfig = {
  apiKey: "AIzaSyCoa_Ioa-Gp9TnL5eke6fwTkfQGkbWGJBw",
  authDomain: "pengajian-online.firebaseapp.com",
  projectId: "pengajian-online",
  storageBucket: "pengajian-online.firebasestorage.app",
  messagingSenderId: "965180253441",
  appId: "1:965180253441:web:f03f6cb969e422fd7e2700",
  measurementId: "G-YJ81SDXM5E",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const cardsEl = document.getElementById("eventCards");
if (cardsEl) {
  loadEvents().catch((err) => {
    console.error(err);
    cardsEl.innerHTML = '<p class="muted">Gagal memuat event.</p>';
  });
}

function formatCurrency(amount) {
  const n = Number(amount) || 0;
  if (!n) return "Gratis";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
}

function isEventSoldOut(event) {
  if (!event) return false;
  if (event.soldOut === true || event.isSoldOut === true || event.ticketClosed === true) return true;
  const statusText = (event.ticketStatus || event.salesStatus || event.registrationStatus || "")
    .toString()
    .toLowerCase();
  if (["sold_out", "soldout", "closed"].includes(statusText)) return true;

  const capacity = Number(event.capacity || 0);
  const seatsUsed = Number(event.seatsUsed || 0);
  if (capacity > 0 && seatsUsed >= capacity) return true;

  const quotaRegular = Number(event.quotaRegular || 0);
  const quotaVip = Number(event.quotaVip || 0);
  const seatsUsedRegular = Number(event.seatsUsedRegular || 0);
  const seatsUsedVip = Number(event.seatsUsedVip || 0);
  const soldOutRegular = quotaRegular > 0 && seatsUsedRegular >= quotaRegular;
  const soldOutVip = quotaVip > 0 && seatsUsedVip >= quotaVip;
  const priceVip = event.priceVip != null ? Number(event.priceVip) : 0;
  const hasVip = priceVip > 0 || quotaVip > 0;
  return hasVip ? soldOutRegular && soldOutVip : soldOutRegular;
}

async function loadEvents() {
  cardsEl.innerHTML = '<p class="muted">Memuat event...</p>';
  const ref = collection(db, "events");
  let snap;
  try {
    const q = query(ref, where("status", "==", "published"), orderBy("updatedAt", "desc"), limit(1));
    snap = await getDocs(q);
  } catch (err) {
    console.warn("Fallback load events (tanpa orderBy):", err?.message);
    const q = query(ref, where("status", "==", "published"), limit(1));
    snap = await getDocs(q);
  }

  if (snap.empty) {
    console.warn("Firestore kosong, pakai fallback seed.");
    renderList(EVENT_SEED_DATA.slice(0, 1));
    return;
  }

  const list = [];
  snap.forEach((d) => {
    list.push({ id: d.id, ...d.data() });
  });
  renderList(list);
}

function renderList(data) {
  const list = Array.isArray(data) ? data.slice(0, 1) : [];
  if (!list.length) {
    cardsEl.innerHTML = '<p class="muted">Belum ada event yang dipublikasikan.</p>';
    if (typeof window.refreshEventSlider === "function") {
      window.refreshEventSlider();
    }
    return;
  }
  cardsEl.innerHTML = list
    .map((e) => {
      const slug = e.slug || e.id;
      const soldOut = isEventSoldOut(e);
      return `
        <article class="card">
          <div class="card-media${soldOut ? " has-sold-out" : ""}">
            <img src="${e.imageUrl || "./images/placeholder.jpg"}" alt="${e.title || ""}" />
            ${soldOut ? '<span class="sold-out-badge">SOLD OUT</span>' : ""}
            ${e.category ? `<span class="chip chip-green">${e.category}</span>` : ""}
          </div>
          <div class="card-body">
            <h3>${e.title || "-"}</h3>
            <p>${e.tagline || e.description || ""}</p>
            <ul class="meta">
              <li><i class="fa-regular fa-calendar-days"></i> ${e.schedule || ""} ${e.time || ""}</li>
              <li><i class="fa-solid fa-location-dot"></i> ${e.location || ""}</li>
              ${e.speaker ? `<li><i class="fa-regular fa-user"></i> ${e.speaker}</li>` : ""}
            </ul>
            <div class="card-footer">
              <a href="event-detail.html?event=${slug}" class="btn btn-primary">Daftar</a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
  if (typeof window.refreshEventSlider === "function") {
    window.refreshEventSlider();
  }
}

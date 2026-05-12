import {
  collection,
  doc as firestoreDoc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function snapshotToOrders(snapshot) {
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export class OrderService {
  constructor(db, { pageSize = 25 } = {}) {
    if (!db) {
      throw new Error("Firestore db wajib diberikan ke OrderService.");
    }

    this.db = db;
    this.pageSize = pageSize;
    this.lastOrderDoc = null;
    this.ordersRealtimeUnsub = null;
    this.ordersCache = [];
    this.ordersLoading = false;
  }

  async loadOrders(isRealtime = true, options = {}) {
    const {
      pageSize = this.pageSize,
      reset = true,
      forceRestart = false,
      fallbackToAll = true,
      onChange,
      onError,
    } = options;

    const ordersRef = collection(this.db, "orders");

    if (isRealtime) {
      if (this.ordersRealtimeUnsub && !forceRestart) {
        return {
          orders: this.ordersCache,
          pageCount: this.ordersCache.length,
          isRealtime: true,
          unsubscribe: this.ordersRealtimeUnsub,
        };
      }

      await this.resetOrdersRealtime();
      const ordersQuery = query(ordersRef, orderBy("createdAt", "desc"));
      this.ordersLoading = true;

      return new Promise((resolve, reject) => {
        let settled = false;

        this.ordersRealtimeUnsub = onSnapshot(
          ordersQuery,
          (snapshot) => {
            const orders = snapshotToOrders(snapshot);
            this.ordersCache = orders;
            this.ordersLoading = false;

            const result = {
              orders,
              pageCount: snapshot.docs.length,
              isRealtime: true,
              unsubscribe: this.ordersRealtimeUnsub,
            };

            if (typeof onChange === "function") {
              onChange(result);
            }

            if (!settled) {
              settled = true;
              resolve(result);
            }
          },
          (error) => {
            this.ordersLoading = false;

            if (typeof onError === "function") {
              onError(error);
            }

            if (!settled) {
              settled = true;
              reject(error);
            }
          },
        );
      });
    }

    if (this.ordersLoading) {
      return {
        orders: this.ordersCache,
        pageCount: this.ordersCache.length,
        isRealtime: false,
        isLoading: true,
        lastOrderDoc: this.lastOrderDoc,
      };
    }

    this.ordersLoading = true;

    if (reset) {
      this.lastOrderDoc = null;
      this.ordersCache = [];
    }

    let ordersQuery = query(ordersRef, orderBy("createdAt", "desc"), limit(pageSize));
    if (this.lastOrderDoc) {
      ordersQuery = query(ordersRef, orderBy("createdAt", "desc"), startAfter(this.lastOrderDoc), limit(pageSize));
    }

    try {
      let snapshot;
      try {
        snapshot = await getDocs(ordersQuery);
      } catch (error) {
        if (!fallbackToAll) {
          throw error;
        }
        snapshot = await getDocs(ordersRef);
      }

      const orders = snapshotToOrders(snapshot);
      if (snapshot.docs.length) {
        this.lastOrderDoc = snapshot.docs[snapshot.docs.length - 1];
      }

      this.ordersCache = reset ? orders : [...this.ordersCache, ...orders];

      return {
        orders,
        allOrders: this.ordersCache,
        pageCount: snapshot.docs.length,
        hasMore: snapshot.docs.length >= pageSize,
        isRealtime: false,
        lastOrderDoc: this.lastOrderDoc,
      };
    } finally {
      this.ordersLoading = false;
    }
  }

  async resetOrdersRealtime() {
    if (this.ordersRealtimeUnsub) {
      this.ordersRealtimeUnsub();
    }

    this.ordersRealtimeUnsub = null;
    this.ordersCache = [];
    this.ordersLoading = false;
    this.lastOrderDoc = null;

    return {
      orders: [],
      isRealtime: false,
      unsubscribe: null,
    };
  }

  async loadAllOrders() {
    const snapshot = await getDocs(collection(this.db, "orders"));
    return snapshotToOrders(snapshot);
  }

  async getOrder(orderId) {
    if (!orderId) return null;

    const ref = firestoreDoc(this.db, "orders", orderId);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) return null;
    return {
      id: snapshot.id,
      ...snapshot.data(),
    };
  }

  async findOrderIdByRef(refValue) {
    const code = (refValue || "").trim();
    if (!code) return null;

    try {
      const directRef = firestoreDoc(this.db, "orders", code);
      const directSnapshot = await getDoc(directRef);
      if (directSnapshot.exists()) return directRef.id;
    } catch {
      // Kode QR bisa berisi karakter yang tidak valid sebagai document id.
    }

    const ordersRef = collection(this.db, "orders");
    const byReference = query(ordersRef, where("reference", "==", code), limit(1));
    let snapshot = await getDocs(byReference);
    if (snapshot.docs.length) return snapshot.docs[0].id;

    const byMerchantRef = query(ordersRef, where("merchantRef", "==", code), limit(1));
    snapshot = await getDocs(byMerchantRef);
    if (snapshot.docs.length) return snapshot.docs[0].id;

    return null;
  }

  async updateCheckin(orderId, verified) {
    if (!orderId) return null;

    const ref = firestoreDoc(this.db, "orders", orderId);
    const payload = {
      verified: !!verified,
      checkedInAt: verified ? serverTimestamp() : null,
      verifiedAt: verified ? serverTimestamp() : null,
    };

    await setDoc(ref, payload, { merge: true });
    return {
      id: orderId,
      ...payload,
    };
  }
}

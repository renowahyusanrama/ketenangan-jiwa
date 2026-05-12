import {
  collection,
  deleteDoc,
  doc as firestoreDoc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function snapshotToReferrals(snapshot) {
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export class ReferralService {
  constructor(db) {
    if (!db) {
      throw new Error("Firestore db wajib diberikan ke ReferralService.");
    }

    this.db = db;
  }

  async loadReferrals() {
    const referralsRef = collection(this.db, "referrals");
    const referralsQuery = query(referralsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(referralsQuery);

    return snapshotToReferrals(snapshot);
  }

  async saveReferral(data) {
    const code = (data?.code || data?.id || "").trim();
    if (!code) {
      throw new Error("Kode referral wajib diisi.");
    }

    const ref = firestoreDoc(this.db, "referrals", code);
    const snapshot = await getDoc(ref);
    const existing = snapshot.exists() ? snapshot.data() : null;

    const payload = {
      ...data,
      code,
      eventId: data?.eventId || null,
      updatedAt: serverTimestamp(),
    };

    if (!existing?.createdAt && !payload.createdAt) {
      payload.createdAt = serverTimestamp();
    }

    if (payload.usedCount === undefined) {
      payload.usedCount = existing?.usedCount || 0;
    }

    await setDoc(ref, payload, { merge: true });

    return {
      id: code,
      existsBefore: !!existing,
      ...payload,
    };
  }

  async deleteReferral(code) {
    if (!code) return null;

    await deleteDoc(firestoreDoc(this.db, "referrals", code));
    return {
      id: code,
      deleted: true,
    };
  }
}

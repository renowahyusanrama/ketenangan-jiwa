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

function snapshotToEvents(snapshot) {
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export class EventService {
  constructor(db) {
    if (!db) {
      throw new Error("Firestore db wajib diberikan ke EventService.");
    }

    this.db = db;
  }

  async loadEvents() {
    const eventsRef = collection(this.db, "events");
    const eventsQuery = query(eventsRef, orderBy("updatedAt", "desc"));

    try {
      const snapshot = await getDocs(eventsQuery);
      return snapshotToEvents(snapshot);
    } catch (error) {
      const snapshot = await getDocs(eventsRef);
      return snapshotToEvents(snapshot);
    }
  }

  async getEvent(slug) {
    if (!slug) return null;

    const snapshot = await getDoc(firestoreDoc(this.db, "events", slug));
    if (!snapshot.exists()) return null;

    return {
      id: snapshot.id,
      ...snapshot.data(),
    };
  }

  async eventExists(slug) {
    const event = await this.getEvent(slug);
    return !!event;
  }

  async saveEvent(data, options = {}) {
    const { checkExists = false, merge = true, isNew = false } = options;
    const slug = (data?.slug || data?.id || "").trim();

    if (!slug) {
      throw new Error("Slug event wajib diisi.");
    }

    const ref = firestoreDoc(this.db, "events", slug);
    let existsBefore = false;

    if (checkExists) {
      const snapshot = await getDoc(ref);
      existsBefore = snapshot.exists();
    }

    const payload = {
      ...data,
      slug,
      updatedAt: data?.updatedAt || serverTimestamp(),
    };

    if (isNew && !payload.createdAt) {
      payload.createdAt = serverTimestamp();
    }

    await setDoc(ref, payload, { merge });

    return {
      id: slug,
      existsBefore,
      ...payload,
    };
  }

  async deleteEvent(slug) {
    if (!slug) return null;

    await deleteDoc(firestoreDoc(this.db, "events", slug));
    return {
      id: slug,
      deleted: true,
    };
  }

  async updateTicketStatus(eventId, ticketStatus, updatedBy = null) {
    if (!eventId) return null;

    const payload = {
      ticketStatus,
      soldOut: ticketStatus === "sold_out",
      updatedAt: serverTimestamp(),
    };

    if (updatedBy) {
      payload.updatedBy = updatedBy;
    }

    await setDoc(firestoreDoc(this.db, "events", eventId), payload, { merge: true });

    return {
      id: eventId,
      ...payload,
    };
  }
}

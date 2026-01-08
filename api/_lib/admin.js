const fs = require("fs");
const admin = require("firebase-admin");

function loadServiceAccount(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }
  if (trimmed.startsWith("base64:")) {
    const decoded = Buffer.from(trimmed.slice(7), "base64").toString("utf8");
    return JSON.parse(decoded);
  }
  if (fs.existsSync(trimmed)) {
    const fileRaw = fs.readFileSync(trimmed, "utf8");
    return JSON.parse(fileRaw);
  }
  return null;
}

function getApp() {
  if (admin.apps.length) return admin.app();
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.SERVICE_ACCOUNT ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    "";
  const serviceAccount = loadServiceAccount(raw);
  if (!serviceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT env is missing or invalid");
  }
  const credential = admin.credential.cert(serviceAccount);
  return admin.initializeApp({ credential });
}

function getDb() {
  return getApp().firestore();
}

module.exports = { admin, getDb };

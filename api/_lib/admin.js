const fs = require("fs");
const admin = require("firebase-admin");

function loadServiceAccount(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed;
  if (unquoted.startsWith("{")) {
    try {
      return JSON.parse(unquoted);
    } catch (err) {
      return null;
    }
  }
  if (unquoted.startsWith("base64:")) {
    const decoded = Buffer.from(unquoted.slice(7), "base64").toString("utf8");
    try {
      return JSON.parse(decoded);
    } catch (err) {
      return null;
    }
  }
  const looksBase64 = /^[A-Za-z0-9+/=]+$/.test(unquoted) && unquoted.length > 100;
  if (looksBase64) {
    try {
      const decoded = Buffer.from(unquoted, "base64").toString("utf8");
      const parsed = JSON.parse(decoded);
      if (parsed && parsed.client_email) return parsed;
    } catch (err) {
      // ignore
    }
  }
  if (fs.existsSync(unquoted)) {
    try {
      const fileRaw = fs.readFileSync(unquoted, "utf8");
      return JSON.parse(fileRaw);
    } catch (err) {
      return null;
    }
  }
  return null;
}

function buildServiceAccountFromPieces() {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    "";
  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL ||
    process.env.GOOGLE_CLIENT_EMAIL ||
    "";
  const privateKey =
    process.env.FIREBASE_PRIVATE_KEY ||
    process.env.GOOGLE_PRIVATE_KEY ||
    "";
  if (!projectId || !clientEmail || !privateKey) return null;
  return {
    type: "service_account",
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey.replace(/\\n/g, "\n"),
  };
}

function getApp() {
  if (admin.apps.length) return admin.app();
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.SERVICE_ACCOUNT ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    "";
  const serviceAccount = loadServiceAccount(raw) || buildServiceAccountFromPieces();
  let credential;
  if (serviceAccount) {
    credential = admin.credential.cert(serviceAccount);
  } else {
    throw new Error("FIREBASE_SERVICE_ACCOUNT env is missing or invalid");
  }
  return admin.initializeApp({ credential });
}

function getDb() {
  return getApp().firestore();
}

module.exports = { admin, getDb };

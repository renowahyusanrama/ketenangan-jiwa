const axios = require("axios");
const crypto = require("crypto");

const TRIPAY_API_KEY = process.env.TRIPAY_API_KEY || "";
const TRIPAY_PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY || "";
const TRIPAY_MERCHANT_CODE = process.env.TRIPAY_MERCHANT_CODE || "";
const TRIPAY_MODE = process.env.TRIPAY_MODE || "sandbox";

const TRIPAY_GATEWAY_CREATE_URL =
  process.env.TRIPAY_GATEWAY_CREATE_URL ||
  process.env.TRIPAY_GATEWAY_URL ||
  "";

const TRIPAY_GATEWAY_CANCEL_URL =
  process.env.TRIPAY_GATEWAY_CANCEL_URL || "";

const TRIPAY_BASE_URL =
  TRIPAY_MODE === "production"
    ? "https://tripay.co.id/api"
    : "https://tripay.co.id/api-sandbox";

// ================= SIGNATURE =================
function createTripaySignature(merchantRef, amount) {
  if (!TRIPAY_PRIVATE_KEY || !TRIPAY_MERCHANT_CODE) {
    throw new Error("Tripay signature config kosong");
  }

  return crypto
    .createHmac("sha256", TRIPAY_PRIVATE_KEY)
    .update(`${TRIPAY_MERCHANT_CODE}${merchantRef}${Math.floor(amount)}`)
    .digest("hex");
}

// ================= METHOD =================
function resolveTripayMethod(paymentType, bank) {
  if (paymentType === "qris") return "QRIS";

  const map = {
    bca: "BCAVA",
    bni: "BNIVA",
    bri: "BRIVA",
    mandiri: "MANDIRIVA",
    bsi: "BSIVA",
    permata: "PERMATAVA",
  };

  return map[(bank || "bca").toLowerCase()] || "BCAVA";
}

// ================= CREATE TRANSACTION =================
async function createTripayTransaction(payload) {
  if (!TRIPAY_API_KEY) {
    throw new Error("TRIPAY_API_KEY kosong");
  }

  const directUrl = `${TRIPAY_BASE_URL}/transaction/create`;
  const gatewayUrl = TRIPAY_GATEWAY_CREATE_URL;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${TRIPAY_API_KEY}`,
  };

  console.log("=== TRIPAY DEBUG ===");
  console.log("MODE:", TRIPAY_MODE);
  console.log("DIRECT URL:", directUrl);
  console.log("USE GATEWAY:", !!gatewayUrl);

  // 🔥 PRIORITAS: COBA GATEWAY DULU (kalau ada)
  if (gatewayUrl) {
    try {
      const { data } = await axios.post(gatewayUrl, payload, {
        headers,
        timeout: 10000,
      });

      console.log("Gateway success");
      return data;
    } catch (err) {
      console.warn("Gateway gagal, fallback ke Tripay langsung...");
    }
  }

  // 🔥 FALLBACK KE TRIPAY LANGSUNG
  try {
    const { data } = await axios.post(directUrl, payload, {
      headers,
      timeout: 15000,
    });

    console.log("Direct Tripay success");
    return data;
  } catch (error) {
    console.error("Tripay ERROR:", error.response?.data || error.message);
    throw error;
  }
}

// ================= CANCEL =================
async function cancelTripayTransaction({ reference, merchantRef }) {
  if (!TRIPAY_API_KEY) {
    throw new Error("TRIPAY_API_KEY kosong");
  }

  const ref = reference || merchantRef;
  if (!ref) throw new Error("reference wajib");

  const directUrl = `${TRIPAY_BASE_URL}/transaction/cancel`;
  const gatewayUrl = TRIPAY_GATEWAY_CANCEL_URL;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${TRIPAY_API_KEY}`,
  };

  if (gatewayUrl) {
    try {
      const { data } = await axios.post(gatewayUrl, { reference: ref }, {
        headers,
        timeout: 10000,
      });

      return data;
    } catch (err) {
      console.warn("Gateway cancel gagal, fallback...");
    }
  }

  const { data } = await axios.post(directUrl, { reference: ref }, {
    headers,
    timeout: 15000,
  });

  return data;
}

// ================= NORMALIZE =================
function normalizeTripayResponse(trx, meta) {
  const payCode =
    trx?.pay_code || trx?.va_number || trx?.payment_code || null;

  return {
    provider: "tripay",
    orderId: meta.merchantRef,
    reference: trx?.reference || trx?.reference_id,
    eventId: meta.eventId,
    eventTitle: meta.eventTitle,
    amount: meta.totalAmount,
    baseAmount: meta.baseAmount,
    platformTax: meta.platformTax,
    tripayFee: meta.tripayFee,
    totalAmount: meta.totalAmount,
    amountForTripay: meta.amountForTripay,
    ticketType: meta.ticketType || "regular",
    paymentType: meta.paymentType,
    bank: meta.bank || null,
    method: meta.method,
    paymentName: trx?.payment_name || trx?.payment_method,
    vaNumber: meta.paymentType === "bank_transfer" ? payCode : null,
    payCode,
    checkoutUrl: trx?.checkout_url || trx?.pay_url,
    qrUrl: trx?.qr_url || "",
    qrString: trx?.qr_string || "",
    instructions: trx?.instructions || [],
    expiresAt: trx?.expired_time
      ? new Date(Number(trx.expired_time) * 1000).toISOString()
      : null,
    status: trx?.status || "UNPAID",
  };
}

// ================= STATUS =================
function mapStatus(status = "") {
  const map = {
    PAID: "paid",
    PENDING: "pending",
    UNPAID: "pending",
    EXPIRED: "expired",
    FAILED: "failed",
    REFUND: "refunded",
    CANCEL: "canceled",
    CANCELED: "canceled",
  };

  return map[(status || "").toUpperCase()] || "pending";
}

// ================= EXPORT =================
module.exports = {
  TRIPAY_API_KEY,
  TRIPAY_PRIVATE_KEY,
  TRIPAY_MERCHANT_CODE,
  TRIPAY_MODE,
  TRIPAY_BASE_URL,
  createTripaySignature,
  resolveTripayMethod,
  createTripayTransaction,
  cancelTripayTransaction,
  normalizeTripayResponse,
  mapStatus,
};

const axios = require("axios");
const crypto = require("crypto");

const TRIPAY_API_KEY = process.env.TRIPAY_API_KEY || "";
const TRIPAY_PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY || "";
const TRIPAY_MERCHANT_CODE = process.env.TRIPAY_MERCHANT_CODE || "";
const TRIPAY_MODE = process.env.TRIPAY_MODE || "sandbox";
const TRIPAY_CALLBACK_URL = process.env.TRIPAY_CALLBACK_URL || "";
const TRIPAY_RETURN_URL = process.env.TRIPAY_RETURN_URL || "";

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

function createTripaySignature(merchantRef, amount) {
  if (!TRIPAY_PRIVATE_KEY || !TRIPAY_MERCHANT_CODE) {
    throw new Error("Tripay signature config kosong");
  }

  return crypto
    .createHmac("sha256", TRIPAY_PRIVATE_KEY)
    .update(`${TRIPAY_MERCHANT_CODE}${merchantRef}${parseInt(amount)}`)
    .digest("hex");
}

function resolveTripayMethod(paymentType, bank) {
  if (paymentType === "qris") return "QRIS";

  const normalized = (bank || "bca").toLowerCase();
  const map = {
    bca: "BCAVA",
    bni: "BNIVA",
    bri: "BRIVA",
    mandiri: "MANDIRIVA",
    bsi: "BSIVA",
    permata: "PERMATAVA",
  };

  return map[normalized] || "BCAVA";
}

async function createTripayTransaction(payload) {
  // 🔥 VALIDASI KERAS
  if (!TRIPAY_API_KEY) {
    throw new Error("TRIPAY_API_KEY kosong");
  }

  const url =
    TRIPAY_GATEWAY_CREATE_URL ||
    `${TRIPAY_BASE_URL}/transaction/create`;

  // 🔥 FIX UTAMA: SELALU KIRIM AUTH
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${TRIPAY_API_KEY}`,
  };

  try {
    console.log("=== TRIPAY DEBUG ===");
    console.log("URL:", url);
    console.log("MODE:", TRIPAY_MODE);
    console.log("USE GATEWAY:", !!TRIPAY_GATEWAY_CREATE_URL);
    console.log("API KEY:", TRIPAY_API_KEY ? "ADA" : "KOSONG");

    const { data } = await axios.post(url, payload, {
      headers,
      timeout: 15000,
    });

    console.log("Tripay success:", data);
    return data;
  } catch (error) {
    console.error("Tripay ERROR FULL:", {
      message: error.message,
      data: error.response?.data,
    });

    throw error;
  }
}

async function cancelTripayTransaction({ reference, merchantRef }) {
  if (!TRIPAY_API_KEY) {
    throw new Error("TRIPAY_API_KEY kosong");
  }

  const ref = reference || merchantRef;
  if (!ref) throw new Error("reference wajib");

  const payload = { reference: ref };

  const url =
    TRIPAY_GATEWAY_CANCEL_URL ||
    `${TRIPAY_BASE_URL}/transaction/cancel`;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${TRIPAY_API_KEY}`,
  };

  const { data } = await axios.post(url, payload, {
    headers,
    timeout: 15000,
  });

  return data;
}

function normalizeTripayResponse(trx, meta) {
  const payCode = trx?.pay_code || trx?.va_number || trx?.payment_code || null;

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

function mapStatus(status = "") {
  const normalized = status.toUpperCase();

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

  return map[normalized] || "pending";
}

module.exports = {
  TRIPAY_API_KEY,
  TRIPAY_PRIVATE_KEY,
  TRIPAY_MERCHANT_CODE,
  TRIPAY_MODE,
  TRIPAY_BASE_URL,
  TRIPAY_CALLBACK_URL,
  TRIPAY_RETURN_URL,
  createTripaySignature,
  resolveTripayMethod,
  createTripayTransaction,
  cancelTripayTransaction,
  normalizeTripayResponse,
  mapStatus,
};

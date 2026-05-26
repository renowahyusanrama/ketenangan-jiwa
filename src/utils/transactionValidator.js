const VALID_PAYMENT_STATUSES = ["pending", "success", "failed"];

function validateTransaction(transaction = {}) {
  const errors = [];
  const userName = (transaction.userName || "").trim();
  const eventId = (transaction.eventId || "").trim();
  const amount = Number(transaction.amount);
  const paymentStatus = (transaction.paymentStatus || "").trim().toLowerCase();

  if (!userName) errors.push("Nama user wajib diisi");
  if (!eventId) errors.push("ID event wajib diisi");
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push("Nominal pembayaran harus lebih dari 0");
  }
  if (!paymentStatus) {
    errors.push("Status pembayaran wajib diisi");
  } else if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
    errors.push("Status pembayaran tidak valid");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  VALID_PAYMENT_STATUSES,
  validateTransaction,
};

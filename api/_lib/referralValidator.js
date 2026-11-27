/**
 * Referral Validator
 * Helper untuk validasi kode referral dan diskon
 * Dibuat untuk Design for Testability assignment
 */

/**
 * Validasi kode referral
 * @param {string} code - Kode referral yang akan divalidasi
 * @returns {object} { valid: boolean, error?: string }
 */
function validateReferralCode(code) {
  // Cek kosong
  if (!code || typeof code !== "string") {
    return {
      valid: false,
      error: "Kode referral harus berupa string non-kosong",
    };
  }

  // Normalize dan cek lagi
  const normalized = code.trim();
  if (!normalized) {
    return {
      valid: false,
      error: "Kode referral tidak boleh kosong",
    };
  }

  // Cek panjang minimum (minimal 3 karakter)
  if (normalized.length < 3) {
    return {
      valid: false,
      error: "Kode referral terlalu pendek (minimal 3 karakter)",
    };
  }

  // Cek spasi
  if (normalized.includes(" ")) {
    return {
      valid: false,
      error: "Kode referral tidak boleh mengandung spasi",
    };
  }

  // Jika semua lolos
  return {
    valid: true,
  };
}

/**
 * Validasi diskon referral
 * @param {number} discount - Nilai diskon yang akan divalidasi
 * @returns {object} { valid: boolean, error?: string }
 */
function validateReferralDiscount(discount) {
  // Cek tipe data
  if (typeof discount !== "number") {
    return {
      valid: false,
      error: "Diskon harus berupa angka",
    };
  }

  // Cek NaN
  if (Number.isNaN(discount)) {
    return {
      valid: false,
      error: "Diskon harus berupa angka valid",
    };
  }

  // Cek diskon negatif
  if (discount < 0) {
    return {
      valid: false,
      error: "Diskon tidak boleh negatif",
    };
  }

  // Cek diskon lebih dari 100%
  if (discount > 100) {
    return {
      valid: false,
      error: "Diskon tidak boleh lebih dari 100%",
    };
  }

  // Jika semua lolos
  return {
    valid: true,
  };
}

/**
 * Validasi kombinasi kode dan diskon referral
 * @param {string} code - Kode referral
 * @param {number} discount - Diskon dalam persentase
 * @returns {object} { valid: boolean, error?: string, details?: object }
 */
function validateReferral(code, discount) {
  const codeValidation = validateReferralCode(code);
  if (!codeValidation.valid) {
    return {
      valid: false,
      error: codeValidation.error,
    };
  }

  const discountValidation = validateReferralDiscount(discount);
  if (!discountValidation.valid) {
    return {
      valid: false,
      error: discountValidation.error,
    };
  }

  return {
    valid: true,
    details: {
      code: code.trim().toUpperCase(),
      discount,
    },
  };
}

module.exports = {
  validateReferralCode,
  validateReferralDiscount,
  validateReferral,
};

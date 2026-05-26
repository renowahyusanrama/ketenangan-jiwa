// Helper functions untuk referral validation
// Buat test assignment Design for Testability

const checkReferralCode = (code) => {
  // validasi kode referral
  
  if (!code) return { ok: false, msg: "kode tidak boleh kosong" };
  
  if (typeof code !== 'string') {
    return { ok: false, msg: "kode harus string" };
  }
  
  let kode = code.trim();
  
  if (!kode) return { ok: false, msg: "kode tidak boleh kosong" };
  
  // panjang minimal 3
  if (kode.length < 3) {
    return { ok: false, msg: "kode terlalu pendek" };
  }
  
  // no spaces
  if (kode.includes(' ')) {
    return { ok: false, msg: "kode tidak boleh ada spasi" };
  }
  
  return { ok: true };
};

const checkDiscount = (disc) => {
  // validasi diskon
  
  if (typeof disc !== 'number') {
    return { ok: false, msg: "diskon harus angka" };
  }
  
  if (isNaN(disc)) {
    return { ok: false, msg: "diskon tidak valid" };
  }
  
  if (disc < 0) {
    return { ok: false, msg: "diskon tidak boleh minus" };
  }
  
  if (disc > 100) {
    return { ok: false, msg: "diskon maksimal 100%" };
  }
  
  return { ok: true };
};

const validateReferral = (code, discount) => {
  const cekKode = checkReferralCode(code);
  if (!cekKode.ok) {
    return { valid: false, error: cekKode.msg };
  }
  
  const cekDiskon = checkDiscount(discount);
  if (!cekDiskon.ok) {
    return { valid: false, error: cekDiskon.msg };
  }
  
  return { 
    valid: true, 
    data: { code: code.trim(), discount }
  };
};

module.exports = {
  checkReferralCode,
  checkDiscount,
  validateReferral
};

// Fungsi helper buat validasi referral
// Assignment Design for Testability

const cekKodeReferral = (kode) => {
  // cek apakah kode referral valid
  
  if (!kode) return { ok: false, msg: "kode referral tidak boleh kosong" };
  
  if (typeof kode !== 'string') {
    return { ok: false, msg: "kode harus berupa teks" };
  }
  
  let kodeTrim = kode.trim();
  
  if (!kodeTrim) return { ok: false, msg: "kode referral tidak boleh kosong" };
  
  // minimal 3 karakter
  if (kodeTrim.length < 3) {
    return { ok: false, msg: "kode referral terlalu pendek (minimal 3 karakter)" };
  }
  
  // tidak boleh ada spasi
  if (kodeTrim.includes(' ')) {
    return { ok: false, msg: "kode referral tidak boleh ada spasi" };
  }
  
  return { ok: true };
};

const cekDiskon = (diskon) => {
  // cek apakah nilai diskon valid
  
  if (typeof diskon !== 'number') {
    return { ok: false, msg: "diskon harus berupa angka" };
  }
  
  if (isNaN(diskon)) {
    return { ok: false, msg: "diskon tidak valid" };
  }
  
  if (diskon < 0) {
    return { ok: false, msg: "diskon tidak boleh minus" };
  }
  
  if (diskon > 100) {
    return { ok: false, msg: "diskon tidak boleh lebih dari 100%" };
  }
  
  return { ok: true };
};

const validasiReferral = (kode, diskon) => {
  // validasi kode dan diskon referral secara lengkap
  const cekKode = cekKodeReferral(kode);
  if (!cekKode.ok) {
    return { valid: false, error: cekKode.msg };
  }
  
  const cekDiscValid = cekDiskon(diskon);
  if (!cekDiscValid.ok) {
    return { valid: false, error: cekDiscValid.msg };
  }
  
  return { 
    valid: true, 
    data: { 
      kode: kode.trim(), 
      diskon 
    }
  };
};

module.exports = {
  cekKodeReferral,
  cekDiskon,
  validasiReferral
};

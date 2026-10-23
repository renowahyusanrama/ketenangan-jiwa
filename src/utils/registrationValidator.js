const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function validateRegistration(input = {}) {
  const errors = [];
  const name = (input.name || "").trim();
  const email = (input.email || "").trim();
  const password = input.password || "";

  if (!name) {
    errors.push("Nama wajib diisi");
  }

  if (!email) {
    errors.push("Email wajib diisi");
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push("Format email tidak valid");
  } else if (!GMAIL_REGEX.test(email)) {
    errors.push("Pendaftaran hanya untuk alamat Gmail");
  }

  if (!password) {
    errors.push("Password wajib diisi");
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push("Password minimal 6 karakter");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  GMAIL_REGEX,
  EMAIL_REGEX,
  MIN_PASSWORD_LENGTH,
  validateRegistration,
};
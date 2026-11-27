const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function validateLogin(input = {}) {
  const errors = [];
  const email = (input.email || "").trim();
  const password = input.password || "";

  if (!email) {
    errors.push("Email wajib diisi");
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push("Format email tidak valid");
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
  EMAIL_REGEX,
  MIN_PASSWORD_LENGTH,
  validateLogin,
};

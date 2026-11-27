const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateResetEmail(email) {
  const value = (email || "").trim();
  const errors = [];

  if (!value) {
    errors.push("Email wajib diisi");
  } else if (!EMAIL_REGEX.test(value)) {
    errors.push("Format email tidak valid");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  EMAIL_REGEX,
  validateResetEmail,
};

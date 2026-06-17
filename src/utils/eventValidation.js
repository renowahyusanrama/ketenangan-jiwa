function validateEvent(event = {}) {
  if (!event.title || !event.title.trim()) return false;
  if (!event.date || !event.date.trim()) return false;
  if (event.price < 0) return false;
  if (event.quota <= 0) return false;

  return true;
}

module.exports = {
  validateEvent,
};

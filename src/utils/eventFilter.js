function normalize(value) {
  return (value || "").toString().trim().toLowerCase();
}

function matchesQuery(event = {}, term = "") {
  const query = normalize(term);
  if (!query) return true;

  const haystack = [
    event.title,
    event.tagline,
    event.description,
    event.speaker,
    event.category,
    event.location,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function matchesCategory(event = {}, category = "") {
  const selected = normalize(category);
  if (!selected) return true;

  return normalize(event.category) === selected;
}

function isEventSoldOut(event = {}) {
  if (!event) return false;
  if (event.soldOut === true || event.isSoldOut === true || event.ticketClosed === true) return true;

  const statusText = normalize(
    event.ticketStatus || event.salesStatus || event.registrationStatus || ""
  );
  if (["sold_out", "soldout", "closed"].includes(statusText)) return true;

  const capacity = Number(event.capacity || 0);
  const seatsUsed = Number(event.seatsUsed || 0);
  if (capacity > 0 && seatsUsed >= capacity) return true;

  const quotaRegular = Number(event.quotaRegular || 0);
  const quotaVip = Number(event.quotaVip || 0);
  const seatsUsedRegular = Number(event.seatsUsedRegular || 0);
  const seatsUsedVip = Number(event.seatsUsedVip || 0);
  const soldOutRegular = quotaRegular > 0 && seatsUsedRegular >= quotaRegular;
  const soldOutVip = quotaVip > 0 && seatsUsedVip >= quotaVip;
  const priceVip = event.priceVip != null ? Number(event.priceVip) : 0;
  const hasVip = priceVip > 0 || quotaVip > 0;

  return hasVip ? soldOutRegular && soldOutVip : soldOutRegular;
}

module.exports = {
  matchesQuery,
  matchesCategory,
  isEventSoldOut,
};

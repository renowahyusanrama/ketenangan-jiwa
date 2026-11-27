function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function createQrUrl(qrString) {
  if (!qrString) return "";
  return `https://chart.googleapis.com/chart?chs=320x320&cht=qr&chl=${encodeURIComponent(qrString)}`;
}

function buildInstructionsHtml(instructions) {
  if (!instructions || !instructions.length) return "";

  const content = instructions
    .map((item) => {
      const steps = (item.steps || []).map((step) => `<li>${step}</li>`).join("");
      return `
        <details class="payment-instruction" open>
          <summary>${item.title || "Panduan pembayaran"}</summary>
          ${steps ? `<ol>${steps}</ol>` : ""}
        </details>
      `;
    })
    .join("");

  return `<div class="payment-instructions">${content}</div>`;
}

module.exports = {
  formatCurrency,
  createQrUrl,
  buildInstructionsHtml,
};

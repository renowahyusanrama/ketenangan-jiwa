export class DashboardView {
  constructor(root = document) {
    this.root = root;
    const getById = (id) => this.root.getElementById?.(id) || this.root.querySelector?.(`#${id}`) || null;

    this.loginBtn = getById("loginBtn");
    this.logoutBtn = getById("logoutBtn");
    this.userInfo = getById("userInfo");
    this.guardPanel = getById("guardPanel");
    this.guardMessage = getById("guardMessage");
    this.dashboard = getById("dashboard");
    this.adminStatus = getById("adminStatus");
    this.eventForm = getById("eventForm");
    this.formStatus = getById("formStatus");
    this.posterPreview = getById("posterPreview");
    this.previewImage = getById("previewImage");
    this.previewCategory = getById("previewCategory");
    this.previewTitle = getById("previewTitle");
    this.previewTagline = getById("previewTagline");
    this.previewSchedule = getById("previewSchedule");
    this.previewLocation = getById("previewLocation");
    this.previewSpeaker = getById("previewSpeaker");
    this.previewPrice = getById("previewPrice");
    this.ticketStatusInput = this.eventForm?.querySelector('[name="ticketStatus"]');
    this.ticketStatusButtons = [...(this.root.querySelectorAll?.("[data-ticket-status]") || [])];
  }

  showLoggedInUI(email) {
    if (this.userInfo) {
      this.userInfo.textContent = email || "";
      this.userInfo.classList.remove("hidden");
    }

    this.loginBtn?.classList.add("hidden");
    this.logoutBtn?.classList.remove("hidden");
  }

  showLoggedOutUI() {
    if (this.userInfo) {
      this.userInfo.textContent = "";
      this.userInfo.classList.add("hidden");
    }

    this.loginBtn?.classList.remove("hidden");
    this.logoutBtn?.classList.add("hidden");
  }

  setDashboardVisible(isVisible) {
    this.dashboard?.classList.toggle("hidden", !isVisible);
    this.guardPanel?.classList.toggle("hidden", isVisible);
  }

  setGuard(message, isSuccess = false) {
    if (!this.guardMessage) return;

    this.guardMessage.textContent = message;
    this.guardMessage.style.color = isSuccess ? "#4ade80" : "#cbd5e1";
  }

  setAdminBadge(isAdmin) {
    if (!this.adminStatus) return;

    this.adminStatus.textContent = isAdmin ? "admin" : "bukan admin";
    this.adminStatus.className = isAdmin ? "badge green" : "badge gray";
  }

  resetForm() {
    if (!this.eventForm) return;

    this.eventForm.reset();
    const fields = this.eventForm.elements;

    if (fields.status) fields.status.value = "draft";
    if (fields.priceRegular) fields.priceRegular.value = 0;
    if (fields.priceVip) fields.priceVip.value = 0;
    if (fields.capacity) fields.capacity.value = "";
    if (fields.quotaRegular) fields.quotaRegular.value = "";
    if (fields.quotaVip) fields.quotaVip.value = "";

    if (this.ticketStatusInput) this.ticketStatusInput.value = "sell_on";
    this.ticketStatusButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.ticketStatus === "sell_on");
    });

    if (this.posterPreview) {
      this.posterPreview.classList.add("hidden");
      this.posterPreview.innerHTML = "";
    }

    if (this.formStatus) this.formStatus.textContent = "";

    if (this.previewImage) this.previewImage.src = "./images/placeholder.jpg";
    if (this.previewCategory) this.previewCategory.textContent = "Kategori";
    if (this.previewTitle) this.previewTitle.textContent = "Judul Event";
    if (this.previewTagline) this.previewTagline.textContent = "Tagline atau deskripsi singkat.";
    if (this.previewSchedule) this.previewSchedule.textContent = "Tanggal & waktu";
    if (this.previewLocation) this.previewLocation.textContent = "Lokasi";
    if (this.previewSpeaker) this.previewSpeaker.textContent = "Pemateri";
    if (this.previewPrice) this.previewPrice.textContent = "Gratis";
  }
}

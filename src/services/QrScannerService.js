/**
 * QrScannerService
 * 
 * Encapsulates all QR code scanning logic.
 * Responsibilities:
 * - Initialize and manage Html5Qrcode scanner instance
 * - Control scanner start/stop
 * - Parse QR data and extract reference codes
 * 
 * Does NOT handle:
 * - Firebase/Firestore operations
 * - DOM manipulation (except for the scanner container element)
 * - Business logic (verification, check-in updates)
 */

export class QrScannerService {
  constructor(scannerElementId) {
    this.scannerElementId = scannerElementId;
    this.scanner = null;
    this.isScanning = false;
    this.scanCallback = null;
    this.errorCallback = null;
    
    // Debounce configuration
    this.SCAN_DELAY_MS = 300;
    this.SCAN_COOLDOWN_MS = 1200;
    this.scanBusy = false;
  }

  /**
   * Check if Html5Qrcode library is available
   */
  static isLibraryAvailable() {
    return typeof window.Html5Qrcode !== "undefined";
  }

  /**
   * Initialize the scanner (but don't start it yet)
   * @returns {boolean} True if initialization successful
   */
  isInitialized() {
    return this.scanner !== null;
  }

  /**
   * Start scanning QR codes
   * @param {Function} onScan - Callback when QR code is detected: (qrData) => void
   * @param {Function} onError - Callback for errors: (error) => void
   * @returns {Promise<void>}
   */
  async start(onScan, onError) {
    if (!this.scannerElementId) {
      throw new Error("Scanner element ID not provided");
    }

    if (!QrScannerService.isLibraryAvailable()) {
      throw new Error("Html5Qrcode library not loaded");
    }

    if (this.isScanning) {
      throw new Error("Scanner is already running");
    }

    this.scanCallback = onScan;
    this.errorCallback = onError;

    try {
      this.scanner = new window.Html5Qrcode(this.scannerElementId);
      
      await this.scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        this._handleQrDetected.bind(this),
        this._handleScanError.bind(this)
      );

      this.isScanning = true;
    } catch (error) {
      this.scanner = null;
      this.isScanning = false;
      throw new Error(`Failed to start scanner: ${error.message}`);
    }
  }

  /**
   * Stop scanning and clean up resources
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.isScanning || !this.scanner) {
      return;
    }

    try {
      await this.scanner.stop();
      await this.scanner.clear();
    } catch (error) {
      console.warn("Error stopping scanner:", error.message);
    } finally {
      this.scanner = null;
      this.isScanning = false;
      this.scanBusy = false;
    }
  }

  /**
   * Extract reference/code from QR data
   * Handles multiple formats:
   * - URL with ?ref=value parameter
   * - URL with ref=value in query string
   * - Plain reference code
   * 
   * @param {string} qrData - Raw QR code data
   * @returns {string} Extracted reference code or empty string
   */
  extractRef(qrData) {
    if (!qrData) return "";

    const raw = String(qrData).trim();

    // Try to parse as URL and extract ?ref= parameter
    try {
      const url = new URL(raw);
      const fromParam = url.searchParams.get("ref");
      if (fromParam) return fromParam;
    } catch (err) {
      // Not a URL, continue with fallback
    }

    // Try to match ref= pattern in string
    const match = raw.match(/ref=([^&]+)/i);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }

    // Return raw data as fallback (might be just a reference code)
    return raw;
  }

  /**
   * Internal handler for detected QR codes
   * Applies debouncing to prevent processing multiple scans in quick succession
   * @private
   */
  async _handleQrDetected(decodedText) {
    if (this.scanBusy) return;

    this.scanBusy = true;
    try {
      // Small delay to prevent spam
      await new Promise((resolve) => setTimeout(resolve, this.SCAN_DELAY_MS));
      
      // Extract reference and pass to callback
      const ref = this.extractRef(decodedText);
      if (ref && this.scanCallback) {
        this.scanCallback(ref);
      }
    } catch (error) {
      if (this.errorCallback) {
        this.errorCallback(error);
      }
    } finally {
      // Apply cooldown before next scan
      setTimeout(() => {
        this.scanBusy = false;
      }, this.SCAN_COOLDOWN_MS);
    }
  }

  /**
   * Internal handler for scan errors
   * Ignores per-frame errors (very common)
   * @private
   */
  _handleScanError() {
    // Silently ignore per-frame errors - these happen constantly
    // Only significant errors will be caught during start()
  }

  /**
   * Get scanner status
   * @returns {boolean}
   */
  getIsScanning() {
    return this.isScanning;
  }

  /**
   * Destroy scanner instance and cleanup
   * @returns {Promise<void>}
   */
  async destroy() {
    await this.stop();
    this.scanner = null;
    this.scanCallback = null;
    this.errorCallback = null;
  }
}

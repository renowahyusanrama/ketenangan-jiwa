/**
 * UploadWidgetService
 * 
 * Encapsulates all Cloudinary upload widget logic.
 * Responsibilities:
 * - Initialize Cloudinary upload widget
 * - Manage widget lifecycle (init, open)
 * - Handle upload configuration
 * 
 * Does NOT handle:
 * - Firebase/Firestore operations
 * - Custom DOM manipulation
 * - Business logic (form updates, success handling)
 */

export class UploadWidgetService {
  constructor(cloudName, uploadPreset, folder = "") {
    this.cloudName = cloudName;
    this.uploadPreset = uploadPreset;
    this.folder = folder;
    
    this.widget = null;
    this.uploadCallback = null;
    this.errorCallback = null;
    
    // Cloudinary configuration
    this.CONFIG = {
      sources: ["local", "url", "camera"],
      multiple: false,
      cropping: true,
      croppingAspectRatio: null,
      croppingShowDimensions: true,
      showSkipCropButton: true,
      maxFileSize: 6 * 1024 * 1024, // 6 MB
      maxImageWidth: 4000,
      maxImageHeight: 4000,
      clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
    };
  }

  /**
   * Check if Cloudinary library is available globally
   * @returns {boolean}
   */
  static isLibraryAvailable() {
    return typeof window.cloudinary !== "undefined";
  }

  /**
   * Validate required configuration
   * @returns {boolean}
   */
  isConfigured() {
    return (
      this.cloudName &&
      !this.cloudName.startsWith("GANTI") &&
      this.uploadPreset &&
      !this.uploadPreset.startsWith("GANTI")
    );
  }

  /**
   * Initialize the Cloudinary upload widget
   * Must be called before open()
   * 
   * @param {Function} onSuccess - Callback on successful upload: (info) => void
   * @param {Function} onError - Callback on error: (error) => void
   * @returns {boolean} True if initialization successful
   */
  init(onSuccess, onError) {
    if (!UploadWidgetService.isLibraryAvailable()) {
      console.warn("Cloudinary library not loaded");
      return false;
    }

    if (!this.isConfigured()) {
      console.warn("Cloudinary not configured. Check cloudName and uploadPreset.");
      return false;
    }

    this.uploadCallback = onSuccess;
    this.errorCallback = onError;

    try {
      this.widget = window.cloudinary.createUploadWidget(
        this._buildConfig(),
        this._handleUploadResult.bind(this)
      );
      return true;
    } catch (error) {
      console.error("Failed to create Cloudinary widget:", error);
      this.widget = null;
      return false;
    }
  }

  /**
   * Build Cloudinary widget configuration object
   * @private
   * @returns {Object} Widget config
   */
  _buildConfig() {
    return {
      cloudName: this.cloudName,
      uploadPreset: this.uploadPreset,
      folder: this.folder,
      ...this.CONFIG,
    };
  }

  /**
   * Handle Cloudinary upload result
   * @private
   */
  _handleUploadResult(error, result) {
    if (error) {
      if (this.errorCallback) {
        this.errorCallback(error);
      } else {
        console.error("Cloudinary upload error:", error.message);
      }
      return;
    }

    if (result && result.event === "success") {
      const info = result.info || {};
      if (this.uploadCallback) {
        this.uploadCallback(info);
      }
    }
  }

  /**
   * Open the upload widget modal
   * init() must be called first
   * @throws {Error} If widget not initialized
   */
  open() {
    if (!this.widget) {
      throw new Error(
        "Widget not initialized. Call init() first or check configuration."
      );
    }

    try {
      this.widget.open();
    } catch (error) {
      throw new Error(`Failed to open widget: ${error.message}`);
    }
  }

  /**
   * Check if widget is initialized
   * @returns {boolean}
   */
  isInitialized() {
    return this.widget !== null;
  }

  /**
   * Update widget callbacks (useful if handlers change at runtime)
   * @param {Function} onSuccess - New success callback
   * @param {Function} onError - New error callback
   */
  setCallbacks(onSuccess, onError) {
    this.uploadCallback = onSuccess;
    this.errorCallback = onError;
  }

  /**
   * Destroy widget and clean up resources
   */
  destroy() {
    this.widget = null;
    this.uploadCallback = null;
    this.errorCallback = null;
  }
}

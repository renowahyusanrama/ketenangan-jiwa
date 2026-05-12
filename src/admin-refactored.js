/**
 * admin-refactored.js
 * 
 * Clean entry point for the admin application.
 * 
 * Responsibilities (ONLY):
 * - Import all services
 * - Instantiate services with configuration
 * - Wire services together (pass callbacks, link DOM elements, etc.)
 * 
 * Does NOT contain:
 * - Business logic
 * - Event handlers
 * - Firebase operations
 * - DOM manipulation
 * - Any actual feature implementation
 * 
 * Usage:
 * This file should be imported by js/admin.js after all Firebase setup.
 * It provides initialized service instances ready for use.
 * 
 * Example:
 * import { initializeServices } from "./admin-refactored.js";
 * 
 * onAuthStateChanged(auth, async (user) => {
 *   if (user && isAdmin) {
 *     const { qrScanner, uploadWidget } = initializeServices(config);
 *     qrScanner.start(onQrDetected, onQrError);
 *     uploadWidget.init(onUploadSuccess, onUploadError);
 *   }
 * });
 */

import { QrScannerService } from "./services/QrScannerService.js";
import { UploadWidgetService } from "./services/UploadWidgetService.js";

/**
 * Service configuration - extracted from js/admin.js
 */
const SERVICE_CONFIG = {
  qrScanner: {
    elementId: "qrReader", // DOM element where scanner renders
  },
  uploadWidget: {
    cloudName: "dkhieufnk",
    uploadPreset: "posters",
    folder: "posters",
  },
};

/**
 * Initialize all services with configuration and wiring
 * 
 * @param {Object} overrideConfig - Override default configuration
 * @returns {Object} Initialized services {qrScanner, uploadWidget}
 * 
 * Example:
 * const { qrScanner, uploadWidget } = initializeServices({
 *   uploadWidget: {
 *     cloudName: "your-cloud-name",
 *     uploadPreset: "your-preset",
 *   }
 * });
 */
export function initializeServices(overrideConfig = {}) {
  const config = {
    ...SERVICE_CONFIG,
    ...overrideConfig,
  };

  // Initialize QR Scanner Service
  const qrScanner = new QrScannerService(config.qrScanner.elementId);

  // Initialize Upload Widget Service
  const uploadWidget = new UploadWidgetService(
    config.uploadWidget.cloudName,
    config.uploadWidget.uploadPreset,
    config.uploadWidget.folder
  );

  return {
    qrScanner,
    uploadWidget,
  };
}

/**
 * Get service configuration (useful for testing or inspection)
 * @returns {Object} Current service configuration
 */
export function getServiceConfig() {
  return { ...SERVICE_CONFIG };
}

/**
 * Update service configuration at runtime
 * Useful if configuration is loaded from backend/API
 * 
 * @param {Object} newConfig - New configuration to merge
 */
export function updateServiceConfig(newConfig = {}) {
  Object.assign(SERVICE_CONFIG, newConfig);
}

/**
 * Export service classes for direct instantiation if needed
 */
export { QrScannerService, UploadWidgetService };

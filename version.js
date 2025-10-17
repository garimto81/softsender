/**
 * Central Version Management System
 * Single Source of Truth for all version references
 *
 * @fileoverview This file is the ONLY place to update version numbers.
 * All other files (code, docs) sync from here automatically.
 */

const VERSION = {
  major: 11,
  minor: 11,
  patch: 0,

  // Auto-generated fields
  get version() {
    return `${this.major}.${this.minor}.${this.patch}`;
  },

  get fullVersion() {
    return `v${this.version}`;
  },

  get buildDate() {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  },

  // Version increment helpers
  incrementPatch() {
    this.patch += 1;
    return this;
  },

  incrementMinor() {
    this.minor += 1;
    this.patch = 0;
    return this;
  },

  incrementMajor() {
    this.major += 1;
    this.minor = 0;
    this.patch = 0;
    return this;
  },

  // Validation
  isValidSemVer() {
    return (
      Number.isInteger(this.major) && this.major >= 0 &&
      Number.isInteger(this.minor) && this.minor >= 0 &&
      Number.isInteger(this.patch) && this.patch >= 0
    );
  },

  // Display formats
  toString() {
    return this.version;
  },

  toFullString() {
    return this.fullVersion;
  },

  // Comparison
  compare(otherVersion) {
    const [maj, min, pat] = otherVersion.split('.').map(Number);

    if (this.major !== maj) return this.major - maj;
    if (this.minor !== min) return this.minor - min;
    return this.patch - pat;
  }
};

// Validation on load
if (!VERSION.isValidSemVer()) {
  throw new Error('Invalid Semantic Version in version.js');
}

module.exports = VERSION;
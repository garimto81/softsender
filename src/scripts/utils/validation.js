// Validation Utilities (no dependencies)
const Validation = (() => {
  return {
    // Validate player data
    validatePlayer(data) {
      if (!data.player || !data.player.trim()) {
        return { valid: false, error: 'Player name is required' };
      }
      if (!data.nat || data.nat.length !== 2) {
        return { valid: false, error: 'Valid 2-letter country code is required' };
      }
      return { valid: true };
    },

    // Validate send payload
    validateSendPayload(payload) {
      if (!payload.filename || !payload.filename.trim()) {
        return { valid: false, error: 'Filename is required' };
      }
      if (!payload.jBlock || !payload.jBlock.trim()) {
        return { valid: false, error: 'Content is required' };
      }
      if (!payload.pickedTime && !payload.autoNow) {
        return { valid: false, error: 'Time must be selected or auto-now enabled' };
      }
      return { valid: true };
    },

    // Validate batch payload
    validateBatchPayload(items) {
      if (!Array.isArray(items) || items.length === 0) {
        return { valid: false, error: 'No items to send' };
      }

      for (let i = 0; i < items.length; i++) {
        const result = this.validateSendPayload(items[i]);
        if (!result.valid) {
          return { valid: false, error: `Item ${i + 1}: ${result.error}` };
        }
      }

      return { valid: true };
    },

    // Sanitize input
    sanitize(input) {
      return String(input || '')
        .trim()
        .replace(/[<>]/g, ''); // Remove potential HTML
    },

    // Check if time format is valid (HH:mm)
    isValidTimeFormat(timeStr) {
      return /^\d{2}:\d{2}$/.test(String(timeStr || '').trim());
    },
  };
})();

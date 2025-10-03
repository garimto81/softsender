// Formatting Utilities (no dependencies)
const Format = (() => {
  return {
    // Build filename: HHmm_<name>_<mode>
    buildFileName(kind, hhmm, tableNo, playerOrLabel) {
      const safe = (s) => String(s || '').trim().replace(/[^\w\-#]+/g, '_');
      const modes = ['PU', 'ELIM', 'L3', 'LEADERBOARD'];
      const mode = modes.includes(kind) ? kind : 'SC';
      const time = String(hhmm || '').padStart(4, '0');
      const name = (kind === 'LEADERBOARD')
        ? safe(playerOrLabel || ('Table' + (tableNo || '')))
        : safe(playerOrLabel || 'Player');
      return `${time}_${name}_${mode}`;
    },

    // Format player display: name / nat
    formatPlayerDisplay(player, nat) {
      const name = String(player || '').trim();
      const code = String(nat || '').trim().toUpperCase().substring(0, 2);
      return code ? `${name} / ${code}` : name;
    },

    // Parse time string to minutes
    parseTime(timeStr) {
      const match = String(timeStr || '').match(/^(\d{2}):(\d{2})/);
      return match ? (parseInt(match[1], 10) * 60 + parseInt(match[2], 10)) : null;
    },

    // Format time for display
    formatTime(date) {
      const h = String(date.getHours()).padStart(2, '0');
      const m = String(date.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    },

    // Get country flag emoji (if available)
    getCountryFlag(code) {
      if (!code || code.length !== 2) return '';
      const offset = 127397;
      return String.fromCodePoint(
        ...code.toUpperCase().split('').map(c => c.charCodeAt(0) + offset)
      );
    },

    // Truncate text
    truncate(text, maxLength) {
      const str = String(text || '');
      return str.length > maxLength ? str.substring(0, maxLength - 1) + '…' : str;
    },

    // Build J-column block for backend
    buildJBlock(mode, player, nat, customData) {
      const display = this.formatPlayerDisplay(player, nat);
      switch (mode) {
        case 'PU':
          return `[PU] ${display}`;
        case 'ELIM':
          return `[ELIM] ${display}`;
        case 'L3':
          return `[L3] ${display}`;
        case 'LEADERBOARD':
          return `[LEADERBOARD] ${customData || display}`;
        default:
          return `[SC] ${display}`;
      }
    },
  };
})();

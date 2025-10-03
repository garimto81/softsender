// Mode Selection UI Module (depends on: state)
const ModeUI = (() => {
  const MODES = {
    PU: { label: 'PU', color: '#2563eb' },
    ELIM: { label: 'ELIM', color: '#dc2626' },
    L3: { label: 'L3', color: '#f59e0b' },
    LEADERBOARD: { label: 'LEADER', color: '#10b981' },
    SC: { label: 'SC', color: '#6b7280' },
  };

  function renderModeSelector() {
    const activeMode = AppState.get('activeMode');

    return `
      <div class="mode-selector">
        ${Object.entries(MODES).map(([key, config]) => `
          <button class="mode-btn ${activeMode === key ? 'mode-btn--active' : ''}"
                  data-mode="${key}"
                  style="--mode-color: ${config.color}">
            ${config.label}
          </button>
        `).join('')}
      </div>
    `;
  }

  function attachEventListeners() {
    const app = document.getElementById('app');

    app.addEventListener('click', (e) => {
      const btn = e.target.closest('.mode-btn');
      if (!btn) return;

      const mode = btn.dataset.mode;
      AppState.set('activeMode', mode);

      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(10);

      // Update all mode selectors
      document.querySelectorAll('.mode-btn').forEach(b => {
        b.classList.toggle('mode-btn--active', b.dataset.mode === mode);
      });

      // Update input cards if needed
      if (PlayerUI && PlayerUI.updateUI) {
        PlayerUI.updateUI();
      }
    });
  }

  function getActiveMode() {
    return AppState.get('activeMode');
  }

  return {
    renderModeSelector,
    attachEventListeners,
    getActiveMode,
    MODES,
  };
})();

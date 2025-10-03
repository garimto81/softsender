// Send/Submit UI Module (depends on: state, api, format)
const SendUI = (() => {
  async function sendData() {
    const selectedPlayers = AppState.getSelectedPlayers();
    const activeMode = AppState.get('activeMode');
    const currentTable = AppState.get('currentTable');
    const config = AppState.get('config');

    if (selectedPlayers.length === 0) {
      alert('Please select at least one player');
      return;
    }

    // Show loading
    const sendBtn = document.querySelector('.footer-btn--primary');
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending...';
    }

    try {
      const now = new Date();
      const hhmm = Format.formatTime(now).replace(':', '');

      // Build payload items
      const items = selectedPlayers.map(p => {
        const jBlock = Format.buildJBlock(activeMode, p.player, p.nat, p.customLabel);
        const filename = Format.buildFileName(activeMode, hhmm, currentTable.tno, p.player);

        return {
          cueId: config.cueId,
          kind: activeMode,
          autoNow: true,
          filename,
          jBlock,
          eFix: '미완료',
          gFix: 'SOFT',
        };
      });

      // Validate
      const validation = Validation.validateBatchPayload(items);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Send to backend
      const result = await API.updateVirtualBatch(items);

      if (!result.ok) {
        throw new Error(result.error);
      }

      // Success feedback
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      alert(`✅ Sent ${result.successCount} player(s) successfully!`);

      // Clear selection and go back
      AppState.clearSelectedPlayers();
      Router.navigate('table-selection');

    } catch (error) {
      console.error('Send error:', error);
      alert(`❌ Error: ${error.message}`);

      // Reset button
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
      }
    }
  }

  function renderFooter() {
    const selectedCount = AppState.getSelectedPlayers().length;

    return `
      <div class="work-screen__footer">
        <button class="footer-btn footer-btn--secondary" data-action="clear">
          Clear All
        </button>
        <button class="footer-btn footer-btn--primary" data-action="send">
          Send ${selectedCount > 0 ? `(${selectedCount})` : ''}
        </button>
      </div>
    `;
  }

  function attachEventListeners() {
    const app = document.getElementById('app');

    app.addEventListener('click', async (e) => {
      const btn = e.target.closest('.footer-btn');
      if (!btn) return;

      const action = btn.dataset.action;

      if (action === 'send') {
        await sendData();
      } else if (action === 'clear') {
        if (confirm('Clear all selected players?')) {
          AppState.clearSelectedPlayers();
          PlayerUI.updateUI();
        }
      }
    });
  }

  return {
    sendData,
    renderFooter,
    attachEventListeners,
  };
})();

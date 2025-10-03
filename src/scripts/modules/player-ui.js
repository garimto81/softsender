// Player Selection UI Module (depends on: state, format, validation)
const PlayerUI = (() => {
  function renderPlayerGrid() {
    const players = TableData.getCurrentTablePlayers();
    const countryMap = AppState.get('countryMap');
    const selectedPlayers = AppState.get('selectedPlayers');

    if (players.length === 0) {
      return '<div class="empty-state"><div class="empty-state__icon">👥</div><div class="empty-state__text">No players</div></div>';
    }

    return players.map(p => {
      const isSelected = selectedPlayers.has(p.seat);
      const nat = p.nat || '';
      const flag = Format.getCountryFlag(nat);
      const country = countryMap[nat] || nat;

      return `
        <div class="player-cell ${isSelected ? 'player-cell--selected' : ''}"
             data-seat="${p.seat}"
             data-player="${p.player}"
             data-nat="${nat}">
          <div class="player-cell__seat">Seat ${p.seat}</div>
          <div class="player-cell__name">${Format.truncate(p.player, 12)}</div>
          ${flag ? `<div class="player-cell__flag">${flag}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function renderInputCards() {
    const selectedPlayers = Array.from(AppState.get('selectedPlayers').values());
    const countryMap = AppState.get('countryMap');
    const activeMode = AppState.get('activeMode');

    if (selectedPlayers.length === 0) {
      return '<div class="empty-state"><div class="empty-state__icon">👈</div><div class="empty-state__text">Select players from left</div></div>';
    }

    return selectedPlayers.map(p => {
      const nat = p.nat || '';
      const flag = Format.getCountryFlag(nat);
      const country = countryMap[nat] || nat;

      return `
        <div class="input-card" data-seat="${p.seat}">
          <div class="input-card__header">
            <div class="input-card__player">
              <div class="input-card__seat">Seat ${p.seat}</div>
              <div class="input-card__name">${flag} ${p.player}</div>
            </div>
            <button class="input-card__remove icon-btn" data-seat="${p.seat}">×</button>
          </div>
          <div class="input-card__body">
            <div class="mode-selector">
              ${['PU', 'ELIM', 'L3', 'SC'].map(mode => `
                <button class="mode-btn ${activeMode === mode ? 'mode-btn--active' : ''}"
                        data-mode="${mode}"
                        data-seat="${p.seat}">
                  ${mode}
                </button>
              `).join('')}
            </div>
            ${activeMode === 'LEADERBOARD' ? `
              <div class="input-group">
                <label class="input-label">Custom Label</label>
                <input type="text"
                       class="input-field"
                       data-seat="${p.seat}"
                       data-field="customLabel"
                       placeholder="Enter custom label">
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function attachEventListeners() {
    const app = document.getElementById('app');

    // Player selection toggle
    app.addEventListener('click', (e) => {
      const cell = e.target.closest('.player-cell');
      if (!cell) return;

      const seat = cell.dataset.seat;
      const player = cell.dataset.player;
      const nat = cell.dataset.nat;

      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(10);

      if (AppState.isPlayerSelected(seat)) {
        AppState.deselectPlayer(seat);
      } else {
        AppState.selectPlayer(seat, { seat, player, nat });
      }

      updateUI();
    });

    // Remove player from input cards
    app.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.input-card__remove');
      if (!removeBtn) return;

      const seat = removeBtn.dataset.seat;
      AppState.deselectPlayer(seat);
      updateUI();
    });

    // Mode selection
    app.addEventListener('click', (e) => {
      const modeBtn = e.target.closest('.mode-btn');
      if (!modeBtn) return;

      const mode = modeBtn.dataset.mode;
      AppState.set('activeMode', mode);
      updateUI();
    });
  }

  function updateUI() {
    const gridContainer = document.querySelector('.player-grid');
    const cardsContainer = document.querySelector('.input-cards');

    if (gridContainer) gridContainer.innerHTML = renderPlayerGrid();
    if (cardsContainer) cardsContainer.innerHTML = renderInputCards();
  }

  return {
    renderPlayerGrid,
    renderInputCards,
    attachEventListeners,
    updateUI,
  };
})();

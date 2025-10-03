// Global State Management (must be first - no dependencies)
const AppState = (() => {
  const _state = {
    // Bootstrap data
    config: null,

    // Table data
    typeRows: [],
    countryMap: {},
    timeOptions: [],

    // Current selection
    currentTable: null,
    selectedPlayers: new Map(), // seat -> player data
    activeMode: 'PU',

    // UI state
    currentView: 'table-selection',
    isLoading: false,
    error: null,
  };

  const _listeners = new Map();

  return {
    get(key) {
      return _state[key];
    },

    set(key, value) {
      _state[key] = value;
      _notify(key, value);
    },

    update(updates) {
      Object.entries(updates).forEach(([key, value]) => {
        _state[key] = value;
        _notify(key, value);
      });
    },

    subscribe(key, callback) {
      if (!_listeners.has(key)) {
        _listeners.set(key, []);
      }
      _listeners.get(key).push(callback);

      // Return unsubscribe function
      return () => {
        const callbacks = _listeners.get(key);
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      };
    },

    // Player selection helpers
    selectPlayer(seat, data) {
      _state.selectedPlayers.set(seat, data);
      _notify('selectedPlayers', _state.selectedPlayers);
    },

    deselectPlayer(seat) {
      _state.selectedPlayers.delete(seat);
      _notify('selectedPlayers', _state.selectedPlayers);
    },

    clearSelectedPlayers() {
      _state.selectedPlayers.clear();
      _notify('selectedPlayers', _state.selectedPlayers);
    },

    getSelectedPlayers() {
      return Array.from(_state.selectedPlayers.values());
    },

    isPlayerSelected(seat) {
      return _state.selectedPlayers.has(seat);
    },

    // Debug
    getState() {
      return { ..._state };
    }
  };

  function _notify(key, value) {
    const callbacks = _listeners.get(key);
    if (callbacks) {
      callbacks.forEach(cb => cb(value));
    }
  }
})();

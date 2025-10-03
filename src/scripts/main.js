// Main Entry Point (must be last - initializes everything)
(async () => {
  console.log('🚀 Soft Content Sender v14.0 starting...');

  // Load initial data
  const success = await TableData.loadAllData();

  if (!success) {
    console.error('Failed to load initial data');
    document.getElementById('app').innerHTML = '<div class="error">Failed to load data. Please refresh.</div>';
    return;
  }

  // Set last used mode
  const lastMode = Storage.getLastMode();
  AppState.set('activeMode', lastMode);

  // Subscribe to mode changes to persist
  AppState.subscribe('activeMode', (mode) => {
    Storage.setLastMode(mode);
  });

  // Subscribe to selected players changes to update UI
  AppState.subscribe('selectedPlayers', () => {
    if (AppState.get('currentView') === 'work-screen') {
      PlayerUI.updateUI();
    }
  });

  // Initial render
  Router.render();

  console.log('✅ App initialized');
})();

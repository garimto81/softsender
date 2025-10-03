// Router Module (depends on: state, all UI modules)
const Router = (() => {
  const views = {
    'table-selection': renderTableSelection,
    'work-screen': renderWorkScreen,
  };

  function navigate(viewName) {
    if (!views[viewName]) {
      console.error(`View not found: ${viewName}`);
      return;
    }

    AppState.set('currentView', viewName);
    render();
  }

  function render() {
    const viewName = AppState.get('currentView');
    const app = document.getElementById('app');

    if (!app) {
      console.error('App container not found');
      return;
    }

    const renderFn = views[viewName];
    if (!renderFn) {
      app.innerHTML = '<div class="error">View not found</div>';
      return;
    }

    app.innerHTML = renderFn();
    attachViewEventListeners(viewName);
  }

  function renderTableSelection() {
    const isLoading = AppState.get('isLoading');
    const error = AppState.get('error');

    if (isLoading) {
      return '<div class="loading">Loading...</div>';
    }

    if (error) {
      return `<div class="error">Error: ${error}</div>`;
    }

    return `
      <div class="table-selection">
        <div class="table-selection__header">
          <div class="table-selection__title">Select Table</div>
          <button class="table-selection__settings icon-btn">⚙️</button>
        </div>
        <div class="table-selection__body">
          <div class="recent-tables">
            <div class="recent-tables__title">Recent</div>
            <div class="recent-tables__list">
              ${TableUI.renderRecentTables()}
            </div>
          </div>
          <div class="all-tables">
            <div class="all-tables__title">All Tables</div>
            ${TableUI.renderAllTables()}
          </div>
        </div>
      </div>
    `;
  }

  function renderWorkScreen() {
    const table = AppState.get('currentTable');
    const countryMap = AppState.get('countryMap');

    if (!table) {
      navigate('table-selection');
      return '';
    }

    const nat = table.nat || '';
    const flag = Format.getCountryFlag(nat);
    const country = countryMap[nat] || nat;

    return `
      <div class="work-screen">
        <div class="work-screen__header">
          <div class="work-screen__table-info">
            <button class="work-screen__back icon-btn" data-action="back">←</button>
            <div>
              <div class="work-screen__table-number">
                ${flag} Table ${table.tno}
              </div>
              <div class="work-screen__table-name">
                ${table.tname || table.room}
              </div>
            </div>
          </div>
        </div>
        <div class="work-screen__panels">
          <div class="left-panel">
            <div class="player-grid">
              ${PlayerUI.renderPlayerGrid()}
            </div>
          </div>
          <div class="right-panel">
            <div class="input-cards">
              ${PlayerUI.renderInputCards()}
            </div>
          </div>
        </div>
        ${SendUI.renderFooter()}
      </div>
    `;
  }

  function attachViewEventListeners(viewName) {
    if (viewName === 'table-selection') {
      TableUI.attachEventListeners();
    } else if (viewName === 'work-screen') {
      PlayerUI.attachEventListeners();
      SendUI.attachEventListeners();

      // Back button
      const app = document.getElementById('app');
      app.addEventListener('click', (e) => {
        const backBtn = e.target.closest('[data-action="back"]');
        if (backBtn) {
          AppState.clearSelectedPlayers();
          navigate('table-selection');
        }
      });
    }
  }

  return {
    navigate,
    render,
  };
})();

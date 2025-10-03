// Table Selection UI Module (depends on: table-data, format)
const TableUI = (() => {
  function renderRecentTables() {
    const recent = TableData.getRecentTablesWithData();
    const countryMap = AppState.get('countryMap');

    if (recent.length === 0) {
      return '<div class="empty-state"><div class="empty-state__icon">🎰</div><div class="empty-state__text">No recent tables</div></div>';
    }

    return recent.map(table => {
      const nat = table.nat || '';
      const flag = Format.getCountryFlag(nat);
      const country = countryMap[nat] || nat;

      return `
        <div class="recent-table-card" data-tno="${table.tno}">
          <div class="recent-table-card__number">${table.tno}</div>
          <div class="recent-table-card__info">
            ${flag} ${Format.truncate(country, 12)}<br>
            ${Format.truncate(table.tname || table.room, 15)}
          </div>
        </div>
      `;
    }).join('');
  }

  function renderAllTables() {
    const rows = AppState.get('typeRows');
    const groups = TableData.groupTablesByRoom(rows);
    const countryMap = AppState.get('countryMap');

    // Remove duplicates by tno
    const uniqueTables = new Map();
    rows.forEach(row => {
      if (!uniqueTables.has(row.tno)) {
        uniqueTables.set(row.tno, row);
      }
    });

    const roomNames = Object.keys(groups).sort();

    return roomNames.map(room => {
      const tables = groups[room];
      const uniqueInRoom = Array.from(
        new Map(tables.map(t => [t.tno, t])).values()
      ).sort((a, b) => {
        const numA = parseInt(a.tno) || 0;
        const numB = parseInt(b.tno) || 0;
        return numA - numB;
      });

      const tableItems = uniqueInRoom.map(table => {
        const nat = table.nat || '';
        const flag = Format.getCountryFlag(nat);

        return `
          <div class="table-item" data-tno="${table.tno}">
            <div class="table-item__number">${flag} ${table.tno}</div>
            ${table.tname ? `<div class="table-item__name">${Format.truncate(table.tname, 12)}</div>` : ''}
          </div>
        `;
      }).join('');

      return `
        <div class="table-group">
          <div class="table-group__header">${room}</div>
          <div class="table-list">${tableItems}</div>
        </div>
      `;
    }).join('');
  }

  function attachEventListeners() {
    const app = document.getElementById('app');

    // Table selection (event delegation)
    app.addEventListener('click', (e) => {
      const card = e.target.closest('.recent-table-card, .table-item');
      if (!card) return;

      const tno = card.dataset.tno;
      const table = TableData.findTableByNumber(tno);

      if (table) {
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(10);

        TableData.selectTable(table);
        Router.navigate('work-screen');
      }
    });
  }

  return {
    renderRecentTables,
    renderAllTables,
    attachEventListeners,
  };
})();

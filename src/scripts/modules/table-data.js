// Table Data Module (depends on: state, api, storage)
const TableData = (() => {
  async function loadAllData() {
    AppState.set('isLoading', true);
    AppState.set('error', null);

    try {
      const [bootstrap, typeResult, countryResult, timeResult] = await Promise.all([
        API.getBootstrap(),
        API.getTypeRows(),
        API.getCountryMap(),
        API.getTimeOptions(),
      ]);

      if (!typeResult.ok) throw new Error(typeResult.error);
      if (!countryResult.ok) throw new Error(countryResult.error);
      if (!timeResult.ok) throw new Error(timeResult.error);

      AppState.update({
        config: bootstrap,
        typeRows: typeResult.rows,
        countryMap: countryResult.map,
        timeOptions: timeResult.list,
        isLoading: false,
      });

      return true;
    } catch (error) {
      AppState.update({
        error: error.message,
        isLoading: false,
      });
      return false;
    }
  }

  function groupTablesByRoom(rows) {
    const groups = {};
    rows.forEach(row => {
      const room = row.room || 'Unknown';
      if (!groups[room]) groups[room] = [];
      groups[room].push(row);
    });
    return groups;
  }

  function findTableByNumber(tno) {
    const rows = AppState.get('typeRows');
    return rows.find(r => r.tno === tno);
  }

  function getRecentTablesWithData() {
    const recent = Storage.getRecentTables();
    const rows = AppState.get('typeRows');

    // Enrich recent tables with current data
    return recent
      .map(r => {
        const current = rows.find(row => row.tno === r.tno);
        return current || r; // Use current data if available
      })
      .slice(0, 5); // Show top 5
  }

  return {
    loadAllData,
    groupTablesByRoom,
    findTableByNumber,
    getRecentTablesWithData,

    // Save table selection
    selectTable(table) {
      AppState.set('currentTable', table);
      Storage.addRecentTable(table);
    },

    // Get players for current table
    getCurrentTablePlayers() {
      const table = AppState.get('currentTable');
      if (!table) return [];

      const rows = AppState.get('typeRows');
      return rows.filter(r => r.tno === table.tno);
    },
  };
})();

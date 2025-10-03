// LocalStorage Service (no dependencies)
const Storage = (() => {
  const KEYS = {
    RECENT_TABLES: 'soft_recent_tables',
    LAST_MODE: 'soft_last_mode',
    USER_PREFS: 'soft_user_prefs',
  };

  function get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (e) {
      console.error('Storage get error:', e);
      return defaultValue;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Storage remove error:', e);
    }
  }

  return {
    // Recent tables (max 10)
    getRecentTables() {
      return get(KEYS.RECENT_TABLES, []);
    },

    addRecentTable(table) {
      const recent = this.getRecentTables();
      // Remove if exists
      const filtered = recent.filter(t => t.tno !== table.tno);
      // Add to front
      filtered.unshift(table);
      // Keep max 10
      const updated = filtered.slice(0, 10);
      set(KEYS.RECENT_TABLES, updated);
    },

    // Last used mode
    getLastMode() {
      return get(KEYS.LAST_MODE, 'PU');
    },

    setLastMode(mode) {
      set(KEYS.LAST_MODE, mode);
    },

    // User preferences
    getPrefs() {
      return get(KEYS.USER_PREFS, {});
    },

    setPref(key, value) {
      const prefs = this.getPrefs();
      prefs[key] = value;
      set(KEYS.USER_PREFS, prefs);
    },

    // Clear all
    clear() {
      Object.values(KEYS).forEach(remove);
    },
  };
})();

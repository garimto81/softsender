// Google Apps Script API Service (no dependencies)
const API = (() => {
  function callServer(functionName, ...args) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        [functionName](...args);
    });
  }

  return {
    // Bootstrap
    async getBootstrap() {
      return callServer('getBootstrap');
    },

    // Type data
    async getTypeRows(typeIdOverride) {
      return callServer('getTypeRows', typeIdOverride);
    },

    async getCountryMap(typeIdOverride) {
      return callServer('getCountryMap', typeIdOverride);
    },

    // Time options
    async getTimeOptions(cueIdOverride) {
      return callServer('getTimeOptions', cueIdOverride);
    },

    // Update virtual sheet
    async updateVirtual(payload) {
      return callServer('updateVirtual', payload);
    },

    async updateVirtualBatch(items) {
      return callServer('updateVirtualBatch', items);
    },
  };
})();

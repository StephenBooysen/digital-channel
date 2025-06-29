/**
 * @fileoverview This service provides basic caching functionality.
 * @author srbooysen
 */

/**
 * Initializes the caching service.
 * @returns {object} The caching service with cacheSet and cacheGet methods.
 */
cachingService = function () {
  // Retrieve the logger
  debuggingService = require('./debuggingService')();
  logger = debuggingService.getLogger();

  // The cache container
  cachingService.cache = new Map();

  /**
   * Sets a value in the cache.
   * @param {string} key - The key to store the value under.
   * @param {*} value - The value to store.
   */
  cachingService.cacheSet = function (key, value) {
    cachingService.cache.set(key, value);
    logger.info('Backend cache set: ' + key);
  };

  /**
   * Retrieves a value from the cache.
   * @param {string} key - The key of the value to retrieve.
   * @returns {*} The cached value, or null if the key is not found.
   */
  cachingService.cacheGet = function (key) {
    if (cachingService.cache.get(key) != null) {
      logger.info('Backend cache hit: ' + key);
      return cachingService.cache.get(key);
    }
    return null; // Return null if key is not found
  };

  return cachingService;
};
module.exports = cachingService;

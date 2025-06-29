/**
 * The cachingService enables some basic caching objects
 * 
 * @method cacheSet: Set a cache value
 * @method cacheGet: Retrieve a cache value
 * 
 * author :srbooysen
 */
cachingService = (function () {

    // Retrieve the logger
    debuggingService = require("../modules/debuggingService")();
    logger =  debuggingService.getLogger();

    // The cache container
    cachingService.cache = new Map();

    /**
     * Set a cache value
     * @param {string} key
     * @param {string} value 
     */
    cachingService.cacheSet = function (key,value) {
        cachingService.cache.set(key, value)
        logger.info('Backend cache set: ' + key);
    }

    /**
     * Retrieve a cache value
     * @param {string} key 
     */
    cachingService.cacheGet = function (key) {
        if (cachingService.cache.get(key) != null){
            logger.info('Backend cache hit: ' + key);
            return cachingService.cache.get(key)
        }
        return null;
    }

    return cachingService;

});
module.exports = cachingService;
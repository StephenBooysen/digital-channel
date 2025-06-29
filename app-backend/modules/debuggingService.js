 
 /**
 * The following code enables some basic debugging functions
 * 
 * @method cacheSet: Set a cache value
 * @method cacheGet: Retrieve a cache value
 * 
 * author :srbooysen
 */
 debuggingservice = (function () {

    //load our environment settings
    require('dotenv').config();

    //load the logger
    const log4js = require('log4js');
    const logger = log4js.getLogger();
    logger.level = process.env.logginglevel;

    /**
     * @method getLogger : return the logger 
     * @returns 
     */
    debuggingservice.getLogger = function(){
        return logger;
    }

    /**
     * Test debuggingservice stopwatch feature
     * @methods 
     *  - setStopwatch : Set the start time in the stopwatch
     *  - getStopwatch : return a string representation of the difference between the start end dates
     */
    debuggingservice.stopwatch = new Map();

    /**
     * @method setStopwatch : Set the start time in the stopwatch
     * @param {@} name 
     * @returns 
     */
    debuggingservice.setStopwatch = function (name) {
        debuggingservice.stopwatch.set(name, new Date());
    }

    /**
     * @method getStopwatch : return a string representation of the difference between the start end dates
     * @param {@} name 
     * @returns 
     */
    debuggingservice.getStopwatch = function (name) {
        var endTime = new Date();
        var startTime = new Date();
        if (debuggingservice.stopwatch.has(name)) {
        startTime = debuggingservice.stopwatch.get(name);
        }
        var timeDiff = endTime - startTime;
        debuggingservice.stopwatch.delete(name);
        return timeDiff + " ms"
    }

    /**
     * @method getPayloadSize : return the size of a string
     * @param {string} payload 
     * @returns 
     */
    debuggingservice.getPayloadSize = function (payload) {
        return Buffer.byteLength(payload, 'utf8') + " bytes"
    }

    return debuggingservice

});
module.exports = debuggingservice;
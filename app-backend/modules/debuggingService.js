/**
 * @fileoverview This service provides basic debugging utilities, including logging and a stopwatch.
 * @author srbooysen
 */

/**
 * Initializes the debugging service.
 * @returns {object} The debugging service with methods for logging, stopwatch, and payload size calculation.
 */
debuggingservice = function () {
  // Load environment settings
  require('dotenv').config();

  // Load the logger
  const log4js = require('log4js');
  const logger = log4js.getLogger();
  logger.level = process.env.logginglevel; // Set logging level from environment variable

  /**
   * Returns the logger instance.
   * @returns {object} The logger instance.
   */
  debuggingservice.getLogger = function () {
    return logger;
  };

  /**
   * @property {Map<string, Date>} stopwatch - Stores start times for stopwatches.
   */
  debuggingservice.stopwatch = new Map();

  /**
   * Sets the start time for a named stopwatch.
   * @param {string} name - The name of the stopwatch.
   */
  debuggingservice.setStopwatch = function (name) {
    debuggingservice.stopwatch.set(name, new Date());
  };

  /**
   * Gets the elapsed time for a named stopwatch and removes it.
   * @param {string} name - The name of the stopwatch.
   * @returns {string} A string representation of the elapsed time in milliseconds.
   */
  debuggingservice.getStopwatch = function (name) {
    var endTime = new Date();
    var startTime = new Date(); // Default to now if stopwatch not found
    if (debuggingservice.stopwatch.has(name)) {
      startTime = debuggingservice.stopwatch.get(name);
    }
    var timeDiff = endTime - startTime;
    debuggingservice.stopwatch.delete(name); // Remove stopwatch after use
    return timeDiff + ' ms';
  };

  /**
   * Calculates the size of a string payload in bytes.
   * @param {string} payload - The string payload.
   * @returns {string} The size of the payload in bytes, suffixed with " bytes".
   */
  debuggingservice.getPayloadSize = function (payload) {
    return Buffer.byteLength(payload, 'utf8') + ' bytes';
  };

  return debuggingservice;
};
module.exports = debuggingservice;

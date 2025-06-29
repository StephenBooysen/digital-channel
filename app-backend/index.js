/**
 * @fileoverview This file simulates the backend for the Smart Trolley Application.
 * It handles calls to Shoprite Group Digital Services and marshals them to the in-store trolley application.
 * @author srbooysen
 */

/**
 * Initializes the backend module.
 * @returns {object} The backend module with a getRouter function.
 */
backend = function () {
  const https = require('https');
  const fs = require('fs');

  const axios = require('axios');
  const bodyParser = require('body-parser');
  routerService = require('./routerService')();

  /**
   * Returns the router service.
   * @returns {object} The router service.
   */
  backend.getRouter = function () {
    return routerService.getRouter();
  };

  return backend;
};
module.exports = backend;

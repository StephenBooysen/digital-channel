/**
 * The following code file simulates the functions required for the backend for front end for the Smart Trolley Application
 * Its purpose is to make the calls to the Shoprite Group Digital Services and marshal them the instore trolley application
 * 
 *  
 * author :srbooysen
 */
backend = (function () {

    const https = require('https');
    const fs = require('fs');

    const axios = require('axios');
    const bodyParser = require('body-parser');
    routerService = require('./routerService')();

    backend.getRouter = function () {     
        return routerService.getRouter();
    }
       
    return backend;
});
module.exports = backend;
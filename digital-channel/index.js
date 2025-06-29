/**
 * The following code folder creates an entry point for this sample application. 
 * The application encapsulates the building of an in-store ecommerce application that leverages the Group Digital Services endpoints
 * The application consists of 3 distinct modules
 *  - app-backend: This module creates a backend-for-frontend application that marshals traffic from an customer app and the secure Group Digital Services endpoints
 *                 The module uses best practices for caching , minification and security when using the API's
 *  - app-customer: This module creates a simulated customer app which allow to pick items and pay without using the normal POS route 
 *  - app-harness: This module creates all the boiler plate code around application
 * 
 * author: srbooysen
 * date update: 2025-04-28
 */

const express = require('express');
const path = require('path');
const app = express();

//load our enviroment settings
require('dotenv').config();
console.log(process.env.baseURL);
    
// Run without validating SSL : Not recommended lols
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// launch the backend for front end
backend = require("./app-backend");
backend = new backend();
router = backend.getRouter();

// Run the express server
var port = (process.env.port != null ? process.env.port : (process.argv[2] != null ? process.argv[2] : 3000));
app.use("/", express.static(path.join(__dirname, 'app-frontend')));
app.use("/harness", express.static(path.join(__dirname, 'app-harness')));
app.use('', router);
app.listen(port, () => {
    console.log(`***********************************************************************`);
    console.log(`Smart Trolley Test Harness is running on at http://localhost:${port}/`);
    console.log(`***********************************************************************`);
});


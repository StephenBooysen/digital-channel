/**
 * @fileoverview Entry point for the Smart Trolley sample application.
 * This application demonstrates an in-store e-commerce system using Group Digital Services endpoints.
 * It comprises three main modules:
 *  - app-backend: A Backend-For-Frontend (BFF) that manages communication between the customer app and secure Group Digital Services.
 *                 It incorporates best practices for caching, minification, and API security.
 *  - app-frontend: (Simulated by serving static files) A simulated customer-facing application that allows users to pick items and pay, bypassing traditional POS.
 *  - app-harness: Provides boilerplate code, test data, and debugging utilities for the application.
 *
 * @author srbooysen
 * @dateUpdated 2025-04-28
 */

const express = require('express');
const path = require('path');
const app = express();

// Load environment variables from .env file
require('dotenv').config();

// Log the base URL from environment (if defined)
// console.log('Base URL from environment:', process.env.baseURL); // Corrected baseURl to baseURL

// WARNING: Disabling SSL certificate validation. This is insecure and should ONLY be used for local development or testing.
// Do NOT use this in a production environment.
if (process.env.NODE_ENV !== 'production') {
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
  console.warn(
    'SSL certificate validation is disabled. This is insecure and intended for development only.',
  );
}

// Initialize and launch the backend-for-frontend (BFF)
const BackendModule = require('./app-backend'); // Use const for module import
const backendInstance = new BackendModule(); // Instantiate the module
const router = backendInstance.getRouter(); // Get the router from the backend instance

// Determine the port for the Express server
const port =
  process.env.PORT || // Use uppercase PORT as is conventional
  (process.argv[2] ? parseInt(process.argv[2], 10) : null) || // Parse command line argument as integer
  3000; // Default port

// Serve static files for the frontend application
app.use('/', express.static(path.join(__dirname, 'app-frontend')));
// Serve static files for the test harness application
app.use('/harness', express.static(path.join(__dirname, 'app-harness')));

// Use the backend router for API routes
app.use('', router); // Mount the router at the root path, or specify a base path like '/api'

// Start the Express server
app.listen(port, () => {
  console.log(
    `***********************************************************************`,
  );
  console.log(
    `Smart Trolley Test Harness is running on http://localhost:${port}/`,
  );
  console.log(
    `***********************************************************************`,
  );
});

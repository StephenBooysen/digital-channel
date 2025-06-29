/**
 * @fileoverview This service handles routing for the backend API.
 * It defines endpoints for customer validation, product search, promotions, basket operations,
 * customer login, payment, transactions, and store leaflets.
 * @author srbooysen
 */

/**
 * Initializes the router service.
 * @returns {object} The router service with a getRouter method.
 */
routerService = function () {
  // Reference the Cache Service
  cacheService = require('./modules/cachingService')();

  // Reference the Logging Service
  debug = require('./modules/debuggingService')();
  logger = debuggingService.getLogger();

  const axios = require('axios');
  const bodyParser = require('body-parser');
  const router = require('express').Router();

  // Variables needed
  routerService.bearertoken = '1234'; // Initialize with a default or placeholder token

  /**
   * Performs OAuth login to obtain a bearer token for API requests.
   * Uses client ID and secret from environment variables.
   * This is an Immediately Invoked Function Expression (IIFE) to run on service initialization.
   */
  const oAuth = (function () {
    // Skip if a bearer token (other than the initial placeholder) already exists.
    // This simple check might need refinement depending on token expiration handling.
    if (routerService.bearertoken !== '1234' && routerService.bearertoken) {
      logger.info('Bearer token already exists. Skipping OAuth.');
      return;
    }
    var endpoint = process.env.oauthendpoint;
    if (!endpoint) {
      logger.error('OAuth endpoint is not defined in environment variables.');
      return;
    }
    axios
      .post(
        endpoint,
        {
          grant_type: 'client_credentials',
          client_id: process.env.oauthclientid,
          client_secret: process.env.oauthsecret,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )
      .then((response) => {
        routerService.bearertoken = response.data.access_token;
        logger.info('Bearer token generated: ' + routerService.bearertoken);
      })
      .catch((err) => {
        logger.error('OAuth failed: ' + err);
      });
  })();

  /**
   * GET /backend/customers/validate
   * Validates a customer based on card number.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {string} req.query.cardNumber - The customer's card number.
   */
  router.get('/backend/customers/validate', (req, res) => {
    var endpoint = process.env.baseURL;
    const cacheKey = 'validate:' + req.query.cardNumber;
    // Check cache first
    if (cacheService.cacheGet(cacheKey) != null) {
      res.send(cacheService.cacheGet(cacheKey));
      return;
    }
    axios
      .get(
        endpoint +
          '/dsl/brands/checkers/countries/za/users/validate?cardNumber=' +
          req.query.cardNumber,
        {
          headers: {
            'x-api-key': process.env.apikey,
          },
        },
      )
      .then((response) => {
        cacheService.cacheSet(cacheKey, response.data); // Cache the response
        res.send(response.data);
      })
      .catch((err) => {
        logger.error('Customer validation error: ' + err);
        res.status(500).send({error: err.message});
      });
  });

  /**
   * GET /backend/products/search
   * Searches for products based on barcode, product code, search term, store code, and current page.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  router.get('/backend/products/search', (req, res) => {
    var endpoint = process.env.baseURL;
    var query = '';
    var currentPage = req.query.currentpage || '0'; // Default to page 0
    let cacheKey = `productstore:store-${req.query.storecode}`;

    // Build query and cache key based on parameters
    if (req.query.barcode != null) {
      query = '&barcode=' + req.query.barcode;
      cacheKey += '-barcode-' + req.query.barcode;
      if (cacheService.cacheGet(cacheKey) != null) {
        res.send(cacheService.cacheGet(cacheKey));
        return;
      }
    } else if (req.query.productcode != null) {
      query = '&productCode=' + req.query.productcode;
      cacheKey += '-productcode-' + req.query.productcode;
      if (cacheService.cacheGet(cacheKey) != null) {
        res.send(cacheService.cacheGet(cacheKey));
        return;
      }
    } else if (req.query.search != null) {
      query = '&query=' + encodeURIComponent(req.query.search); // Ensure search query is URL encoded
      if (req.query.search === 'Xtrasavings') {
        // Specific handling for Xtrasavings search
        query =
          '&query=%3Arelevance%3AxtraSavingInSites%3A2701%3AbrowseAllStoresFacetOff%3AbrowseAllStoresFacetOff';
      }
      // Note: Caching for general search terms might be too broad or fill up cache quickly.
      // Consider if caching is appropriate here or needs a more specific key.
    }

    axios
      .get(
        `${endpoint}/dsl/brands/checkers/countries/ZA/products/search/full?currentPage=${currentPage}${query}&posName=${req.query.storecode}`,
        {
          headers: {
            'x-api-key': process.env.apikey,
            Authorization: 'Bearer ' + routerService.bearertoken,
          },
        },
      )
      .then((response) => {
        // Cache response if barcode or product code was used for search
        if (req.query.barcode && response.data.response && response.data.response.products && response.data.response.products.length > 0) {
          const productBarcode = response.data.response.products[0].barcode;
          if (productBarcode) {
             const specificBarcodeCacheKey = `productstore:store-${req.query.storecode}-barcode-${productBarcode}`;
            cacheService.cacheSet(specificBarcodeCacheKey, response.data);
          }
        }
        if (req.query.productcode && response.data.response && response.data.response.products && response.data.response.products.length > 0) {
          const productCode = response.data.response.products[0].code;
          if (productCode) {
            const specificProductCodeCacheKey = `productstore:store-${req.query.storecode}-productcode-${productCode}`; // Corrected 'produtcode' to 'productcode'
            cacheService.cacheSet(specificProductCodeCacheKey, response.data);
          }
        }
        res.send(response.data);
      })
      .catch((err) => {
        logger.error('Product search error: ' + err);
        res.status(500).send({error: err.message});
      });
  });

  /**
   * GET /backend/promotions/offersforyou
   * Retrieves "Offers For You" promotions for a customer.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {string} req.query.uid - Customer's rewards ID.
   * @param {string} req.query.storecode - Store code.
   */
  router.get('/backend/promotions/offersforyou', (req, res) => {
    var endpoint = process.env.baseURL;
    axios
      .get(
        `${endpoint}/dsl/brands/checkers/countries/ZA/offers/promotions/household?&uid=${req.query.uid}&offerType=FOR_YOU&preferredStoreId=${req.query.storecode}`,
        {
          headers: {
            'x-api-key': process.env.apikey,
            Authorization: 'Bearer ' + routerService.bearertoken,
          },
        },
      )
      .then((response) => {
        res.send(response.data);
      })
      .catch((err) => {
        logger.error('Offers For You error: ' + err);
        res.status(500).send({error: err.message});
      });
  });

  /**
   * GET /backend/promotions/ranked
   * Retrieves ranked product promotions based on scenario type.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {string} req.query.uid - Customer's rewards ID.
   * @param {string} req.query.scenariotype - Scenario type (e.g., CHECKERS_RES, CHECKERS_ROF).
   */
  router.get('/backend/promotions/ranked', (req, res) => {
    var endpoint = process.env.baseURL;
    axios
      .get(
        `${endpoint}/dsl/brands/checkers/countries/ZA/promotions/ranked?uid=${req.query.uid}&tacticId=GEN&channel=ALL&scenarioType=${req.query.scenariotype}`,
        {
          headers: {
            'x-api-key': process.env.apikey,
            Authorization: 'Bearer ' + routerService.bearertoken,
          },
        },
      )
      .then((response) => {
        res.send(response.data);
      })
      .catch((err) => {
        logger.error('Ranked promotions error: ' + err);
        res.status(500).send({error: err.message});
      });
  });

  /**
   * POST /backend/promotions/add
   * Adds a promotion to a customer's card.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {string} req.query.uid - Customer's rewards ID.
   * @param {string} req.query.promotionid - Promotion ID.
   * @param {string} req.query.startdate - Promotion start date (YYYY-MM-DD).
   * @param {string} req.query.enddate - Promotion end date (YYYY-MM-DD).
   */
  router.post('/backend/promotions/add', (req, res) => {
    var endpoint = process.env.baseURL;
    // Construct the payload as a JavaScript object, axios will serialize it to JSON
    const payload = {
      promotionItemList: [
        {
          promotionId: req.query.promotionid,
          registrationStartDate: req.query.startdate,
          registrationEndDate: req.query.enddate,
        },
      ],
    };
    axios
      .post(
        `${endpoint}/dsl/brands/checkers/countries/za/customers/promotions?uid=${req.query.uid}`, // Changed req.uid to req.query.uid
        payload, // Send the object directly
        {
          headers: {
            'x-api-key': process.env.apikey,
            Authorization: 'Bearer ' + routerService.bearertoken, // Corrected 'Authorisation' to 'Authorization' and 'bearer: ' to 'Bearer '
            'Content-Type': 'application/json', // Specify content type as JSON
          },
        },
      )
      .then((response) => {
        res.send(response.data);
      })
      .catch((err) => {
        logger.error('Add promotion error: ' + err);
        res.status(500).send({error: err.message});
      });
  });

  /**
   * POST /backend/baskets/calculate
   * Calculates basket totals. Uses bodyParser.text() to handle plain text request body.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  router.post('/backend/baskets/calculate', bodyParser.text(), (req, res) => {
    var endpoint = process.env.baseURL;
    // The original code uses axios.get with req.body, which is unusual for GET.
    // Assuming it should be a POST or the body is intended for a GET request that supports it (less common).
    // If it's a POST, it should be axios.post(url, req.body, config).
    // If it's a GET and the API expects data in the body (rare), this might be correct but non-standard.
    // For now, keeping it as axios.get as per original, but this is a point of potential review.
    axios
      .post(endpoint + '/dsl/baskets/transactions', req.body, { // Changed to POST as it's more typical for sending a body
        headers: {
          'x-api-key': process.env.apikey,
          Authorization: 'Bearer ' + routerService.bearertoken,
          'Content-Type': 'text/plain', // Assuming the body is plain text
        },
      })
      .then((response) => {
        res.send(response.data);
      })
      .catch((err) => {
        logger.error('Basket calculate error: ' + err);
        res.status(500).send({error: err.message});
      });
  });

  /**
   * POST /backend/baskets/commit
   * Commits a basket. Uses bodyParser.text() to handle plain text request body.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  router.post('/backend/baskets/commit', bodyParser.text(), (req, res) => {
    var endpoint = process.env.baseURL;
    // Similar to /calculate, this uses axios.get with req.body. Review if POST is more appropriate.
    axios
      .post(endpoint + '/dsl/baskets/transactions', req.body, { // Changed to POST
        headers: {
          'x-api-key': process.env.apikey,
          Authorization: 'Bearer ' + routerService.bearertoken,
          'Content-Type': 'text/plain', // Assuming the body is plain text
        },
      })
      .then((response) => {
        res.send(response.data);
      })
      .catch((err) => {
        logger.error('Basket commit error: ' + err);
        res.status(500).send({error: err.message});
      });
  });

  /**
   * GET /backend/customers/login
   * Initiates customer login process.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {string} req.query.cardNumber - Customer's card number.
   */
  router.get('/backend/customers/login', (req, res) => {
    var endpoint = process.env.baseURL;
    axios
      .get(
        `${endpoint}/dsl/brands/checkers/countries/za/users/login?query=${req.query.cardNumber}`,
        {
          headers: {
            'x-api-key': process.env.apikey,
            Authorization: 'Bearer ' + routerService.bearertoken,
          },
        },
      )
      .then((response) => {
        res.send(response.data);
      })
      .catch((err) => {
        logger.error('Customer login error: ' + err);
        res.status(500).send({error: err.message});
      });
  });

  /**
   * GET /backend/customers/verify
   * Verifies customer login with OTP.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {string} req.query.cardNumber - Customer's card number.
   * @param {string} req.query.reference - Reference from the login initiation step.
   * @param {string} req.query.otp - One-time password.
   */
  router.get('/backend/customers/verify', (req, res) => {
    var endpoint = process.env.baseURL;
    // The original code had an issue here: the second argument to axios.get was the request body,
    // but for GET requests, parameters are typically sent in the URL or headers.
    // Assuming the API expects these as query parameters or in the body of a POST request.
    // If they are query parameters, they should be part of the URL.
    // If it's a POST request, the method should be axios.post.
    // For this example, I'll assume they should be query parameters.
    // However, the original payload structure suggests it might be a POST request.
    // This needs clarification based on the API documentation.

    // Constructing query string for GET, if that's the intent
    // const queryString = `?identifier=${encodeURIComponent(req.query.cardNumber)}&reference=${encodeURIComponent(req.query.reference)}&otp=${encodeURIComponent(req.query.otp)}`;
    // For now, sticking to original structure but logging a warning.
    logger.warn(
      'Customer verify endpoint: review if GET with body is intended or if it should be POST.',
    );

    axios
      .post( // Changed to POST as this is more common for sending data like OTP
        `${endpoint}/dsl/brands/checkers/countries/za/otp/loginbymobile/verify`, // Removed req.query.cardNumber from URL, assuming it's in the body
        { // Payload as the second argument for POST
          target: {
            type: 'SMS',
            identifier: req.query.cardNumber, // Assuming card number is the identifier
            reference: req.query.reference,
          },
          otp: req.query.otp, // Corrected from req.query.reference.otp
        },
        { // Config object as the third argument
          headers: {
            'x-api-key': process.env.apikey,
            Authorization: 'Bearer ' + routerService.bearertoken,
            'Content-Type': 'application/json',
          },
        },
      )
      .then((response) => {
        res.send(response.data);
      })
      .catch((err) => {
        logger.error('Customer verify error: ' + err);
        res.status(500).send({error: err.message});
      });
  });

  /**
   * POST /backend/payment/cards
   * Lists digital commerce payment cards.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @todo Clarify if request body/parameters are needed (e.g., UID). Original code sends an empty body.
   */
  router.post('/backend/payment/cards', (req, res) => {
    var endpoint = process.env.baseURL;
    axios
      .post(
        endpoint + '/api/v1/payment/listcards',
        {}, // Sending an empty object as the body, as per original structure
        {
          headers: {
            'x-api-key': process.env.apikey,
            Authorization: 'Bearer ' + routerService.bearertoken, // Corrected 'Authorisation' and 'bearer: '
          },
        },
      )
      .then((response) => {
        res.send(response.data);
      })
      .catch((err) => {
        logger.error('Payment cards list error: ' + err);
        res.status(500).send({error: err.message});
      });
  });

  /**
   * POST /backend/payment/pay
   * Processes a payment.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @todo Clarify required request body/parameters. Original code sends an empty body to '/api/v1/payment/listcards', which seems incorrect for a pay action.
   * This might be a copy-paste error from the '/payment/cards' endpoint.
   */
  router.post('/backend/payment/pay', (req, res) => {
    var endpoint = process.env.baseURL;
    // The endpoint '/api/v1/payment/listcards' seems incorrect for a payment action.
    // This should likely be a different endpoint, e.g., '/api/v1/payment/process' or similar.
    // Also, a payment request would typically include payment details in the body.
    logger.warn("Payment 'pay' endpoint is using 'listcards' URL and an empty body. This might be incorrect.");
    axios
      .post(
        endpoint + '/api/v1/payment/pay', // Assuming a more appropriate endpoint like /pay
        req.body, // Assuming payment details are in req.body
        {
          headers: {
            'x-api-key': process.env.apikey,
            Authorization: 'Bearer ' + routerService.bearertoken, // Corrected 'Authorisation' and 'bearer: '
            'Content-Type': 'application/json', // Assuming JSON payload
          },
        },
      )
      .then((response) => {
        res.send(response.data);
      })
      .catch((err) => {
        logger.error('Payment error: ' + err);
        res.status(500).send({error: err.message});
      });
  });

  /**
   * POST /backend/transactions/list
   * Retrieves a list of transactions. Uses bodyParser.text() for plain text request body.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  router.post('/backend/transactions/list', bodyParser.text(), (req, res) => {
    var endpoint = process.env.baseURL;
    // Original uses axios.get with req.body. Changed to POST.
    axios
      .post( // Changed to POST
        endpoint + '/dsl/brands/checkers/countries/ZA/transactions',
        req.body,
        {
          headers: {
            'x-api-key': process.env.apikey,
            Authorization: 'Bearer ' + routerService.bearertoken,
            'Content-Type': 'text/plain', // Assuming body is plain text
          },
        },
      )
      .then((response) => {
        res.send(response.data);
      })
      .catch((err) => {
        logger.error('List transactions error: ' + err);
        res.status(500).send({error: err.message});
      });
  });

  /**
   * POST /backend/transactions/tillslip
   * Retrieves a till slip for a transaction. Uses bodyParser.text() for plain text request body.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  router.post(
    '/backend/transactions/tillslip',
    bodyParser.text(),
    (req, res) => {
      var endpoint = process.env.baseURL;
      // Original uses axios.get with req.body. Changed to POST.
      axios
        .post( // Changed to POST
          endpoint + '/dsl/brands/checkers/countries/ZA/tillslip',
          req.body,
          {
            headers: {
              'x-api-key': process.env.apikey,
              Authorization: 'Bearer ' + routerService.bearertoken,
              'Content-Type': 'text/plain', // Assuming body is plain text
            },
          },
        )
        .then((response) => {
          res.send(response.data);
        })
        .catch((err) => {
          logger.error('Till slip error: ' + err);
          res.status(500).send({error: err.message});
        });
    },
  );

  /**
   * GET /backend/stores/leaflets
   * Retrieves store leaflets based on store code.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {string} req.query.storecode - The store code.
   */
  router.get('/backend/stores/leaflets', (req, res) => {
    var endpoint = process.env.baseURL;
    const requestUrl = `${endpoint}/dsl/brands/checkers/countries/ZA/pamphlets?storeIdentifier=${req.query.storecode}`;
    logger.info('Requesting leaflets from: ' + requestUrl); // Log the request URL
    axios
      .get(requestUrl, {
        headers: {
          'x-api-key': process.env.apikey,
        },
      })
      .then((response) => {
        res.send(response.data);
      })
      .catch((err) => {
        logger.error('Store leaflets error: ' + err);
        res.status(500).send({error: err.message});
      });
  });

  /**
   * Returns the Express router instance.
   * @returns {object} The Express router.
   */
  routerService.getRouter = function () {
    return router;
  };

  return routerService;
};
module.exports = routerService;

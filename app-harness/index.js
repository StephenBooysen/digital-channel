/**
 * @fileoverview This file provides test harness functions for the Smart Trolley Application.
 * It includes functions for initializing different screens (Welcome, Login, Shopping, Checkout),
 * loading test data, debugging, and performance tracking (stopwatch).
 * @author srbooysen
 */

/**
 * Initializes the test harness module.
 * @returns {object} The harness module with various utility functions.
 */
harness = function () {
  /**
   * Initializes the Welcome screen in the test harness.
   * Sets the menu title, help text, and hides debug sections.
   */
  harness.initialiseWelcome = function () {
    $('#menutitle').html('Welcome Screen');
    $('#menuhelp').html(
      '<b>What do I do now?</b><br/>Click on the Shop Now button to start the process.', // Corrected "know" to "now"
    );
    $('#menuitems').html({}); // Clear menu items
    $('#debugbasketdetails').hide(); // Hide basket debug details
    $('#debugproductdetails').hide(); // Hide product debug details
  };

  /**
   * Initializes the Login screen in the test harness.
   * Sets the menu title and help text.
   */
  harness.initialiseLogin = function () {
    $('#menutitle').html('Login Screen');
    $('#menuhelp').html(
      '<b>What do I do now?</b><br/>This screen simulates the card scanning process. We have created a couple of positive and negative scenarios to test.<br/><br/>Click on the "Scan Card" button to simulate the action.', // Corrected "know" to "now"
    );
  };

  /**
   * Loads customer test scenarios for the Login screen.
   * Fetches customer data from 'customer.json', displays it, and generates barcodes.
   */
  harness.loadLoginData = function () {
    harness.setStopwatch('customer_test_data'); // Start stopwatch for loading data
    $.getJSON('/harness/data/customer.json', function (data) {
      var customers = [];
      $.each(data.customers, function (key, val) {
        // Create HTML for each customer scenario
        customers.push(
          `<a href="#" class="list-group-item list-group-item-action py-3 lh-tight" aria-current="true">
            <div class="d-flex w-100 align-items-center justify-content-between">
              <strong class="mb-1">${val.description}</strong>
              <small style="font-size:9px">${val.type}</small>
            </div>
            <div class="col-10 mb-1 small">${val.summary}</div>
            <a href="javascript:validateCustomer('${val.card}')" class="btn btn-outline-${val.type === 'NEGATIVE' ? 'danger' : 'secondary'}">Scan Card</a>
            <svg id="barcode_${val.card}"></svg>
          </a>`, // Simplified string concatenation and fixed missing closing tag for svg
        );
      });
      $('#menuitems').html(customers.join('')); // Join array to form HTML string

      // Generate barcodes for each customer card
      $.each(data.customers, function (key, val) {
        if (typeof JsBarcode === 'function') {
          JsBarcode(`#barcode_${val.card}`, val.card);
        } else {
          console.error('JsBarcode is not defined.');
        }
      });
      harness.debug(
        'Customer loaded for usecases',
        'info',
        'customer_test_data',
        data, // Pass original data for debugging if needed
      );
    });
  };

  /**
   * Initializes the Shopping screen in the test harness.
   * Sets the menu title, help text, and loads shopping data.
   */
  harness.initialiseShopping = function () {
    $('#menutitle').html('Shopping Screen');
    $('#menuhelp').html(
      '<b>What do I do now?</b><br/>This screen simulates the shopping process. We have created a couple of positive and negative scenarios to test.<br/><br/>Click on the "Scan Item" button to simulate the scan. Note that removing items can be triggered from the basket debugging screen on the left.', // Corrected "know" to "now"
    );
    harness.loadShoppingData(); // Load shopping related data
  };

  /**
   * Loads shopping test scenarios (products).
   * Fetches product data from 'products.json', displays placeholders,
   * then populates with actual product details and barcodes.
   */
  harness.loadShoppingData = function () {
    $('#menutitle').html('Shopping Screen'); // Ensure title is set
    $('#debugbasketdetails').show(); // Show basket debug details
    $('#debugproductdetails').show(); // Show product debug details

    $.getJSON('/harness/data/products.json', function (data) {
      var shoppingItems = [];

      // Build placeholder HTML for each product
      $.each(data.products, function (key, valProductBarcode) {
        // Use a more descriptive variable name for product barcode from products.json
        shoppingItems.push(
          `<div class="card flex-row testproduct" style="padding:10px">
            <img alt="Product image placeholder" src="" id="testproduct_img_${valProductBarcode}">
            <div class="card-body" style="height:75px;text-align: left;vertical-align: text-top;">
              <p class="card-text placeholder-glow" id="testproduct_name_${valProductBarcode}"></p>
            </div>
          </div>
          <a href="javascript:addToBasket('${valProductBarcode}')" class="btn btn-outline-secondary">Scan Item</a>
          <svg id="barcode_${valProductBarcode}"></svg>`,
        );
      });
      $('#menuitems').html(shoppingItems.join('')); // Join array to form HTML string

      // Populate product data and generate barcodes
      $.each(data.products, function (key, productBarcodeToLoad) {
        if (typeof JsBarcode === 'function') {
          JsBarcode(`#barcode_${productBarcodeToLoad}`, productBarcodeToLoad);
        } else {
          console.error('JsBarcode is not defined.');
        }
        harness.setStopwatch('test_products_' + productBarcodeToLoad);
        // Ensure 'store' and 'store.storecode' are defined and accessible here
        if (typeof store === 'undefined' || !store.storecode) {
          console.error(
            'Store information is not available for product search.',
          );
          harness.debug(
            `Error: Store code not available for product ${productBarcodeToLoad}`,
            'danger',
          );
          return; // Skip this product if store code is missing
        }
        $.get(
          `/backend/products/search?barcode=${productBarcodeToLoad}&storecode=${store.storecode}`,
        )
          .done((response) => {
            // Check if response and products exist
            if (
              response &&
              response.response &&
              response.response.products &&
              response.response.products.length > 0
            ) {
              $.each(response.response.products, function (key, productDetail) {
                $(`#testproduct_name_${productDetail.barcode}`).html(
                  productDetail.name,
                );
                // Ensure media and images exist before accessing
                if (
                  productDetail.media &&
                  productDetail.media.images &&
                  productDetail.media.images.length > 2 &&
                  productDetail.media.images[2].url
                ) {
                  $(`#testproduct_img_${productDetail.barcode}`).attr(
                    'src',
                    `https://prep.checkers.co.za${productDetail.media.images[2].url}`,
                  );
                } else {
                  // Fallback image or hide if not available
                  $(`#testproduct_img_${productDetail.barcode}`).attr(
                    'alt',
                    'Image not available',
                  );
                }
              });
            } else {
              harness.debug(
                `No product details found for ${productBarcodeToLoad}`,
                'warn',
              );
              $(`#testproduct_name_${productBarcodeToLoad}`).html(
                'Product details not found.',
              );
            }
            harness.debug(
              `Test Product Data Loaded for ${productBarcodeToLoad}`,
              'info',
              `test_products_${productBarcodeToLoad}`,
            );
          })
          .fail(function (jqXHR, textStatus, errorThrown) {
            harness.debug(
              `Error retrieving product data for ${productBarcodeToLoad}: ${textStatus}, ${errorThrown}`,
              'danger',
            );
            $(`#testproduct_name_${productBarcodeToLoad}`).html(
              'Error loading product.',
            );
          });
      });
    });
  };

  /**
   * Initializes the Checkout screen in the test harness.
   * Sets the screen HTML, menu title, help text, and hides basket debug details.
   * Populates the basket view.
   */
  harness.initialiseCheckout = function () {
    // Set the main screen content for checkout
    $('#screen').html(
      `<div class="container-960">
        <div class="central-box">
          <div class="middle-row" style="padding-left:10px">
            <div class="placeholder" style="width:660px;height:200px">Hero image placeholder</div>
          </div>
          <div class="bottom-row">
            <p class="lead mb-4" style="font-size:16px; margin-top: 10px;">Please enter the One time PIN sent to your mobile</p>
            <div class="container mt-5" id="checkoutContainer">
              <div class="keypad">
                <button class="btn">1</button><button class="btn">2</button><button class="btn">3</button><button class="btn">4</button>
                <button class="btn">5</button><button class="btn">6</button><button class="btn">7</button><button class="btn">8</button>
                <button class="btn">9</button><button class="btn">0</button>
              </div><br/>
              <button type="button" class="btn btn-outline-secondary" onclick="javascript:populatePaymentCards();">Retrieve My Sixty60 Cards</button>
            </div>
          </div>
        </div>
        <div class="right-box">
          <h6 style="margin-top:20px">Basket</h6>
          <div id="basketitems"></div>
        </div>
      </div>`, // Corrected "sent you your" to "sent to your"
    );
    $('#menutitle').html('Checkout Screen'); // Changed from 'Login Screen'
    $('#menuhelp').html(
      '<b>What do I do now?</b><br/>This screen simulates the process of verifying via OTP, selecting your tokenised card and paying.<br/> Note that should you not have a Sixty60 profile a composite barcode will appear.', // Corrected "know" to "now", "tokenised"
    );
    $('#menuitems').html({}); // Clear menu items
    $('#debugbasketdetails').hide(); // Hide basket debug details as it's part of the main view here
    // Ensure populateBasket is defined and available
    if (typeof populateBasket === 'function') {
      populateBasket(true); // Populate the basket view
    } else {
      console.error('populateBasket function is not defined.');
    }
  };

  /**
   * Updates the basket debugging view with current basket items.
   * @param {Array<string>} basket - An array of item identifiers in the basket.
   */
  harness.debugBasket = function (basket) {
    var basketItems = [];
    if (Array.isArray(basket)) {
      $.each(basket, function (key, val) {
        basketItems.push(
          `<div class="list-group">
            <button type="button" class="btn btn-outline-secondary" onclick="javascript:removeFromBasket('${val}')">Remove item: ${val}</button>
          </div>`, // Template literal for cleaner HTML
        );
      });
    }
    $('#debugbasketitems').html(basketItems.join('')); // Join array to form HTML string
  };

  /**
   * Updates the customer debugging view with customer details.
   * @param {object} customer - The customer object.
   * @param {string} customer.uid - Customer's unique ID.
   * @param {boolean} customer.hasSixty60 - Whether the customer has a Sixty60 profile.
   * @param {string} customer.cardno - Customer's card number.
   */
  harness.debugCustomer = function (customer) {
    if (customer && customer.uid != null) {
      $('#uid').html(
        `<span class="badge bg-success">${customer.uid}</span>`,
      );
      $('#hasSixty60').html(
        `<span class="badge bg-${customer.hasSixty60 === true ? 'success' : 'warning'}">${customer.hasSixty60}</span>`,
      );
      if (customer.hasSixty60 !== true) {
        harness.debug(
          `Customer does not have Sixty60: ${customer.cardno}<br/>`, // Corrected "sixty60" to "Sixty60"
          'warn',
        );
      }
    } else {
      $('#uid').html('<span class="badge bg-danger">Customer Not Found</span>');
      $('#hasSixty60').html(
        '<span class="badge bg-danger">Customer Not Found</span>',
      );
      // Check if customer object and cardno exist before trying to access cardno
      const cardNo = customer && customer.cardno ? customer.cardno : 'Unknown';
      harness.debug(`Customer not found for: ${cardNo}<br/>`, 'error');
    }
  };

  /**
   * Logs a debug message to the debugging table.
   * @param {string} message - The debug message.
   * @param {string} [type='info'] - The type of message (e.g., 'info', 'warn', 'error', 'success').
   * @param {string} [stopwatchName] - Optional name of a stopwatch to display elapsed time.
   * @param {object} [headers] - Optional headers object (currently unused in the function body but kept for signature compatibility).
   */
  harness.debug = function (message, type = 'info', stopwatchName, headers) {
    const elapsedTime = stopwatchName
      ? ` (${harness.getStopwatch(stopwatchName)})`
      : '';
    const cell1 = $(
      `<td><span class="badge bg-${type}">${type}</span>&nbsp;${message}${elapsedTime}</td>`,
    );
    // Ensure #debugging and tbody exist
    const debuggingTableBody = $('#debugging').find('tbody');
    if (debuggingTableBody.length) {
      debuggingTableBody.prepend($('<tr>').append(cell1));
    } else {
      console.warn('#debugging table body not found for logging.');
    }
  };

  /**
   * @property {Map<string, Date>} stopwatch - Stores start times for named stopwatches.
   */
  harness.stopwatch = new Map();

  /**
   * Sets the start time for a named stopwatch.
   * @param {string} name - The name of the stopwatch.
   */
  harness.setStopwatch = function (name) {
    if (typeof name === 'string' && name.trim() !== '') {
      harness.stopwatch.set(name, new Date());
    } else {
      console.error('Invalid stopwatch name provided.');
    }
  };

  /**
   * Gets the elapsed time for a named stopwatch and removes it.
   * If the stopwatch is not found, it returns '0 ms' and logs an error.
   * @param {string} name - The name of the stopwatch.
   * @returns {string} A string representation of the elapsed time in milliseconds (e.g., "123 ms").
   */
  harness.getStopwatch = function (name) {
    if (harness.stopwatch.has(name)) {
      const endTime = new Date();
      const startTime = harness.stopwatch.get(name);
      const timeDiff = endTime - startTime;
      harness.stopwatch.delete(name); // Remove stopwatch after use
      return `${timeDiff} ms`;
    } else {
      // console.warn(`Stopwatch with name '${name}' not found or already used.`);
      return '0 ms'; // Return a default value if stopwatch doesn't exist
    }
  };

  return harness;
};

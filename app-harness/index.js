/**
 * The following code is used to create all test harness functions e.g. displaying test data and tracking performance etc
 * 
 * 
 * author :srbooysen
 */
harness = (function () {

  /**
  * Load the layout for the Welcome screen
  */
  harness.initialiseWelcome = function () {
    $('#menutitle').html('Welcome Screen')
    $('#menuhelp').html('<b>What do I do know?</b><br/>Click on the Shop Now button to start the process.')
    $('#menuitems').html({});
    $('#debugbasketdetails').hide();
    $('#debugproductdetails').hide(); 
   }

  /**
  * Load the layout for the Login screen
  */
  harness.initialiseLogin = function () {
    $('#menutitle').html('Login Screen')
    $('#menuhelp').html('<b>What do I do know?</b><br/>This screen simulates the card scanning process. We have created a couple of positive and negative scenarios to test<br/><br/>Click on the "Scan Card" button to simulate the action. ')
  }

  /**
   * Load customer test scenarios
   * Read the customer static data from the test data folder and show it in test data area
   */
  harness.loadLoginData = function () {
    harness.setStopwatch('customer_test_data')
    $.getJSON("/harness/data/customer.json", function (data) {
      var customers = [];
      $.each(data.customers, function (key, val) {
        customers.push('<a href="#" class="list-group-item list-group-item-action py-3 lh-tight" aria-current="true"><div class="d-flex w-100 align-items-center justify-content-between"><strong class="mb-1">' + val.description + '</strong> <small style="font-size:9px">' + val.type + '</small></div><div class="col-10 mb-1 small">' + val.summary + '</div><a href="javascript:validateCustomer(\'' + val.card + '\')" class="btn btn-outline-' + (val.type == "NEGATIVE" ? "danger" : "secondary") + '">Scan Card</a><svg id="barcode_' + val.card + '"></div></a>')
      });
      $('#menuitems').html(customers);
      $.each(data.customers, function (key, val) {
        JsBarcode("#barcode_" + val.card, val.card);
      });
      harness.debug('Customer loaded for usecases', 'info', 'customer_test_data', data)
    });
  }

  /**
    * Load the layout for the Shopping screen

  */
  harness.initialiseShopping = function () {
    $('#menutitle').html('Shopping Screen')
    $('#menuhelp').html('<b>What do I do know?</b><br/>This screen simulates the shopping process. We have created a couple of positive and negative scenarios to test<br/><br/>Click on the "Scan Item" button to simulate the scan. Note that removing items can be triggered from the basket debugging screen on the left. ')
    harness.loadShoppingData();
  }

  /**
  * Load the shopping test scenarios
  * Read the product static data from the test data folder and show it in test data area
  */
  harness.loadShoppingData = function () {
    $('#menutitle').html('Shopping Screen')
    $('#debugbasketdetails').show();
    $('#debugproductdetails').show();
    $.getJSON("/harness/data/products.json", function (data) {
      var shoppingItems = [];

      // Build the place holder data
      $.each(data.products, function (key, val) {
        shoppingItems.push('\
          <div class="card flex-row testproduct" style="padding:10px">\
            <img alt="..." src="" id="testproduct_img_' + val + '">\
            <div class="card-body" style="height:75px;text-align: left;vertical-align: text-top;">\
              <p class="card-text placeholder-glow" id="testproduct_name_' + val + '">\
              </p>\
            </div>\
          </div>\
          <a href="javascript:addToBasket(\'' + val + '\')" class="btn btn-outline-secondary">Scan Item</a><svg id="barcode_' + val + '">');
      });
      $('#menuitems').html(shoppingItems);

      // Populate the data
      $.each(data.products, function (key, val) {
        JsBarcode('#barcode_' + val, val);
        harness.setStopwatch('test_products_' + val);
        $.get("/backend/products/search?barcode=" + val + "&storecode=" + store.storecode)
          .then(response => {
            $.each(response.response.products, function (key, val) {
              $('#testproduct_name_' + val.barcode).html(val.name);
              $('#testproduct_img_' + val.barcode).attr('src', "https://prep.checkers.co.za" + val.media.images[2].url)
            });
            harness.debug('Test Product Data Loaded for ' + val, 'info', 'test_products_' + val)
          }).fail(function (error) {
            harness.debug("Error retrieving product data " + val + "<br/>", 'danger');
          });
      });
    });
  }

  /**
   * Load the layout for the payment screen
   */
  harness.initialiseCheckout = function () {
    $('#screen').html('\
      <div class="container-960">\
      <div class="central-box">\
        <div class="middle-row" style="padding-left:10px"><div class="placeholder" style="width:660px;height:200px">Hero image placeholder</div></div>\
        <div class="bottom-row">\
          <p class="lead mb-4" style="font-size:16px; margin-top: 10px;">Please enter the One time PIN sent you your mobile</p>\
            <div class="container mt-5" id="checkoutContainer">\
              <div class="keypad"><button class="btn">1</button><button class="btn">2</button><button class="btn">3</button><button class="btn">4</button>\
                  <button class="btn">5</button><button class="btn">6</button><button class="btn">7</button><button class="btn">8</button><button class="btn">9</button><button class="btn">0</button>\
                  </div><br\>\
                <button type="button" class="btn btn-outline-secondary" onclick="javascript:populatePaymentCards();">Retrieve My Sixty60 Cards</button>\
            </div>\
        </div>\
      </div>\
      <div class="right-box"> <h6 style="margin-top:20px">Basket</h6><div id="basketitems"></div></div>\
    </div>');
    $('#menutitle').html('Login Screen')
    $('#menuhelp').html('<b>What do I do know?</b><br/>This screen simulates the process of verifying via OTP, selecting you tokenised card and paying.<br/> Note that should you not have a Sixty60 profile a compisite barcode will appear. ')
    $('#menuitems').html({});
    $('#debugbasketdetails').hide();
    populateBasket(true);
  }

  /**
   * Update the basket view
   * @param {*} basket 
   */
  harness.debugBasket = function (basket) {
    var basketItems = []
    $.each(basket, function (key, val) {
      basketItems.push('<div class="list-group">\<button type="button" class="btn btn-outline-secondary" onclick="javascript:removeFromBasket(\'' + val + '\')"> Remove item: ' + val + '</button></div>')
    });
    $('#debugbasketitems').html(basketItems);
  }

  /**
   * Update the Debug Customer 
   * @param {*} customer 
   */
  harness.debugCustomer = function (customer) {
    if (customer.uid != null) {
      $('#uid').html('<span class="badge bg-success">' + customer.uid + '</span>');
      $('#hasSixty60').html('<span class="badge bg-' + (customer.hasSixty60 == true ? "success" : "warning") + '">' + customer.hasSixty60 + '</span>');
      if (customer.hasSixty60 != true) {
        harness.debug("Customer does not have sixty60: " + customer.cardno + "<br/>", 'warn');
      }
    } else {
      $('#uid').html('<span class="badge bg-danger">Customer Not Found</span>');
      $('#hasSixty60').html('<span class="badge bg-danger">Customer Not Found</span>');
      harness.debug("Customer not found for: " + customer.cardno + "<br/>", 'error');
    }
  }

  /**
   * Debugging debug function
   * @param {string} message 
   * @param {string} type 
   * @param {string} stopwatchName (not required)
   * @param {object} headers the header object to get
   */
  harness.debug = function (message, type = 'info', stopwatchName, headers) {
    const cell1 = $('<td>').html('<span class="badge bg-' + type + '">' + type + '</span>&nbsp;' + message + (stopwatchName != null ? ' (' + harness.getStopwatch(stopwatchName) + ')' : ''));
    $('#debugging').find('tbody').prepend($('<tr>').append(cell1));
  }

  /**
   * Test harness stopwatch feature
   * @methods 
   *  - setStopwatch : Set the start time in the stopwatch
   *  - getStopwatch : return a string representation of the difference between the start end dates
   */
  harness.stopwatch = new Map();

  /**
   * @method setStopwatch : Set the start time in the stopwatch
   * @param {@} name 
   * @returns 
   */
  harness.setStopwatch = function (name) {
    harness.stopwatch.set(name, new Date());
  }

  /**
   * @method getStopwatch : return a string representation of the difference between the start end dates
   * @param {@} name 
   * @returns 
   */
  harness.getStopwatch = function (name) {
    var endTime = new Date();
    var startTime = new Date();
    if (harness.stopwatch.has(name)) {
      startTime = harness.stopwatch.get(name);
    }
    var timeDiff = endTime - startTime;
    harness.stopwatch.delete(name);
    return timeDiff + " ms"
  }

  return harness;
});


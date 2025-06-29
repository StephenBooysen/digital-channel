/**
 * @fileoverview This file simulates the functions required for the in-store Smart Trolley Application frontend.
 * It handles the initialization of different screens like welcome, login, shopping, and leaflets.
 * @author srbooysen
 */

/**
 * Initializes the main application module for the frontend.
 * @returns {object} The application module with methods to initialize different screens.
 */
app = function () {
  /**
   * Loads the welcome screen into the main screen area.
   * Fetches 'welcome.html' and initializes harness functions for welcome.
   */
  app.initialiseWelcome = function () {
    fetch('/resources/welcome.html')
      .then((res) => res.text())
      .then((text) => {
        $('#screen').html(text); // Inject welcome screen HTML
        harness.initialiseWelcome(); // Call harness function for welcome screen
      })
      .catch((e) => console.error('Error initializing welcome screen:', e));
  };

  /**
   * Loads the login screen into the main screen area.
   * Fetches 'login.html' and initializes harness functions for login.
   */
  app.initialiseLogin = function () {
    fetch('/resources/login.html')
      .then((res) => res.text())
      .then((text) => {
        $('#screen').html(text); // Inject login screen HTML
        harness.initialiseLogin(); // Call harness function for login screen
        harness.loadLoginData(); // Load login related data via harness
      })
      .catch((e) => console.error('Error initializing login screen:', e));
  };

  /**
   * Loads the shopping screen into the main screen area.
   * Fetches 'shopping.html', sets up event listeners for search and scroll,
   * and initializes harness functions for shopping.
   */
  app.initialiseShopping = function () {
    fetch('/resources/shopping.html')
      .then((res) => res.text())
      .then((text) => {
        $('#screen').html(text); // Inject shopping screen HTML

        // Add event listener for 'Enter' key on search input
        const searchInput = document.getElementById('searchQueryInput');
        if (searchInput) {
          searchInput.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
              event.preventDefault();
              const searchSubmitButton =
                document.getElementById('searchQuerySubmit');
              if (searchSubmitButton) {
                searchSubmitButton.click();
              }
            }
          });
        }

        // Add scroll handler for infinite scrolling or similar functionality
        const bottomRow = document.getElementById('bottomrow');
        if (bottomRow) {
          const scrollHandler = () => {
            const searchProductContainer = document.getElementById(
              'searchproductcontainer',
            );
            if (
              searchProductContainer &&
              bottomRow.scrollTop + bottomRow.offsetHeight + 100 >
                searchProductContainer.offsetHeight
            ) {
              console.log('Approaching bottom of scroll, potential load more.');
              // Implement load more data logic here if needed
            }
          };
          bottomRow.addEventListener('scroll', scrollHandler);
        }

        harness.initialiseShopping(); // Call harness function for shopping screen
        harness.loadShoppingData(); // Load shopping related data via harness
      })
      .catch((e) => console.error('Error initializing shopping screen:', e));
  };

  /**
   * Loads the leaflets screen into the main screen area.
   * Fetches 'leaflets.html' and calls a function to populate leaflets.
   */
  app.initialisLeaflets = function () {
    fetch('/resources/leaflets.html')
      .then((res) => res.text())
      .then((text) => {
        $('#screen').html(text); // Inject leaflets screen HTML
        // Ensure populateLeaflets is defined and available in the global scope or imported
        if (typeof populateLeaflets === 'function') {
          populateLeaflets();
        } else {
          console.error('populateLeaflets function is not defined.');
        }
      })
      .catch((e) => console.error('Error initializing leaflets screen:', e));
  };

  return app;
};

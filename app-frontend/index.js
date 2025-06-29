/**
 * The following code file simulates the functions required for the in store application for the Smart Trolley Application
 * Its purpose is to simulate the functionality of the instore trolley application
 * 
 * 
 * author :srbooysen
 */
app = (function () {

    /**
     * Load the welcome screen in the app
     */
    app.initialiseWelcome = function () {
        fetch("/resources/welcome.html")
            .then((res) => res.text())
            .then((text) => {
                $('#screen').html(text);
                harness.initialiseWelcome();
            })
            .catch((e) => console.error(e));
    }

    /**
     * Load the layout for the login screen
     */
    app.initialiseLogin = function () {
        fetch("/resources/login.html")
            .then((res) => res.text())
            .then((text) => {
                $('#screen').html(text);
                harness.initialiseLogin();
                harness.loadLoginData();
            })
            .catch((e) => console.error(e));
    }

    /**
     * Load the layout for the Shopping screen
     */
    app.initialiseShopping = function () {
        fetch("/resources/shopping.html")
            .then((res) => res.text())
            .then((text) => {
                $('#screen').html(text);
                document.getElementById("searchQueryInput").addEventListener("keypress", function (event) {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        document.getElementById("searchQuerySubmit").click();
                    }
                });
                const scrollHandler = () => {
                    if (document.getElementById("bottomrow").scrollTop + document.getElementById("bottomrow").offsetHeight + 100 > document.getElementById("searchproductcontainer").offsetHeight) {
                        console.log('scrolling')
                    }
                }
                document.getElementById("bottomrow").addEventListener("scroll", scrollHandler);
                harness.initialiseShopping();
                harness.loadShoppingData();
                
            })
            .catch((e) => console.error(e));
    }

    /**
     * Load the layout for the Leaflets screen
     */
    app.initialisLeaflets = function () {
        fetch("/resources/leaflets.html")
            .then((res) => res.text())
            .then((text) => {
                $('#screen').html(text);
                populateLeaflets();
            })
            .catch((e) => console.error(e));
    }

    return app;
});

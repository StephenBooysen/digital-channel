
/**
* The following code enables some basic caching objects
* 
* @method cacheSet: Set a cache value
* @method cacheGet: Retrieve a cache value
* 
* author :srbooysen
*/
routerService = (function () {

    // Reference the Cache Service
    cacheService = require("./modules/cachingService")();

    // Reference the Logging Service
    debug = require("./modules/debuggingService")();
    logger = debuggingService.getLogger();

    const axios = require('axios');
    const bodyParser = require('body-parser');
    const router = require('express').Router();

    // Variables needed
    routerService.bearertoken = ""

    /**
     * Do the oauth login to use for bearer requests
     * Parameters
     *  - Client_id :  Environment
     *  - Client_secret: Environment
     */
    const oAuth = (function () {
        if (routerService.bearertoken != ""){
            return;
        }
        var endpoint = process.env.oauthendpoint;
        axios.post(endpoint,
            {
                'grant_type': 'client_credentials',
                'client_id': process.env.oauthclientid,
                'client_secret': process.env.oauthsecret
            },
            {
                headers:
                {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then(response => {
                routerService.bearertoken = response.data.access_token;
                console.log("Bearer token generated: " + routerService.bearertoken);
            }).catch((err) => {
                console.error(err)
            });
    })();

    /**
     * Customer Validate Endpoint
     * Parameters
     *  - cardNumber (Request) : This field contains the card number we want to validate e.g. 9710084009641420
     */
    router.get('/backend/customers/validate', (req, res) => {
        var endpoint = process.env.baseURL;
        if (cacheService.cacheGet("validate:" + req.query.cardNumber) != null) {
            res.send(cacheService.cacheGet("validate:" + req.query.cardNumber));
            return;
        }
        axios.get(endpoint + "/dsl/brands/checkers/countries/za/users/validate?cardNumber=" + req.query.cardNumber,
            {
                headers:
                {
                    "x-api-key": process.env.apikey
                }
            }).then(response => {
                cacheService.cacheSet("validate:" + req.query.cardNumber, response.data)
                res.send(response.data);
            }).catch((err) => {
                res.status(500)
                res.send({ error: err })
            });
    });

    /**
     * Product Search
     * Request parameters
     *  - barcode : This field contains the barcode we are searching for e.g. ::mainBarcode:836206000663
     *  - productCode : This field contains the productcode we are searching for e.g. ::productCode:10126789EA
     *  - search : This field contains the barcode we are searching for e.g. Milk
     *  - storecode : This field contains the store code that the pricess must relate to e.g. 2701
     *  - current
    * */
    router.get('/backend/products/search', (req, res) => {
        var endpoint = process.env.baseURL;
        var query = "";
        var currentPage = "0";
        if (req.query.barcode != null) {
            query = "&barcode=" + req.query.barcode
            if (cacheService.cacheGet("productstore:store-" + req.query.storecode + "-barcode-" + req.query.barcode) != null) {
                res.send(cacheService.cacheGet("productstore:store-" + req.query.storecode + "-barcode-" + req.query.barcode));
                return;
            }
        }
        if (req.query.productcode != null) {
            query = "&productCode=" + req.query.productcode
            if (cacheService.cacheGet("productstore:store-" + req.query.storecode + "-productcode-" + req.query.productcode) != null) {
                res.send(cacheService.cacheGet("productstore:store-" + req.query.storecode + "-productcode-" + req.query.productcode));
                return;
            }
        }
        if (req.query.search != null) {
            query = "&query=" + req.query.search
        }
        if (req.query.search == "Xtrasavings") {
            query = "&query=%3Arelevance%3AxtraSavingInSites%3A2701%3AbrowseAllStoresFacetOff%3AbrowseAllStoresFacetOff"
        }
        if (req.query.currentpage != null) {
            currentPage = req.query.currentpage
        }
        axios.get(endpoint + "/dsl/brands/checkers/countries/ZA/products/search/full?currentPage=" + currentPage + query + "&posName=" + req.query.storecode,
            {
                headers:
                {
                    "x-api-key": process.env.apikey,
                    "Authorization": "Bearer " +  routerService.bearertoken
                }
            }).then(response => {
                if (response.data.response.products[0].barcode != null) {
                    cacheService.cacheSet("productstore:store-" + req.query.storecode + "-barcode-" + response.data.response.products[0].barcode, response.data)
                }
                if (response.data.response.products[0].code != null) {
                    cacheService.cacheSet("productstore:store-" + req.query.storecode + "-produtcode-" + response.data.response.products[0].code, response.data)
                }
                res.send(response.data);
            }).catch((err) => {
                res.status(500)
                res.send({ error: err })
            });
    });

    /**
     * Offers For You
     * Request parameters
     *  - uid : This field contains the customers rewards id for e.g. 00001MC6
     *  - storecode : This field contains the store code that the pricess must relate to e.g. 2701
     * */
    router.get('/backend/promotions/offersforyou', (req, res) => {
        var endpoint = process.env.baseURL;
        axios.get(endpoint + "/dsl/brands/checkers/countries/ZA/offers/promotions/household?&uid=" + req.query.uid + "&offerType=FOR_YOU&preferredStoreId=" + req.query.storecode,
            {
                headers:
                {
                    "x-api-key": process.env.apikey,
                    "Authorization": "Bearer " + routerService.bearertoken
                }
            }).then(response => {
                res.send(response.data);
            }).catch((err) => {
                res.status(500)
                res.send({ error: err })
            });
    });

    /**
     * Product Promotions
     * Request parameters
     *  - uid : This field contains the customers rewards id for e.g. 00001MC6
      * - scenarioType : This field contains the scenario we need to get data for the values are the following
      *   - CHECKERS_RES : Xtrasavings promotions
      *   - CHECKERS_ROF : Relevant Promotion
      *   - CHECKERS_PER : Personalised Promotion
      *   - CHECKERS_RD : Relevant Deals
      *  The TacticId and Channel should be left with their default values
    * */
    router.get('/backend/promotions/ranked', (req, res) => {
        var endpoint = process.env.baseURL;
        axios.get(endpoint + "/dsl/brands/checkers/countries/ZA/promotions/ranked?uid=" + req.query.uid + "&tacticId=GEN&channel=ALL&scenarioType=" + req.query.scenariotype,
            {
                headers:
                {
                    "x-api-key": process.env.apikey,
                    "Authorization": "Bearer " + routerService.bearertoken
                }
            }).then(response => {
                res.send(response.data);
            }).catch((err) => {
                res.status(500)
                res.send({ error: err })
            });
    });

    /**
     * Customer Add Promo to card
    * Request parameters
    *  - uid : This field should contain the customers rewardsid e.g. 00001MC6 
    *  - promotionid: This field should contain the promotion id to be used e.g. 200939716
    *  - startdate: This field should contain a date in the format "YYYY-MM-dd" e.g. 2020-03-07
    *  - enddate: This field should contain a date in the format "YYYY-MM-dd" e.g. 2020-03-07
    */
    router.post('/backend/promotions/add', (req, res) => {
        var endpoint = process.env.baseURL;
        axios.post(endpoint + "/dsl/brands/checkers/countries/za/customers/promotions?uid=" + req.uid,
            {
                body: '{\
                    "promotionItemList": [\
                        {\
                        "promotionId": "' + req.query.promotionid + '",\
                        "registrationStartDate": "' + req.query.startdate + '",\
                        "registrationEndDate": "' + req.query.enddate + '"\
                        }\
                    ]\
                    }'
            },
            {
                headers:
                {
                    "x-api-key": process.env.apikey,
                    "Authorisation": "bearer: " + routerService.bearertoken
                }
            }).then(response => {
                res.send(response.data);
            }).catch((err) => {
                res.status(500)
                res.send({ error: err })
            });
    });

    /**
     * Basket Calculate and commit
     * Path parameters
     *  - storecode : This field contains the store code e.g. 2701
    * */
    router.post('/backend/baskets/calculate', bodyParser.text(), (req, res) => {
        var endpoint = process.env.baseURL;
        axios.get(endpoint + "/dsl/baskets/transactions",
            req.body,
            {
                headers:
                {
                    "x-api-key": process.env.apikey,
                    "Authorization": "Bearer " + routerService.bearertoken
                }
            }).then(response => {
                res.send(response.data);
            }).catch((err) => {
                res.status(500)
                res.send({ error: err })
            });
    });

    /**
     * Basket Calculate and commit
     * Path parameters
     *  - storecode : This field contains the store code e.g. 2701
    * */
    router.post('/backend/baskets/commit', bodyParser.text(), (req, res) => {
        var endpoint = process.env.baseURL;
        axios.get(endpoint + "/dsl/baskets/transactions",
            req.body,
            {
                headers:
                {
                    "x-api-key": process.env.apikey,
                    "Authorization": "Bearer " + routerService.bearertoken
                }
            }).then(response => {
                res.send(response.data);
            }).catch((err) => {
                res.status(500)
                res.send({ error: err })
            });
    });

    /**
     * Customer login Endpoint
     * Request parameters
     *  - cardNumber : This field contains the card number we want to validate e.g. 9710084009641420
     */
    router.get('/backend/customers/login', (req, res) => {
        var endpoint = process.env.baseURL;
        axios.get(endpoint + "/dsl/brands/checkers/countries/za/users/login?query=" + req.query.cardNumber,
            {
                headers:
                {
                    "x-api-key": process.env.apikey,
                    "Authorization": "Bearer " + routerService.bearertoken
                }
            }).then(response => {
                res.send(response.data);
            }).catch((err) => {
                res.status(500)
                res.send({ error: err })
            });
    });

    /**
     * Customer login Verify
     * Request parameters
     *  - cardNumber : This field contains the card number we want to validate e.g. 9710084009641420
      * - reference : This field contains the reference that was returned from the login e.g. c2808010-b26e-400f-a621-83a0dc4e7e4d
      * - otp : This field contains otp that was sent to the customers mobile phone e.g. 6251
      * Response parameters 
      *  - accessToken: This contains the bearer token to be passed with subsequent api calls e.g.szyf96ezgu3wmfxh
      * */
    router.get('/backend/customers/verify', (req, res) => {
        var endpoint = process.env.baseURL;
        axios.get(endpoint + "/dsl/brands/checkers/countries/za/otp/loginbymobile/verify" + req.query.cardNumber,
            {
                "target": {
                    "type": "SMS",
                    "identifier": req.query.cardNumber,
                    "reference": req.query.reference
                },
                "otp": req.query.reference.otp
            },
            {
                headers:
                {
                    "x-api-key": process.env.apikey,
                    "Authorization": "Bearer " + routerService.bearertoken
                }
            }).then(response => {
                res.send(response.data);
            }).catch((err) => {
                res.status(500)
                res.send({ error: err })
            });
    });

    /**
     * Digital Commerce Payment Cards
    * Request parameters
     *  - uid : This field should contain the customers rewardsid e.g. 00001MC6 
     *  - promotionid: This field should contain the promotion id to be used e.g. 200939716
     *  - startdate: This field should contain a date in the format "YYYY-MM-dd" e.g. 2020-03-07
     *  - enddate: This field should contain a date in the format "YYYY-MM-dd" e.g. 2020-03-07
     */
    router.post('/backend/payment/cards', (req, res) => {
        var endpoint = process.env.baseURL;
        axios.post(endpoint + "/api/v1/payment/listcards",
            {
                headers:
                {
                    "x-api-key": process.env.apikey,
                    "Authorisation": "bearer: " + routerService.bearertoken
                }
            }).then(response => {
                res.send(response.data);
            }).catch((err) => {
                res.status(500)
                res.send({ error: err })
            });
    });

    /**
     * Payment
     * Request parameters
     *  - uid : This field should contain the customers rewardsid e.g. 00001MC6 
     *  - promotionid: This field should contain the promotion id to be used e.g. 200939716
     *  - startdate: This field should contain a date in the format "YYYY-MM-dd" e.g. 2020-03-07
     *  - enddate: This field should contain a date in the format "YYYY-MM-dd" e.g. 2020-03-07
     */
    router.post('/backend/payment/pay', (req, res) => {
        var endpoint = process.env.baseURL;
        axios.post(endpoint + "/api/v1/payment/listcards",
            {
                headers:
                {
                    "x-api-key": process.env.apikey,
                    "Authorisation": "bearer: " + routerService.bearertoken
                }
            }).then(response => {
                res.send(response.data);
            }).catch((err) => {
                res.status(500)
                res.send({ error: err })
            });
    });

    /**
     * Retrieve Transactions
    * */
    router.post('/backend/transactions/list', bodyParser.text(), (req, res) => {
        var endpoint = process.env.baseURL;
        axios.get(endpoint + "/dsl/brands/checkers/countries/ZA/transactions",
            req.body,
            {
                headers:
                {
                    "x-api-key": process.env.apikey,
                    "Authorization": "Bearer " + routerService.bearertoken
                }
            }).then(response => {
                res.send(response.data);
            }).catch((err) => {
                res.status(500)
                res.send({ error: err })
            });
    });

    /**
     * Retrieve Till Slips
    * */
    router.post('/backend/transactions/tillslip', bodyParser.text(), (req, res) => {
        var endpoint = process.env.baseURL;
        axios.get(endpoint + "/dsl/brands/checkers/countries/ZA/tillslip",
            req.body,
            {
                headers:
                {
                    "x-api-key": process.env.apikey,
                    "Authorization": "Bearer " + routerService.bearertoken
                }
            }).then(response => {
                res.send(response.data);
            }).catch((err) => {
                res.status(500)
                res.send({ error: err })
            });
    });

    /**
     * Store Leaflets
     * Path parameters
     *  - storecode : This field contains the store code e.g. 2701
    * */
    router.get('/backend/stores/leaflets', (req, res) => {
        var endpoint = process.env.baseURL;
        console.log(endpoint + "/dsl/brands/checkers/countries/ZA/pamphlets?storeIdentifier=" + req.query.storecode);
        axios.get(endpoint + "/dsl/brands/checkers/countries/ZA/pamphlets?storeIdentifier=" + req.query.storecode,
            {
                headers:
                {
                    "x-api-key": process.env.apikey
                }
            }).then(response => {
                res.send(response.data);
            }).catch((err) => {
                res.status(500)
                res.send({ error: err })
            });
    });

    /**
     * Get the Router to be added to the service
     * @returns the axious
     */
    routerService.getRouter = function () {
        return router;
    }

    return routerService
})
module.exports = routerService;
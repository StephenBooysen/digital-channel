# Work Smart Trolley

## Overview

The Work Smart Trolley project is a full-stack application designed to simulate an in-store smart trolley system, likely for a retail environment like Shoprite/Checkers. It features a backend that interfaces with external retail APIs and a frontend that represents the user interface a customer would interact with on the trolley.

The backend handles various retail operations, including:
*   Customer validation and login (with OTP)
*   Product search and information retrieval
*   Accessing customer-specific promotions and general offers
*   Adding selected promotions to a customer's account
*   Basket management (calculation, commitment)
*   Payment processing
*   Transaction history and digital receipts (till slips)
*   Viewing store leaflets

The frontend provides a user interface for these functions, with distinct screens for welcoming users, login, shopping, and viewing leaflets.

## External API Connectivity

The backend of the Work Smart Trolley application relies on external APIs to provide its core functionalities. These are primarily the Shoprite Group Digital Services (DSL) and its associated OAuth service for authentication.

### 1. Shoprite Group Digital Services (DSL)

*   **Purpose:** This is the main suite of APIs providing comprehensive retail functionalities. The application interacts with various DSL endpoints to:
    *   Validate customer identity using card numbers.
    *   Search for products by barcode, product code, or general search terms.
    *   Retrieve personalized promotions ("Offers For You") and other ranked promotional offers.
    *   Add selected promotions to a customer's account.
    *   Calculate the cost of items in the trolley's basket and commit the basket for payment.
    *   Manage customer login sessions, including OTP verification.
    *   List available payment cards and process payments.
    *   Fetch transaction histories and digital till slips.
    *   Display store-specific leaflets and pamphlets.
*   **Base URL:** Configured via the `baseURL` environment variable.
*   **Authentication:**
    *   **API Key:** Most DSL endpoints require an API key, which is passed in the `x-api-key` header. This key is configured via the `apikey` environment variable.
    *   **OAuth 2.0 Bearer Token:** Certain DSL endpoints require a Bearer Token for authorization. This token is obtained from a dedicated OAuth service (see below).

### 2. OAuth Service (for DSL Authentication)

*   **Purpose:** This service is used to authenticate the application itself (using a client credentials grant) and obtain an OAuth 2.0 Bearer Token. This token is then used to authorize requests to specific DSL API endpoints.
*   **Endpoint:** Configured via the `oauthendpoint` environment variable.
*   **Authentication:** The application authenticates with this service using:
    *   **Client ID:** Configured via the `oauthclientid` environment variable.
    *   **Client Secret:** Configured via the `oauthsecret` environment variable.

All sensitive information, including API base URLs, API keys, and OAuth credentials, is managed through environment variables and should be configured in a `.env` file at the root of the project.

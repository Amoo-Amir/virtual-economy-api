const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "Virtual Economy Wallet API",
      version: "1.0.0",
      description:
        "REST API for a virtual game economy, including wallets, inventory, transactions and a player marketplace. This API does not handle real money.",
    },

    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
    ],

    tags: [
      { name: "Health", description: "API and database health" },
      { name: "Authentication", description: "User authentication" },
      { name: "Wallet", description: "Virtual wallet operations" },
      { name: "Transactions", description: "Wallet transaction history" },
      { name: "Items", description: "Available game items" },
      { name: "Inventory", description: "Player inventory" },
      { name: "Market", description: "Player-to-player marketplace" },
    ],

    security: [
      {
        bearerAuth: [],
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT access token.",
        },
      },

      schemas: {
        Error: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "error",
            },
            message: {
              type: "string",
              example: "Invalid request",
            },
          },
          required: ["status", "message"],
        },

        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            email: {
              type: "string",
              format: "email",
              example: "player@example.com",
            },
          },
        },

        Credentials: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              maxLength: 254,
              example: "player@example.com",
            },
            password: {
              type: "string",
              minLength: 8,
              maxLength: 72,
              description:
                "Password must contain at least 8 characters and must not exceed 72 UTF-8 bytes.",
              example: "StrongPassword123",
            },
          },
        },

        LoginCredentials: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              maxLength: 254,
              example: "player@example.com",
            },
            password: {
              type: "string",
              example: "StrongPassword123",
            },
          },
        },

        AuthResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "ok",
            },
            token: {
              type: "string",
              description: "JWT access token",
            },
            user: {
              $ref: "#/components/schemas/User",
            },
          },
        },

        Pagination: {
          type: "object",
          properties: {
            page: {
              type: "integer",
              example: 1,
            },
            limit: {
              type: "integer",
              example: 10,
            },
            total: {
              type: "integer",
              example: 25,
            },
            totalPages: {
              type: "integer",
              example: 3,
            },
          },
        },

        ListingInput: {
          type: "object",
          required: ["itemId", "quantity", "unitPrice"],
          properties: {
            itemId: {
              type: "string",
              format: "uuid",
            },
            quantity: {
              type: "integer",
              minimum: 1,
              maximum: 2147483647,
              example: 5,
            },
            unitPrice: {
              type: "string",
              pattern:
                "^(?=.*[1-9])(?:0|[1-9][0-9]{0,17})(?:\\.[0-9]{1,18})?$",
              example: "25.50",
              description:
                "Positive decimal amount represented as a string.",
            },
          },
        },

        MarketListing: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            item: {
              type: "object",
              additionalProperties: true,
            },
            seller: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  format: "uuid",
                },
              },
            },
            quantity: {
              type: "integer",
            },
            unitPrice: {
              type: "string",
              example: "25.50",
            },
            status: {
              type: "string",
              enum: ["ACTIVE", "SOLD", "CANCELLED"],
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        ListingCreateResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "ok",
            },
            listing: {
              $ref: "#/components/schemas/MarketListing",
            },
          },
        },

        MarketPurchaseResponse: {
          type: "object",
          properties: {
            listingId: {
              type: "string",
              format: "uuid",
            },
            orderId: {
              type: "string",
              format: "uuid",
            },
            transactionId: {
              type: "string",
              format: "uuid",
            },
            item: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  format: "uuid",
                },
                name: {
                  type: "string",
                },
                quantity: {
                  type: "integer",
                },
              },
            },
            totalPrice: {
              type: "string",
              example: "125.00",
            },
            assetCode: {
              type: "string",
              example: "USD",
            },
            status: {
              type: "string",
              example: "SOLD",
            },
          },
        },

        CancelListingResponse: {
          type: "object",
          properties: {
            listingId: {
              type: "string",
              format: "uuid",
            },
            status: {
              type: "string",
              example: "CANCELLED",
            },
            returnedItem: {
              type: "object",
              properties: {
                itemId: {
                  type: "string",
                  format: "uuid",
                },
                quantity: {
                  type: "integer",
                },
              },
            },
          },
        },

        TransferInput: {
          type: "object",
          required: ["cardNumber", "amount"],
          properties: {
            cardNumber: {
              type: "string",
              pattern: "^\\d{12}$",
              example: "123456789012",
            },
            amount: {
              type: "string",
              pattern:
                "^(?:0|[1-9][0-9]{0,17})(?:\\.[0-9]{1,18})?$",
              example: "50.00",
              description: "Must be greater than zero.",
            },
          },
        },

        TransferResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Transfer completed successfully",
            },
            data: {
              type: "object",
              properties: {
                amount: {
                  type: "string",
                  example: "50.00",
                },
                assetCode: {
                  type: "string",
                  example: "USD",
                },
                senderBalance: {
                  type: "string",
                  example: "150.00",
                },
                transactionId: {
                  type: "string",
                  format: "uuid",
                },
              },
            },
          },
        },

        ResolveCardInput: {
          type: "object",
          required: ["cardNumber"],
          properties: {
            cardNumber: {
              type: "string",
              pattern: "^\\d{12}$",
              example: "123456789012",
            },
          },
        },

        PaginationResult: {
          type: "object",
          properties: {
            currentPage: {
              type: "integer",
            },
            limit: {
              type: "integer",
            },
            totalItems: {
              type: "integer",
            },
            totalPages: {
              type: "integer",
            },
          },
        },

        GenericObject: {
          type: "object",
          description:
            "Response object. Additional properties depend on the returned resource.",
          additionalProperties: true,
        },

        GenericListResponse: {
          type: "object",
          additionalProperties: true,
        },
      },

      responses: {
        BadRequest: {
          description: "Invalid request or parameters",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },

        Unauthorized: {
          description: "Authentication required or invalid token",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },

        Forbidden: {
          description: "You are not allowed to perform this operation",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },

        NotFound: {
          description: "Requested resource was not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },

        Conflict: {
          description: "Resource conflict",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },

        InternalServerError: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },

    paths: {
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Check API and database health",
          responses: {
            200: {
              description: "API and database are healthy",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: {
                        type: "string",
                        example: "ok",
                      },
                      database: {
                        type: "string",
                        example: "connected",
                      },
                      database_time: {
                        type: "string",
                        format: "date-time",
                      },
                      database_name: {
                        type: "string",
                        example: "wallet_db",
                      },
                    },
                  },
                },
              },
            },
            500: {
              $ref: "#/components/responses/InternalServerError",
            },
          },
        },
      },

      "/api/auth/register": {
        post: {
          tags: ["Authentication"],
          summary: "Register a new user",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Credentials",
                },
              },
            },
          },
          responses: {
            201: {
              description: "User registered successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: {
                        type: "string",
                        example: "ok",
                      },
                      user: {
                        $ref: "#/components/schemas/User",
                      },
                    },
                  },
                },
              },
            },
            400: {
              $ref: "#/components/responses/BadRequest",
            },
            409: {
              description: "Email is already registered",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
            500: {
              $ref: "#/components/responses/InternalServerError",
            },
          },
        },
      },

      "/api/auth/login": {
        post: {
          tags: ["Authentication"],
          security: [],
          summary: "Login and receive an access token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/LoginCredentials",
                },
              },
            },
          },
          responses: {
            200: {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/AuthResponse",
                  },
                },
              },
            },
            400: {
              $ref: "#/components/responses/BadRequest",
            },
            401: {
              description: "Invalid email or password",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error",
                  },
                },
              },
            },
          },
        },
      },

      "/api/auth/profile": {
        get: {
          tags: ["Authentication"],
          summary: "Get the authenticated user's profile",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "User profile",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/GenericObject",
                  },
                },
              },
            },
            401: {
              $ref: "#/components/responses/Unauthorized",
            },
            404: {
              $ref: "#/components/responses/NotFound",
            },
          },
        },
      },

      "/api/auth/{userId}": {
        get: {
          tags: ["Authentication"],
          summary: "Get a user by ID",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "userId",
              in: "path",
              required: true,
              schema: {
                type: "string",
                format: "uuid",
              },
            },
          ],
          responses: {
            200: {
              description: "User information",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/User",
                  },
                },
              },
            },
            401: {
              $ref: "#/components/responses/Unauthorized",
            },
            404: {
              $ref: "#/components/responses/NotFound",
            },
          },
        },
      },

      "/api/wallet/myWallet": {
        get: {
          tags: ["Wallet"],
          summary: "Get the authenticated user's wallets",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Wallet information",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: {
                        type: "string",
                        example: "ok",
                      },
                      wallets: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/GenericObject",
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              $ref: "#/components/responses/Unauthorized",
            },
          },
        },
      },

      "/api/wallet/resolve-card": {
        post: {
          tags: ["Wallet"],
          summary: "Resolve a recipient card number",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ResolveCardInput",
                },
              },
            },
          },
          responses: {
            200: {
              description: "Recipient information",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      recipient: {
                        type: "object",
                        properties: {
                          name: {
                            type: "string",
                          },
                          cardNumber: {
                            type: "string",
                            example: "********9012",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: {
              $ref: "#/components/responses/BadRequest",
            },
            401: {
              $ref: "#/components/responses/Unauthorized",
            },
            404: {
              $ref: "#/components/responses/NotFound",
            },
          },
        },
      },

      "/api/wallet/transfer": {
        post: {
          tags: ["Wallet"],
          summary: "Transfer virtual currency to another user",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TransferInput",
                },
              },
            },
          },
          responses: {
            200: {
              description: "Transfer completed",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/TransferResponse",
                  },
                },
              },
            },
            400: {
              $ref: "#/components/responses/BadRequest",
            },
            401: {
              $ref: "#/components/responses/Unauthorized",
            },
            404: {
              $ref: "#/components/responses/NotFound",
            },
          },
        },
      },

      "/api/transactions": {
        get: {
          tags: ["Transactions"],
          summary: "Get the authenticated user's transaction history",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              schema: {
                type: "integer",
                minimum: 1,
                default: 1,
              },
            },
            {
              name: "limit",
              in: "query",
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 10,
              },
            },
          ],
          responses: {
            200: {
              description: "Transaction history",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/GenericObject",
                  },
                },
              },
            },
            401: {
              $ref: "#/components/responses/Unauthorized",
            },
            400: {
              $ref: "#/components/responses/BadRequest",
            },
            404: {
              $ref: "#/components/responses/NotFound",
            },
          },
        },
      },

      "/api/items": {
        get: {
          tags: ["Items"],
          summary: "Get active game items",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              schema: {
                type: "integer",
                minimum: 1,
                default: 1,
              },
            },
            {
              name: "limit",
              in: "query",
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 50,
                default: 10,
              },
            },
            {
              name: "search",
              in: "query",
              schema: {
                type: "string",
              },
            },
          ],
          responses: {
            200: {
              description: "Active items and pagination",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      items: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/GenericObject",
                        },
                      },
                      pagination: {
                        type: "object",
                        properties: {
                          page: {
                            type: "integer",
                          },
                          limit: {
                            type: "integer",
                          },
                          totalItems: {
                            type: "integer",
                          },
                          totalPages: {
                            type: "integer",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: {
              $ref: "#/components/responses/BadRequest",
            },
            401: {
              $ref: "#/components/responses/Unauthorized",
            },
          },
        },
      },

      "/api/inventory/myINV": {
        get: {
          tags: ["Inventory"],
          summary: "Get the authenticated user's inventory",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "User inventory",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/GenericObject",
                  },
                },
              },
            },
            401: {
              $ref: "#/components/responses/Unauthorized",
            },
            404: {
              $ref: "#/components/responses/NotFound",
            },
          },
        },
      },

      "/api/market/listings": {
        get: {
          tags: ["Market"],
          security: [],
          summary: "Get active marketplace listings",
          parameters: [
            {
              name: "page",
              in: "query",
              schema: {
                type: "integer",
                minimum: 1,
                default: 1,
              },
            },
            {
              name: "limit",
              in: "query",
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 50,
                default: 10,
              },
            },
            {
              name: "search",
              in: "query",
              schema: {
                type: "string",
              },
            },
            {
              name: "itemId",
              in: "query",
              schema: {
                type: "string",
                format: "uuid",
              },
            },
            {
              name: "minPrice",
              in: "query",
              schema: {
                type: "string",
                example: "10.00",
              },
            },
            {
              name: "maxPrice",
              in: "query",
              schema: {
                type: "string",
                example: "100.00",
              },
            },
            {
              name: "sortBy",
              in: "query",
              schema: {
                type: "string",
                enum: ["created_at", "unit_price"],
                default: "created_at",
              },
            },
            {
              name: "order",
              in: "query",
              schema: {
                type: "string",
                enum: ["asc", "desc"],
                default: "desc",
              },
            },
          ],
          responses: {
            200: {
              description: "Active listings",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: {
                        type: "string",
                        example: "ok",
                      },
                      data: {
                        type: "object",
                        properties: {
                          listings: {
                            type: "array",
                            items: {
                              $ref: "#/components/schemas/MarketListing",
                            },
                          },
                          pagination: {
                            type: "object",
                            properties: {
                              currentPage: {
                                type: "integer",
                              },
                              limit: {
                                type: "integer",
                              },
                              totalItems: {
                                type: "integer",
                              },
                              totalPages: {
                                type: "integer",
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: {
              $ref: "#/components/responses/BadRequest",
            },
            500: {
              $ref: "#/components/responses/InternalServerError",
            },
          },
        },

        post: {
          tags: ["Market"],
          summary: "Create a marketplace listing",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ListingInput",
                },
              },
            },
          },
          responses: {
            201: {
              description: "Listing created",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ListingCreateResponse",
                  },
                },
              },
            },
            400: {
              $ref: "#/components/responses/BadRequest",
            },
            401: {
              $ref: "#/components/responses/Unauthorized",
            },
            409: {
              $ref: "#/components/responses/Conflict",
            },
          },
        },
      },

      "/api/market/listings/{listingId}/purchase": {
        post: {
          tags: ["Market"],
          summary: "Purchase an active marketplace listing",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "listingId",
              in: "path",
              required: true,
              schema: {
                type: "string",
                format: "uuid",
              },
            },
          ],
          responses: {
            200: {
              description: "Listing purchased successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/MarketPurchaseResponse",
                  },
                },
              },
            },
            400: {
              $ref: "#/components/responses/BadRequest",
            },
            401: {
              $ref: "#/components/responses/Unauthorized",
            },
            404: {
              $ref: "#/components/responses/NotFound",
            },
            409: {
              $ref: "#/components/responses/Conflict",
            },
          },
        },
      },

      "/api/market/listings/{listingId}/cancel": {
        post: {
          tags: ["Market"],
          summary: "Cancel your own active listing",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "listingId",
              in: "path",
              required: true,
              schema: {
                type: "string",
                format: "uuid",
              },
            },
          ],
          responses: {
            200: {
              description: "Listing cancelled and items returned",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/CancelListingResponse",
                  },
                },
              },
            },
            401: {
              $ref: "#/components/responses/Unauthorized",
            },
            403: {
              $ref: "#/components/responses/Forbidden",
            },
            404: {
              $ref: "#/components/responses/NotFound",
            },
            409: {
              $ref: "#/components/responses/Conflict",
            },
          },
        },
      },

      "/api/market/my-listings": {
        get: {
          tags: ["Market"],
          summary: "Get your marketplace listings",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              schema: {
                type: "integer",
                minimum: 1,
                default: 1,
              },
            },
            {
              name: "limit",
              in: "query",
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 10,
              },
            },
            {
              name: "status",
              in: "query",
              schema: {
                type: "string",
                enum: ["ACTIVE", "SOLD", "CANCELLED"],
              },
            },
          ],
          responses: {
            200: {
              description: "Your listings",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/GenericObject",
                  },
                },
              },
            },
            400: {
              $ref: "#/components/responses/BadRequest",
            },
            401: {
              $ref: "#/components/responses/Unauthorized",
            },
          },
        },
      },

      "/api/market/my-orders": {
        get: {
          tags: ["Market"],
          summary: "Get your marketplace purchases",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              schema: {
                type: "integer",
                minimum: 1,
                default: 1,
              },
            },
            {
              name: "limit",
              in: "query",
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 10,
              },
            },
          ],
          responses: {
            200: {
              description: "Your purchase orders",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/GenericObject",
                  },
                },
              },
            },
            400: {
              $ref: "#/components/responses/BadRequest",
            },
            401: {
              $ref: "#/components/responses/Unauthorized",
            },
          },
        },
      },

      "/api/market/my-sales": {
        get: {
          tags: ["Market"],
          summary: "Get your marketplace sales",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              schema: {
                type: "integer",
                minimum: 1,
                default: 1,
              },
            },
            {
              name: "limit",
              in: "query",
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 10,
              },
            },
          ],
          responses: {
            200: {
              description: "Your sales",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/GenericObject",
                  },
                },
              },
            },
            400: {
              $ref: "#/components/responses/BadRequest",
            },
            401: {
              $ref: "#/components/responses/Unauthorized",
            },
          },
        },
      },
    },
  },

  apis: [],
};

module.exports = swaggerJsdoc(options);
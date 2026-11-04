
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "Virtual Economy Wallet API",
      version: "1.0.0",
      description: `
REST API for a virtual game economy.

Features:
- User authentication with JWT
- Virtual wallets and balance transfers
- Transaction history
- Game items and inventory
- Player marketplace

This API uses virtual currency. It does not process real-money payments.
      `,
    },

    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
    ],

    tags: [
      { name: "Health", description: "Application health" },
      { name: "Authentication", description: "User registration and login" },
      { name: "Wallet", description: "Virtual wallet operations" },
      { name: "Transactions", description: "Wallet transaction history" },
      { name: "Items", description: "Available game items" },
      { name: "Inventory", description: "Player inventory" },
      { name: "Market", description: "Player marketplace" },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter the JWT token returned by the login endpoint.",
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
                "Registration password. Maximum length is 72 UTF-8 bytes.",
              example: "StrongPassword123",
            },
          },
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
            },
          },
        },

        Pagination: {
          type: "object",
          properties: {
            currentPage: {
              type: "integer",
              example: 1,
            },
            page: {
              type: "integer",
              example: 1,
            },
            limit: {
              type: "integer",
              example: 10,
            },
            totalItems: {
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
              example: 2,
            },
            unitPrice: {
              type: "string",
              pattern:
                "^(?=.*[1-9])(?:0|[1-9][0-9]{0,17})(?:\\.[0-9]{1,18})?$",
              example: "25.50",
              description: "Positive decimal price.",
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
              description: "The listed item and its returned properties.",
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
              example: 2,
            },
            unitPrice: {
              type: "string",
              example: "25.50",
            },
            status: {
              type: "string",
              example: "ACTIVE",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
      },
    },

    paths: {
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Check application and database health",
          responses: {
            200: {
              description: "Database connection is working.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                      database: { type: "string", example: "connected" },
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
              description: "Database connection failed.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/api/auth/register": {
        post: {
          tags: ["Authentication"],
          summary: "Register a new user",
          description:
            "Creates a user and initializes their virtual wallet with the initial credit.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Credentials" },
              },
            },
          },
          responses: {
            201: {
              description: "User successfully registered.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                      user: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Invalid registration data.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            409: {
              description: "Email is already registered.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/api/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Login",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: {
                      type: "string",
                      format: "email",
                      example: "player@example.com",
                    },
                    password: {
                      type: "string",
                      example: "StrongPassword123",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Login successful.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                      token: {
                        type: "string",
                        description: "JWT access token.",
                      },
                      user: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
            401: {
              description: "Invalid email or password.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/api/auth/profile": {
        get: {
          tags: ["Authentication"],
          summary: "Get current user profile",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "User profile.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    description:
                      "Profile returned by the user repository.",
                    additionalProperties: true,
                  },
                },
              },
            },
            401: {
              description: "Authentication required or token invalid.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/api/wallet/myWallet": {
        get: {
          tags: ["Wallet"],
          summary: "Get current user's wallets",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Wallet information.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                      wallets: {
                        type: "array",
                        items: {
                          type: "object",
                          description:
                            "Wallet fields returned by the wallet repository.",
                          additionalProperties: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Authentication required.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/api/wallet/resolve-card": {
        post: {
          tags: ["Wallet"],
          summary: "Resolve a recipient card",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["cardNumber"],
                  properties: {
                    cardNumber: {
                      type: "string",
                      pattern: "^[0-9]{12}$",
                      example: "123456789012",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Recipient information.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      recipient: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
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
              description: "Invalid card or self-transfer.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: {
              description: "Recipient wallet not found.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/api/wallet/transfer": {
        post: {
          tags: ["Wallet"],
          summary: "Transfer virtual balance",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["cardNumber", "amount"],
                  properties: {
                    cardNumber: {
                      type: "string",
                      pattern: "^[0-9]{12}$",
                      example: "123456789012",
                    },
                    amount: {
                      type: "string",
                      example: "25.50",
                      description: "Positive decimal amount.",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Transfer completed.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: {
                        type: "string",
                        example: "Transfer completed successfully",
                      },
                      data: {
                        type: "object",
                        properties: {
                          amount: { type: "string", example: "25.50" },
                          assetCode: { type: "string", example: "USD" },
                          senderBalance: {
                            type: "string",
                            example: "174.50",
                          },
                          transactionId: {
                            type: "string",
                            format: "uuid",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: {
              description:
                "Invalid amount/card, self-transfer, currency mismatch, or insufficient balance.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: {
              description: "Sender or recipient wallet not found.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/api/transactions": {
        get: {
          tags: ["Transactions"],
          summary: "Get current user's transaction history",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", minimum: 1, default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
            },
          ],
          responses: {
            200: {
              description: "Transaction history and pagination.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "object",
                        properties: {
                          transactions: {
                            type: "array",
                            items: {
                              type: "object",
                              additionalProperties: true,
                            },
                          },
                          pagination: {
                            type: "object",
                            properties: {
                              currentPage: { type: "integer" },
                              limit: { type: "integer" },
                              totalItems: { type: "integer" },
                              totalPages: { type: "integer" },
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
              description: "Invalid pagination parameters.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: {
              description: "Wallet not found.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
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
              schema: { type: "integer", minimum: 1, default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
            },
            {
              name: "search",
              in: "query",
              schema: { type: "string" },
              description: "Search items by name.",
            },
          ],
          responses: {
            200: {
              description: "Active items and pagination.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      items: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      pagination: {
                        type: "object",
                        properties: {
                          page: { type: "integer" },
                          limit: { type: "integer" },
                          totalItems: { type: "integer" },
                          totalPages: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: "Invalid query parameters.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/api/inventory/myINV": {
        get: {
          tags: ["Inventory"],
          summary: "Get current user's inventory",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Player inventory.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      items: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      totalItems: {
                        type: "integer",
                        example: 2,
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Authentication required.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/api/market/listings": {
        get: {
          tags: ["Market"],
          summary: "Get active marketplace listings",
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", minimum: 1, default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
            },
            {
              name: "search",
              in: "query",
              schema: { type: "string" },
              description: "Search listings by item name.",
            },
            {
              name: "itemId",
              in: "query",
              schema: { type: "string", format: "uuid" },
            },
            {
              name: "minPrice",
              in: "query",
              schema: { type: "string", example: "10.00" },
            },
            {
              name: "maxPrice",
              in: "query",
              schema: { type: "string", example: "100.00" },
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
              description: "Active listings and pagination.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
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
                              currentPage: { type: "integer" },
                              limit: { type: "integer" },
                              totalItems: { type: "integer" },
                              totalPages: { type: "integer" },
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
              description: "Invalid filters, pagination, or sorting.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },

        post: {
          tags: ["Market"],
          summary: "Create a marketplace listing",
          description:
            "Creates a listing and deducts the listed quantity from the seller's inventory.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ListingInput" },
              },
            },
          },
          responses: {
            201: {
              description: "Listing successfully created.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                      listing: {
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
                          quantity: { type: "integer", example: 2 },
                          unitPrice: { type: "string", example: "25.50" },
                          status: { type: "string", example: "ACTIVE" },
                          createdAt: {
                            type: "string",
                            format: "date-time",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: {
              description:
                "Invalid listing data, insufficient inventory, or unavailable item.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            401: {
              description: "Authentication required.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            409: {
              description: "Inventory changed during listing creation.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
    },
  },

  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

[فارسی](README.fa.md)
# Virtual Economy Backend

A REST API backend for a virtual economy platform. Users can manage their wallets, transfer virtual credits, manage digital items, and trade items through a marketplace.

The project is built with Node.js, Express, PostgreSQL, and Prisma ORM.

> This is a virtual economy project. It does not process real payments or transfer real money.

## Features

- User registration and login
- JWT-based authentication
- Wallet and balance management
- Virtual credit transfers between users
- Transaction history
- Digital item management
- Item listing with pagination and search
- Marketplace listing creation
- Purchasing and cancelling listings
- Personal listings, orders, and sales
- Request validation
- Centralized error handling
- Swagger API documentation
- Automated tests
- Docker Compose setup

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API framework |
| PostgreSQL | Relational database |
| Prisma ORM | Database access and queries |
| JWT | Authentication |
| Joi | Request validation |
| bcrypt | Password hashing |
| Docker | Containerization |
| Docker Compose | Service orchestration |
| Swagger / OpenAPI | API documentation |
| Jest | Automated testing |
| Supertest | HTTP endpoint testing |

## Architecture

The application follows a layered architecture:

```text
Router → Controller → Service → Repository
```

- **Router:** Defines API routes and middleware.
- **Controller:** Handles HTTP requests and responses.
- **Service:** Contains application and business logic.
- **Repository:** Handles database operations through Prisma.

Each layer has a separate responsibility, keeping business logic independent from HTTP handling and database access.

## Database and Transactions

PostgreSQL is used to store users, wallets, virtual items, inventories, marketplace listings, orders, and transaction records.

Marketplace purchases are executed inside database transactions to keep related changes consistent, including buyer and seller balances, inventory updates, orders, listings, and ledger entries.

Serializable transactions and conditional updates are used to reduce concurrency issues, such as purchasing the same listing more than once or spending the same balance concurrently.

## API Documentation

Swagger UI is available at:

```text
http://localhost:3000/api-docs
```

The documentation includes available endpoints, request parameters, response definitions, and authentication requirements. Protected endpoints can be tested using the JWT Authorize feature.

## Getting Started

### Requirements

- Docker
- Docker Compose

The Docker setup handles the API and PostgreSQL services. You do not need to install Node.js or PostgreSQL separately on the host machine to run the containerized version.

### 1. Clone the repository

```bash
git clone <repository-url>
cd wallet
```

### 2. Configure environment variables

Create a `.env` file in the project root and provide the environment variables required by the application and Docker Compose.

Database connection settings, authentication secrets, and other sensitive configuration values should be defined there.

**Do not commit your `.env` file to the repository.**

### 3. Start the application

```bash
docker compose up -d --build
```

Docker Compose starts the API and PostgreSQL services. Once the database is healthy, Prisma migrations are applied and the API starts.

### 4. Check service status

```bash
docker compose ps
```

Check the API health endpoint:

```bash
curl http://localhost:3000/health
```

A successful response includes the API status and database connection information.

### 5. Open API documentation

```text
http://localhost:3000/api-docs
```

## Running Tests

Run the automated test suite in the development environment:

```bash
npm test
```

The test suite uses Jest and Supertest to verify application logic, API endpoints, validation, and transaction behavior.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/profile` | Get current user profile |
| GET | `/api/auth/{userId}` | Get user information |
| GET | `/api/wallet/myWallet` | Get user wallets |
| POST | `/api/wallet/resolve-card` | Resolve transfer recipient |
| POST | `/api/wallet/transfer` | Transfer virtual credits |
| GET | `/api/transactions` | Get transaction history |
| GET | `/api/items` | Get available items |
| GET | `/api/inventory/myINV` | Get user inventory |
| GET | `/api/market/listings` | Get marketplace listings |
| POST | `/api/market/listings` | Create a listing |
| POST | `/api/market/listings/{listingId}/purchase` | Purchase a listing |
| POST | `/api/market/listings/{listingId}/cancel` | Cancel a listing |
| GET | `/api/market/my-listings` | Get personal listings |
| GET | `/api/market/my-orders` | Get personal orders |
| GET | `/api/market/my-sales` | Get personal sales |

For request schemas, response examples, and error details, refer to the Swagger documentation.

## Project Status

This project was built to practice and demonstrate backend development concepts, including REST API design, layered architecture, relational database modeling, transaction management, authentication, and automated testing.


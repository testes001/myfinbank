# FinBank Backend API Design Specification

**Version:** 1.0.0
**Date:** 2025-12-23
**Status:** Phase 2 Implementation

---

## 🏗️ Architecture Overview

### Technology Stack

**Backend Framework:**
- Node.js 20+ LTS
- Express.js 4.18+
- TypeScript 5.8+

**Database:**
- PostgreSQL 14+ (primary database)
- Redis 7+ (sessions, cache, rate limiting)

**Security:**
- JWT (JSON Web Tokens) for authentication
- bcrypt for password hashing
- Helmet.js for HTTP security headers
- express-rate-limit + Redis
- CORS configuration

**ORM/Database Client:**
- node-postgres (pg) with TypeScript
- Prisma or TypeORM (recommended)

**Validation:**
- Zod (schema validation)
- express-validator

**Testing:**
- Jest (unit tests)
- Supertest (integration tests)

**Documentation:**
- Swagger/OpenAPI 3.0

---

## 📁 Project Structure

```
/backend
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── jwt.ts
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts
│   │   ├── rateLimiter.ts
│   │   ├── errorHandler.ts
│   │   ├── validator.ts
│   │   └── logger.ts
│   ├── routes/           # API route definitions
│   │   ├── auth.routes.ts
│   │   ├── accounts.routes.ts
│   │   ├── transactions.routes.ts
│   │   ├── users.routes.ts
│   │   ├── cards.routes.ts
│   │   └── admin.routes.ts
│   ├── controllers/      # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── accounts.controller.ts
│   │   ├── transactions.controller.ts
│   │   └── ...
│   ├── services/         # Business logic
│   │   ├── auth.service.ts
│   │   ├── account.service.ts
│   │   ├── transaction.service.ts
│   │   ├── kyc.service.ts
│   │   ├── fraud.service.ts
│   │   └── ...
│   ├── models/           # Database models (if using ORM)
│   │   ├── user.model.ts
│   │   ├── account.model.ts
│   │   ├── transaction.model.ts
│   │   └── ...
│   ├── repositories/     # Database access layer
│   │   ├── user.repository.ts
│   │   ├── account.repository.ts
│   │   └── ...
│   ├── utils/            # Utility functions
│   │   ├── encryption.ts
│   │   ├── validators.ts
│   │   ├── logger.ts
│   │   └── ...
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── app.ts            # Express app setup
│   └── server.ts         # Server entry point
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── prisma/               # Database schema & migrations
│   ├── schema.prisma
│   └── migrations/
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔐 Authentication & Authorization

### JWT Token Structure

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "customer|admin|support",
  "sessionId": "uuid",
  "iat": 1234567890,
  "exp": 1234569690
}
```

### Token Lifecycle
- **Access Token:** 15 minutes (short-lived)
- **Refresh Token:** 7 days (stored in Redis)
- **Session Timeout:** 30 minutes of inactivity

### Authentication Flow
1. User sends credentials to `/api/auth/login`
2. Server validates credentials
3. Server creates session in Redis
4. Server generates JWT tokens (access + refresh)
5. Client stores tokens (httpOnly cookies recommended)
6. Client includes access token in Authorization header
7. Server validates token on protected routes
8. Client refreshes token via `/api/auth/refresh` when expired

---

## 🛣️ API Endpoints

### Base URL
```
Development: http://localhost:4000/api
Production:  https://api.yourfinbank.com/api
```

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "acceptedTerms": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "status": "pending_kyc",
    "createdAt": "2025-12-23T12:00:00Z"
  },
  "message": "Account created successfully"
}
```

**Errors:**
- 400: Invalid email format
- 409: Email already exists
- 422: Password too weak

---

#### POST /api/auth/login
Authenticate user and create session.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "deviceInfo": {
    "userAgent": "...",
    "ipAddress": "1.2.3.4"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "userId": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "customer",
      "status": "active"
    }
  },
  "message": "Login successful"
}
```

**Rate Limiting:**
- 5 attempts per 15 minutes per IP
- Progressive delays after failures
- Account lockout after 5 failed attempts

**Errors:**
- 401: Invalid credentials
- 403: Account locked/suspended
- 429: Too many requests

---

#### POST /api/auth/logout
End user session.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### POST /api/auth/refresh
Refresh expired access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Errors:**
- 401: Invalid or expired refresh token

---

### User Endpoints

#### GET /api/users/me
Get current user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "phoneNumber": "+1234567890",
    "status": "active",
    "role": "customer",
    "kycStatus": "approved",
    "createdAt": "2025-01-01T00:00:00Z",
    "lastLogin": "2025-12-23T12:00:00Z"
  }
}
```

---

#### PATCH /api/users/me
Update user profile.

**Request:**
```json
{
  "fullName": "John Updated Doe",
  "phoneNumber": "+1234567890"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* updated user */ },
  "message": "Profile updated successfully"
}
```

---

### Account Endpoints

#### GET /api/accounts
Get user's accounts.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "accountId": "uuid",
      "accountNumber": "****1234",
      "accountType": "checking",
      "balance": "5000.00",
      "currency": "USD",
      "status": "active",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

#### GET /api/accounts/:accountId
Get specific account details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accountId": "uuid",
    "accountNumber": "1234567890",
    "routingNumber": "021000021",
    "accountType": "checking",
    "balance": "5000.00",
    "availableBalance": "4800.00",
    "currency": "USD",
    "status": "active",
    "overdraftProtection": false,
    "interestRate": "0.01",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

#### POST /api/accounts
Create new account.

**Request:**
```json
{
  "accountType": "savings",
  "currency": "USD",
  "initialDeposit": "1000.00"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { /* new account */ },
  "message": "Account created successfully"
}
```

---

### Transaction Endpoints

#### GET /api/transactions
Get user's transactions with pagination.

**Query Parameters:**
- `accountId` (optional): Filter by account
- `startDate` (optional): ISO date
- `endDate` (optional): ISO date
- `type` (optional): deposit|withdrawal|transfer|payment
- `status` (optional): completed|pending|failed
- `page` (default: 1)
- `limit` (default: 20, max: 100)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "transactionId": "uuid",
        "accountId": "uuid",
        "type": "transfer",
        "amount": "-100.00",
        "currency": "USD",
        "status": "completed",
        "description": "Transfer to John",
        "recipientName": "John Smith",
        "createdAt": "2025-12-23T12:00:00Z",
        "completedAt": "2025-12-23T12:00:01Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

---

#### POST /api/transactions/transfer
Create internal transfer between accounts.

**Request:**
```json
{
  "fromAccountId": "uuid",
  "toAccountId": "uuid",
  "amount": "100.00",
  "description": "Transfer to savings",
  "mfaToken": "123456"
}
```

**Validation:**
- Amount > 0
- Sufficient balance
- Valid account ownership
- Transaction limits not exceeded
- MFA verified (if required)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "transactionId": "uuid",
    "status": "completed",
    "fromAccount": "****1234",
    "toAccount": "****5678",
    "amount": "100.00",
    "createdAt": "2025-12-23T12:00:00Z"
  },
  "message": "Transfer completed successfully"
}
```

**Errors:**
- 400: Insufficient funds
- 403: Transaction limit exceeded
- 422: Invalid amount

---

#### POST /api/transactions/p2p
Peer-to-peer transfer.

**Request:**
```json
{
  "fromAccountId": "uuid",
  "recipientEmail": "recipient@example.com",
  "amount": "50.00",
  "memo": "Dinner split",
  "mfaToken": "123456"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { /* transaction details */ },
  "message": "P2P transfer initiated"
}
```

---

### KYC Endpoints

#### POST /api/kyc/submit
Submit KYC verification data.

**Request (multipart/form-data):**
```
{
  "dateOfBirth": "1990-01-15",
  "ssn": "123-45-6789",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "US"
  },
  "idDocumentFront": <file>,
  "idDocumentBack": <file>
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "kycId": "uuid",
    "status": "under_review",
    "submittedAt": "2025-12-23T12:00:00Z",
    "estimatedCompletionTime": "2025-12-24T12:00:00Z"
  },
  "message": "KYC documents submitted for review"
}
```

---

#### GET /api/kyc/status
Get KYC verification status.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "approved|pending|rejected|under_review",
    "submittedAt": "2025-12-23T12:00:00Z",
    "reviewedAt": "2025-12-23T14:00:00Z",
    "rejectionReason": null
  }
}
```

---

### Card Management Endpoints

#### GET /api/cards
Get user's cards.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "cardId": "uuid",
      "cardType": "virtual",
      "cardNumber": "**** **** **** 1234",
      "expiryDate": "12/28",
      "status": "active",
      "spendingLimit": "1000.00",
      "linkedAccountId": "uuid"
    }
  ]
}
```

---

#### POST /api/cards/virtual
Create virtual card.

**Request:**
```json
{
  "cardType": "single_use|merchant_locked|recurring",
  "linkedAccountId": "uuid",
  "spendingLimit": "500.00",
  "merchantLock": "amazon.com"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "cardId": "uuid",
    "cardNumber": "4532123456781234",
    "cvv": "123",
    "expiryDate": "12/28",
    "cardType": "single_use",
    "spendingLimit": "500.00",
    "status": "active"
  }
}
```

---

### Admin Endpoints

#### GET /api/admin/users
Get all users (admin only).

**Query Parameters:**
- `status`: active|suspended|pending_kyc
- `page`, `limit`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [ /* user list */ ],
    "pagination": { /* pagination info */ }
  }
}
```

---

#### PATCH /api/admin/users/:userId/status
Update user status (suspend, activate, etc.).

**Request:**
```json
{
  "status": "suspended",
  "reason": "Suspicious activity detected"
}
```

---

#### GET /api/admin/transactions/pending
Get transactions requiring approval.

---

#### GET /api/admin/audit-logs
Get audit logs.

**Query Parameters:**
- `startDate`, `endDate`
- `actor`, `action`, `resource`
- `page`, `limit`

---

## 🔒 Security Implementation

### Rate Limiting Strategy

**Login Endpoints:**
- 5 attempts per 15 minutes per IP
- 10 attempts per hour per email
- Progressive delays (1s, 2s, 5s, 10s)

**API Endpoints:**
- 100 requests per minute per user
- 1000 requests per hour per user

**Transaction Endpoints:**
- 10 transactions per minute
- 100 transactions per hour

### Encryption

**At Rest:**
- SSN: AES-256-GCM
- Card numbers: AES-256-GCM
- Account numbers: AES-256-GCM
- Passwords: bcrypt (10 rounds minimum)

**In Transit:**
- HTTPS/TLS 1.3 only
- HSTS enabled
- Certificate pinning recommended

### Input Validation

All inputs validated using Zod schemas:
```typescript
const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(12).max(128).regex(/[A-Z]/).regex(/[0-9]/),
  fullName: z.string().min(2).max(100),
  acceptedTerms: z.literal(true)
});
```

---

## 📊 Database Schema (PostgreSQL)

### Tables

**users**
- id (uuid, PK)
- email (varchar, unique, indexed)
- password_hash (varchar)
- full_name (varchar)
- phone_number (varchar, nullable)
- role (enum: customer, admin, support)
- status (enum: active, suspended, pending_kyc, closed)
- kyc_status (enum: pending, approved, rejected, under_review)
- last_login (timestamp)
- created_at (timestamp)
- updated_at (timestamp)

**accounts**
- id (uuid, PK)
- user_id (uuid, FK -> users.id)
- account_number (varchar, unique, indexed, encrypted)
- routing_number (varchar)
- account_type (enum: checking, savings, investment)
- balance (decimal(15,2))
- available_balance (decimal(15,2))
- currency (varchar(3), default 'USD')
- status (enum: active, closed, frozen)
- created_at (timestamp)
- updated_at (timestamp)

**transactions**
- id (uuid, PK)
- user_id (uuid, FK -> users.id)
- from_account_id (uuid, FK -> accounts.id, nullable)
- to_account_id (uuid, FK -> accounts.id, nullable)
- type (enum: deposit, withdrawal, transfer, payment, refund)
- amount (decimal(15,2))
- currency (varchar(3))
- status (enum: pending, completed, failed, reversed)
- description (text)
- metadata (jsonb)
- created_at (timestamp)
- completed_at (timestamp, nullable)

**sessions**
- id (uuid, PK)
- user_id (uuid, FK -> users.id)
- refresh_token_hash (varchar)
- device_info (jsonb)
- ip_address (inet)
- expires_at (timestamp)
- created_at (timestamp)

**kyc_verifications**
- id (uuid, PK)
- user_id (uuid, FK -> users.id)
- date_of_birth (date, encrypted)
- ssn (varchar, encrypted)
- address (jsonb, encrypted)
- id_document_front_url (varchar)
- id_document_back_url (varchar)
- status (enum: pending, approved, rejected, under_review)
- submitted_at (timestamp)
- reviewed_at (timestamp, nullable)
- reviewer_id (uuid, FK -> users.id, nullable)
- rejection_reason (text, nullable)

**virtual_cards**
- id (uuid, PK)
- user_id (uuid, FK -> users.id)
- linked_account_id (uuid, FK -> accounts.id)
- card_number (varchar, encrypted)
- cvv (varchar, encrypted)
- expiry_date (varchar)
- card_type (enum: single_use, merchant_locked, recurring, standard)
- status (enum: active, frozen, expired, cancelled)
- spending_limit (decimal(15,2))
- merchant_lock (varchar, nullable)
- created_at (timestamp)

**audit_logs**
- id (uuid, PK)
- actor_id (uuid, FK -> users.id, nullable)
- actor_type (enum: user, system, admin)
- action (varchar)
- resource (varchar)
- resource_id (uuid, nullable)
- details (jsonb)
- status (enum: success, failed)
- ip_address (inet)
- created_at (timestamp)

**Indexes:**
- users(email)
- accounts(user_id)
- transactions(user_id, created_at)
- transactions(from_account_id, created_at)
- transactions(to_account_id, created_at)
- sessions(user_id, expires_at)
- audit_logs(actor_id, created_at)

---

## 🚀 Deployment Configuration

### Environment Variables (.env)

```bash
# Server
NODE_ENV=production
PORT=4000
API_BASE_URL=https://api.yourfinbank.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/finbank
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_jwt_secret_64_chars_minimum
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Encryption
ENCRYPTION_KEY=your_encryption_key_32_bytes

# CORS
CORS_ORIGIN=https://yourfinbank.com,https://www.yourfinbank.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5

# External Services
SENTRY_DSN=your_sentry_dsn
SENDGRID_API_KEY=your_sendgrid_key
AWS_S3_BUCKET=your_bucket_name
AWS_REGION=us-east-1
```

---

## 📖 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message",
  "meta": {
    "requestId": "uuid",
    "timestamp": "2025-12-23T12:00:00Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Insufficient funds for this transaction",
    "details": {
      "required": "100.00",
      "available": "50.00"
    }
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2025-12-23T12:00:00Z"
  }
}
```

### Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INSUFFICIENT_FUNDS` - Not enough balance
- `TRANSACTION_LIMIT_EXCEEDED` - Transaction limit reached
- `ACCOUNT_LOCKED` - Account is locked
- `KYC_REQUIRED` - KYC verification required
- `INTERNAL_ERROR` - Server error

---

## ✅ Next Steps

1. Set up backend project structure
2. Configure PostgreSQL database
3. Set up Redis
4. Implement authentication endpoints
5. Implement core business logic
6. Create API tests
7. Deploy to staging environment
8. Integration testing with frontend
9. Security audit
10. Production deployment

---

**Document Status:** Living document - will be updated as implementation progresses.

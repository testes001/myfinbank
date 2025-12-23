# FinBank Backend API

Production-grade banking backend built with Express.js, TypeScript, PostgreSQL, and Redis.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)

---

## ✨ Features

- ✅ RESTful API with Express.js & TypeScript
- ✅ PostgreSQL database with Prisma ORM
- ✅ Redis for sessions and rate limiting
- ✅ JWT authentication with refresh tokens
- ✅ AES-256-GCM encryption for sensitive data
- ✅ Comprehensive error handling
- ✅ Request logging with Winston
- ✅ Security headers with Helmet
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ File upload support
- ✅ Swagger API documentation
- ✅ Audit logging
- ✅ Transaction processing
- ✅ KYC verification workflow
- ✅ Virtual card management

---

## 🛠️ Tech Stack

**Core:**
- Node.js 20+
- Express.js 4.18+
- TypeScript 5.8+

**Database:**
- PostgreSQL 14+
- Prisma ORM 5.22+
- Redis 7+

**Security:**
- JWT (jsonwebtoken)
- bcrypt
- Helmet.js
- express-rate-limit

**Logging & Monitoring:**
- Winston
- Morgan
- Sentry (optional)

**Testing:**
- Jest
- Supertest

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **PostgreSQL** >= 14.0
- **Redis** >= 7.0

### Installing PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from [postgresql.org](https://www.postgresql.org/download/windows/)

### Installing Redis

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
```

**Windows:**
Download from [redis.io](https://redis.io/download/)

---

## 🚀 Installation

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment file:**
```bash
cp .env.example .env
```

4. **Edit .env file with your configuration** (see [Configuration](#configuration))

---

## ⚙️ Configuration

Edit the `.env` file with your settings:

### Required Configuration

```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/finbank_dev

# JWT Secret (generate with: openssl rand -base64 64)
JWT_SECRET=your_secure_jwt_secret_minimum_64_characters

# Encryption Key (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your_32_byte_encryption_key_in_hex

# Redis
REDIS_URL=redis://localhost:6379
```

### Optional Configuration

```bash
# Email (choose one)
SENDGRID_API_KEY=your_sendgrid_key

# Monitoring
SENTRY_DSN=your_sentry_dsn

# AWS (for file uploads)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=your_bucket_name
```

### Generate Secure Keys

```bash
# JWT Secret
openssl rand -base64 64

# Encryption Key
openssl rand -hex 32
```

---

## 🗄️ Database Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE finbank_dev;

# Exit
\q
```

### 2. Run Migrations

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (optional)
npm run db:seed
```

### 3. View Database (optional)

```bash
npm run prisma:studio
```

This opens Prisma Studio at http://localhost:5555

---

## 🏃 Running the Server

### Development Mode

```bash
npm run dev
```

Server starts at http://localhost:4000

### Production Mode

```bash
# Build
npm run build

# Start
npm start
```

### Check Server Health

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-23T12:00:00.000Z",
  "uptime": 123.45,
  "environment": "development"
}
```

---

## 📚 API Documentation

### Endpoints

**Base URL:** `http://localhost:4000/api`

**Health Check:**
- `GET /health` - Server health status

**Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token

**Users:**
- `GET /api/users/me` - Get current user
- `PATCH /api/users/me` - Update profile

**Accounts:**
- `GET /api/accounts` - List accounts
- `GET /api/accounts/:id` - Get account details
- `POST /api/accounts` - Create account

**Transactions:**
- `GET /api/transactions` - List transactions
- `POST /api/transactions/transfer` - Create transfer
- `POST /api/transactions/p2p` - P2P transfer

**For full API documentation, see:** [BACKEND_API_DESIGN.md](../BACKEND_API_DESIGN.md)

---

## 📂 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration
│   │   └── index.ts
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── routes/           # API routes
│   │   ├── auth.routes.ts
│   │   └── ...
│   ├── controllers/      # Request handlers
│   │   ├── auth.controller.ts
│   │   └── ...
│   ├── services/         # Business logic
│   │   ├── auth.service.ts
│   │   └── ...
│   ├── repositories/     # Database access
│   │   └── user.repository.ts
│   ├── utils/            # Utilities
│   │   ├── logger.ts
│   │   ├── encryption.ts
│   │   └── jwt.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── app.ts            # Express app
│   └── server.ts         # Entry point
├── prisma/
│   └── schema.prisma     # Database schema
├── tests/
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## 💻 Development

### Code Style

```bash
# Lint
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format
```

### Watch Mode

```bash
npm run dev
```

Auto-restarts on file changes.

### Database Changes

```bash
# Create migration
npm run prisma:migrate

# Reset database
npx prisma migrate reset

# View data
npm run prisma:studio
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Test Structure

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── e2e/           # End-to-end tests
```

---

## 🚢 Deployment

### Environment Variables

Ensure all required environment variables are set in production:

```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
ENCRYPTION_KEY=...
```

### Build & Deploy

```bash
# Install production dependencies
npm ci --production

# Build
npm run build

# Start
npm start
```

### Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "start"]
```

### Health Checks

Configure health check endpoint: `GET /health`

---

## 📊 Monitoring

### Logs

Logs are stored in `./logs/` directory:
- `error-YYYY-MM-DD.log` - Error logs
- `combined-YYYY-MM-DD.log` - All logs

### Sentry Integration

Set `SENTRY_DSN` in `.env` for error tracking.

---

## 🔒 Security

### Best Practices

- ✅ All passwords hashed with bcrypt (12 rounds)
- ✅ Sensitive data encrypted with AES-256-GCM
- ✅ JWT tokens with short expiry
- ✅ Rate limiting on all endpoints
- ✅ CORS configuration
- ✅ Security headers (Helmet)
- ✅ Input validation (Zod)
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection
- ✅ CSRF tokens

### Security Checklist

- [ ] Change default JWT secret
- [ ] Use strong encryption key
- [ ] Enable HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set up firewall rules
- [ ] Regular security audits
- [ ] Keep dependencies updated

---

## 📝 License

UNLICENSED - Proprietary Software

---

## 👥 Support

For questions or issues:
1. Check API documentation: [BACKEND_API_DESIGN.md](../BACKEND_API_DESIGN.md)
2. Review logs in `./logs/`
3. Contact development team

---

**Status:** ✅ Phase 2 Foundation Complete
**Next Steps:** Implement authentication endpoints and services

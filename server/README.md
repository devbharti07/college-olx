# Campus Classifieds — Backend Server (PostgreSQL + Prisma)

Backend API service for **Campus Classifieds**, a verified collegiate marketplace where students buy, sell, and exchange textbooks, engineering instruments, lab coats, electronics, and campus essentials.

> **Database Migration Notice**:
> MongoDB and Mongoose have been **completely removed** from the backend. The persistence layer now runs **exclusively on PostgreSQL** using the **Prisma ORM**. All MongoDB-specific identifiers (`ObjectId`), query operators (`$or`, `$regex`, `$in`), and connection modules have been replaced with standard PostgreSQL UUID primary keys, normalized relational tables, transactions, and Prisma client queries.

---

## 1. Prerequisites

* **Node.js**: `v20.0.0` or higher (tested on Node.js v24.12.0 LTS).
* **npm**: `v9.0.0` or higher.
* **PostgreSQL**: Version 14 or higher (schema and migrations built and tested for PostgreSQL 14–18).
* **Prisma ORM**: `^6.4.1` with native PostgreSQL engine client.

---

## 2. Installation & Setup

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   Configure your PostgreSQL connection string in `DATABASE_URL`:
   ```env
   NODE_ENV=development
   PORT=5000
   CLIENT_URL=http://localhost:5173

   # PostgreSQL Connection String (format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public)
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/campus_classifieds?schema=public

   # Authentication & Security
   JWT_SECRET=your-long-random-secret-at-least-32-characters
   JWT_EXPIRES_IN=15m
   ```

4. **Generate Prisma Client & Run Migrations:**
   ```bash
   # Generate Prisma client artifacts
   npm run prisma:generate

   # Apply migrations to your PostgreSQL database
   npm run prisma:migrate
   ```

---

## 3. Running the Server & Testing

### Development Mode (Native Watcher):
```bash
npm run dev
```
Starts the server with Node.js native watch mode (`node --watch src/server.js`), automatically reloading on code changes without extra dependencies.

### Production Start:
```bash
npm start
```

### Run Migration & Regression Test Suite:
```bash
npm test
```
Executes the comprehensive migration verification suite testing:
* Database health check and status reporting
* UUID primary key validation
* Enum bidirectional mapping (`BOOKS` <-> `books`, `LIKE_NEW` <-> `like-new`)
* Bcrypt password security (cost factor 12)
* JWT token claims and signature validation
* Institutional collegiate email validation (`.edu`, `.ac.in`, `.edu.in`)
* Listing DTO formatting and image normalization
* Messaging DTOs and join table participant mappings
* Report DTO and moderator notes protection
* Prisma error handling (`P2002`, `P2025`, `P2003`)
* Runtime verification of zero remaining MongoDB/Mongoose dependencies

---

## 4. Database Architecture & Schema (Prisma)

The Prisma schema is located at `server/prisma/schema.prisma`. It models all application entities with standard UUID primary keys and relational foreign keys.

### Entity Relationship Model:

```text
User (id: UUID)
 ├── Listings (sellerId)
 ├── SoldListings (soldTo)
 ├── Conversations (ConversationParticipant join table)
 ├── Messages (senderId)
 ├── MessageRead (MessageRead join table)
 ├── ReportsCreated (reporterId)
 └── ReportsAgainst (reportedUserId)

Listing (id: UUID)
 ├── Seller (User)
 ├── SoldTo (User, nullable)
 ├── Images (ListingImage table: 1-to-many, max 5)
 ├── Conversations (Conversation)
 └── Reports (Report)

Conversation (id: UUID)
 ├── Listing (Listing)
 ├── Participants (ConversationParticipant join table -> User)
 ├── Messages (Message)
 └── LastMessage (Message, nullable)

Message (id: UUID)
 ├── Conversation (Conversation)
 ├── Sender (User)
 └── ReadBy (MessageRead join table -> User)

Report (id: UUID)
 ├── Reporter (User)
 ├── Listing (Listing, nullable)
 └── ReportedUser (User, nullable)
```

### PostgreSQL Indexes:

* **Users**:
  * `email` (unique)
  * `collegeEmail` (unique)
  * `college`
  * `accountStatus`
* **Listings**:
  * `sellerId`
  * `status`
  * `category`
  * `condition`
  * `price`
  * `createdAt`
  * Compound: `(status, category, price, createdAt)`
  * Compound: `(status, sellerId)`
* **Conversations**:
  * `listingId`
  * `updatedAt`
* **Messages**:
  * Compound: `(conversationId, createdAt)`
* **Reports**:
  * Compound: `(reporterId, createdAt)`
  * Compound: `(status, createdAt)`
  * Compound: `(reporterId, listingId, reason)`
  * Compound: `(reporterId, reportedUserId, reason)`

---

## 5. Available API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Root server status & PostgreSQL DB state |
| `GET` | `/health` | Live PostgreSQL connectivity check (`SELECT 1`) |
| `GET` | `/api` | Base API status |
| `POST` | `/api/auth/register` | Register new student account |
| `POST` | `/api/auth/login` | Authenticate student credentials |
| `POST` | `/api/auth/logout` | Clear authentication session |
| `GET` | `/api/auth/me` | Current authenticated user profile |
| `GET` | `/api/auth/verify-email?token=` | Verify college email via link |
| `POST` | `/api/auth/verify-email` | Verify college email via body |
| `POST` | `/api/auth/resend-verification` | Resend verification email link |
| `GET` | `/api/users/me` | Current authenticated user profile |
| `PATCH` | `/api/users/me` | Update allowed profile fields |
| `GET` | `/api/users/:id` | Public seller profile (UUID required) |
| `GET` | `/api/listings` | Browse & search active listings (`?q=&category=&condition=&minPrice=&maxPrice=&location=&sort=&page=&limit=`) |
| `GET` | `/api/listings/mine` | Authenticated student's listings |
| `GET` | `/api/listings/:id` | Public single listing view (UUID required) |
| `POST` | `/api/listings` | Create listing (verified students) |
| `PATCH` | `/api/listings/:id` | Update owned listing fields |
| `PATCH` | `/api/listings/:id/status` | Update owned listing status (active <-> sold) |
| `DELETE` | `/api/listings/:id` | Soft-delete owned listing (sets status to 'removed') |
| `POST` | `/api/listings/:id/images` | Upload listing images (Cloudinary + PostgreSQL transaction) |
| `DELETE` | `/api/listings/:id/images` | Delete listing image by publicId |
| `GET` | `/api/messages/conversations` | List user's active conversations |
| `POST` | `/api/messages/conversations` | Create or retrieve conversation |
| `GET` | `/api/messages/conversations/:conversationId/messages` | Retrieve message history (paginated) |
| `POST` | `/api/messages/conversations/:conversationId/messages` | Send message in conversation |
| `PATCH` | `/api/messages/conversations/:conversationId/read` | Mark conversation messages as read |
| `POST` | `/api/reports` | File infraction report (verified students) |
| `GET` | `/api/reports/mine` | Authenticated student's filed reports |
| `*` | `/*` | 404 Route Not Found |

---

## 6. Migration Summary (MongoDB → PostgreSQL)

| Area | MongoDB / Mongoose Pattern | PostgreSQL / Prisma Implementation |
| :--- | :--- | :--- |
| **Driver / ORM** | `mongoose` (v8) | `prisma` & `@prisma/client` (`^6.4.1`) |
| **Configuration** | `MONGODB_URI`, `MONGODB_DB_NAME` | `DATABASE_URL=postgresql://...` |
| **Primary Keys** | `ObjectId` (24-hex characters) | `UUID v4` (`@id @default(uuid()) @db.Uuid`) |
| **Images** | Embedded JSON sub-document array | Normalized `ListingImage` relational table |
| **Participants** | `participants: [ObjectId]` array | Normalized `ConversationParticipant` join table |
| **Read Receipts** | `readBy: [ObjectId]` array | Normalized `MessageRead` join table |
| **Search Queries** | `$regex`, `$options: 'i'` | `mode: 'insensitive'`, `contains` in Prisma |
| **Sorting** | `{ createdAt: -1, _id: -1 }` | `[{ createdAt: 'desc' }, { id: 'desc' }]` |
| **Transactions** | MongoDB sessions (often omitted) | `prisma.$transaction([...])` atomic writes |
| **Error Codes** | `code: 11000`, `CastError`, `ValidationError` | `P2002` (409), `P2025` (404), `P2003` (400) |
| **Health Check** | `mongoose.connection.readyState` | Lightweight raw query: `SELECT 1` |

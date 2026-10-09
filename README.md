# Campus Classifieds - College Marketplace

A college-only marketplace where students can buy/sell used textbooks, lab equipment, bicycles, electronics, notes, hostel supplies, and collegiate gear.

## Architecture

- **Identity Provider (IdP):** Keycloak 26.1 (OpenID Connect / OAuth2 + PKCE)
- **Business Database:** PostgreSQL 16 via Prisma ORM
- **Backend API:** Node.js, Express, Socket.IO, Jose (JWKS)
- **Frontend SPA:** React 19, Vite 8, Tailwind CSS 4, keycloak-js

### Identity & Data Separation

```
Keycloak (Identity & Auth Provider)
  ├── Sessions, Passwords, Refresh Tokens
  ├── Google Identity Provider (Optional)
  ├── Realm: campus-classifieds
  └── Client: campus-classifieds-web (Public PKCE)
         │ (Bearer Token with sub = keycloakUserId)
         ▼
Express API Backend
  ├── Verifies Keycloak JWT against JWKS (/protocol/openid-connect/certs)
  ├── Idempotently maps token.sub -> User.keycloakUserId in PostgreSQL
  └── Enforces College Verification (isVerified) & Role-Based Authorization
         │
         ▼
PostgreSQL Database (Prisma)
  ├── campus_classifieds (Listings, Images, Messages, Conversations, Reports)
  └── No passwords or auth secrets stored in application database
```

---

## Prerequisites

1. **Docker & Docker Compose** (Recommended for local dev) or local PostgreSQL & Keycloak installations.
2. **Node.js** (>= 20.0.0) & **npm**.

---

## Quick Start (Complete Local System)

### 1. Start Infrastructure (PostgreSQL & Keycloak)

```bash
docker compose up -d
```

This launches:
- **PostgreSQL** on `localhost:5432` with separate databases: `campus_classifieds` and `keycloak`.
- **Keycloak** on `http://localhost:8080` with pre-imported realm `campus-classifieds`, client `campus-classifieds-web`, and roles `student`, `admin`.

Admin Console: `http://localhost:8080/admin` (User: `admin`, Password: `admin`).

### 2. Configure Environment

Frontend (`.env` in root):
```env
VITE_API_URL=http://localhost:5000
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=campus-classifieds
VITE_KEYCLOAK_CLIENT_ID=campus-classifieds-web
```

Backend (`server/.env`):
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/campus_classifieds?schema=public

KEYCLOAK_ISSUER_URL=http://localhost:8080/realms/campus-classifieds
KEYCLOAK_REALM=campus-classifieds
KEYCLOAK_CLIENT_ID=campus-classifieds-web
KEYCLOAK_JWKS_URI=http://localhost:8080/realms/campus-classifieds/protocol/openid-connect/certs
```

### 3. Apply Database Migrations & Generate Prisma Client

```bash
cd server
npm install
npm run prisma:generate
npm run prisma:migrate
```

### 4. Start Backend Server

```bash
cd server
npm run dev
```

API Server runs at: `http://localhost:5000`

### 5. Start Frontend Development Server

```bash
cd ..
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Authentication & Authorization Model

1. **Keycloak Authentication:**
   - Single source of truth for student identity.
   - Handled via Authorization Code flow with PKCE (`S256`).
   - Access tokens handled in-memory by `keycloak-js`; never persisted in `localStorage`.
   - Automatic token renewal handled via `keycloak.updateToken()`.
2. **User Provisioning:**
   - On first authenticated request, the backend idempotently links or provisions an application user using `keycloakUserId: token.sub`.
   - No passwords or hashes are ever saved in the PostgreSQL application tables.
3. **Collegiate Verification:**
   - Users registering with approved collegiate institutional emails (`.edu`, `.edu.in`, `.ac.in`) are automatically verified (`isVerified = true`).
   - Other users must submit and verify their college email address via `/api/auth/college-email` to unlock seller and real-time messaging capabilities.
4. **Socket.IO Real-Time Chat Auth:**
   - Handshake verifies Keycloak bearer token against JWKS.
   - Attaches authenticated user and validates participant room membership.

---

## Optional Google Login Setup in Keycloak

To enable Google Single Sign-On:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Web application).
3. Authorized Redirect URI: `http://localhost:8080/realms/campus-classifieds/broker/google/endpoint`
4. Open Keycloak Admin Console (`http://localhost:8080/admin`) -> Select Realm `campus-classifieds` -> **Identity Providers** -> Select **Google**.
5. Enter **Client ID** and **Client Secret** and click **Save**.
6. The frontend login page's "Continue with Google" button will automatically route through Google OAuth.

---

## Running Tests & Verifications

```bash
# Frontend Lint & Production Build
npm run lint
npm run build

# Backend Tests (Keycloak Token Validation, Authorization, DTO Isolation)
cd server
npm test
```

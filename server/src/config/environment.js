import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve current directory path in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly locate the .env file in server root
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Determine environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

// Resolve and validate PORT
const rawPort = process.env.PORT || '5000';
const parsedPort = parseInt(rawPort, 10);
if (isNaN(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
  throw new Error(`Invalid PORT configuration: "${rawPort}". Must be a valid port number between 1 and 65535.`);
}
const PORT = parsedPort;

// Resolve and sanitize CLIENT_URL
const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
// Strip trailing slash if present for strict CORS matching
const CLIENT_URL = rawClientUrl.replace(/\/+$/, '');

// PostgreSQL Database Configuration (Prisma)
const DATABASE_URL = process.env.DATABASE_URL || '';

// Keycloak Configuration (Phase 4 & Phase 6)
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'campus-classifieds';
const KEYCLOAK_ISSUER_URL =
  process.env.KEYCLOAK_ISSUER_URL || `http://localhost:8080/realms/${KEYCLOAK_REALM}`;
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'campus-classifieds-web';
const KEYCLOAK_JWKS_URI =
  process.env.KEYCLOAK_JWKS_URI || `${KEYCLOAK_ISSUER_URL}/protocol/openid-connect/certs`;

const KEYCLOAK_SERVER_URL = process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080';
const KEYCLOAK_ADMIN_USER = process.env.KEYCLOAK_ADMIN || 'admin';
const KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';

// Keycloak SMTP Configuration (Dev: Mailpit, Prod: Gmail SMTP / Provider-Agnostic)
const KC_SMTP_HOST = process.env.KC_SMTP_HOST || 'mailpit';
const KC_SMTP_PORT = process.env.KC_SMTP_PORT || '1025';
const KC_SMTP_FROM = process.env.KC_SMTP_FROM || 'noreply@campus-classifieds.local';
const KC_SMTP_FROM_DISPLAY = process.env.KC_SMTP_FROM_DISPLAY || 'Campus Classifieds';
const KC_SMTP_AUTH = String(process.env.KC_SMTP_AUTH || 'false').toLowerCase() === 'true';
const KC_SMTP_STARTTLS = String(process.env.KC_SMTP_STARTTLS || 'false').toLowerCase() === 'true';
const KC_SMTP_SSL = String(process.env.KC_SMTP_SSL || 'false').toLowerCase() === 'true';
const KC_SMTP_USER = process.env.KC_SMTP_USER || '';
const KC_SMTP_PASSWORD = process.env.KC_SMTP_PASSWORD || '';

// Verification & Email Configuration (Phase B4)
const verificationTokenExpiresMinutes = parseInt(
  process.env.VERIFICATION_TOKEN_EXPIRES_MINUTES || '15',
  10
);
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || (isProduction ? 'resend' : 'development');
const EMAIL_FROM = process.env.EMAIL_FROM || 'Campus Classifieds <onboarding@resend.dev>';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || '';

// Cloudinary Configuration (Phase B7)
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'campus-classifieds/listings';

export const config = {
  env: NODE_ENV,
  isProduction,
  isTest,
  port: PORT,
  clientUrl: CLIENT_URL,
  database: {
    url: DATABASE_URL,
  },
  keycloak: {
    serverUrl: KEYCLOAK_SERVER_URL,
    realm: KEYCLOAK_REALM,
    issuerUrl: KEYCLOAK_ISSUER_URL,
    clientId: KEYCLOAK_CLIENT_ID,
    jwksUri: KEYCLOAK_JWKS_URI,
    adminUser: KEYCLOAK_ADMIN_USER,
    adminPassword: KEYCLOAK_ADMIN_PASSWORD,
    smtp: {
      host: KC_SMTP_HOST,
      port: KC_SMTP_PORT,
      from: KC_SMTP_FROM,
      fromDisplayName: KC_SMTP_FROM_DISPLAY,
      auth: KC_SMTP_AUTH,
      starttls: KC_SMTP_STARTTLS,
      ssl: KC_SMTP_SSL,
      user: KC_SMTP_USER,
      password: KC_SMTP_PASSWORD,
    },
  },
  verification: {
    expiresMinutes: isNaN(verificationTokenExpiresMinutes) ? 15 : verificationTokenExpiresMinutes,
  },
  email: {
    provider: EMAIL_PROVIDER,
    from: EMAIL_FROM,
    apiKey: EMAIL_API_KEY,
  },
  cloudinary: {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    apiSecret: CLOUDINARY_API_SECRET,
    folder: CLOUDINARY_FOLDER,
  },
};

export default config;

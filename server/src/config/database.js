import { PrismaClient } from '@prisma/client';
import config from './environment.js';

let isConnected = false;

// Global singleton instance of PrismaClient
export const prisma = new PrismaClient({
  log: config.isProduction ? ['error', 'warn'] : ['error', 'warn'],
});

/**
 * Retrieve current PostgreSQL connection status.
 */
export const getDatabaseStatus = () => {
  return {
    state: isConnected ? 'connected' : 'disconnected',
    isConnected,
    dbType: 'PostgreSQL',
  };
};

/**
 * Connect to PostgreSQL and verify connectivity using a lightweight query (SELECT 1).
 */
export const connectDatabase = async () => {
  const url = config.database.url;

  if (!url || !url.trim()) {
    throw new Error(
      'DATABASE_URL is missing from environment configuration. Please configure DATABASE_URL in server/.env.'
    );
  }

  try {
    // Verify genuine database connection with lightweight query
    await prisma.$queryRaw`SELECT 1`;
    isConnected = true;
    console.log('[DATABASE] Connected successfully to PostgreSQL via Prisma.');
    return prisma;
  } catch (error) {
    isConnected = false;
    console.error(`[DATABASE] Connection error: ${error.message}`);
    throw error;
  }
};

/**
 * Disconnect cleanly from PostgreSQL.
 */
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    isConnected = false;
    console.log('[DATABASE] Disconnected from PostgreSQL cleanly.');
  } catch (error) {
    console.error(`[DATABASE] Disconnect error: ${error.message}`);
  }
};

export default {
  prisma,
  connectDatabase,
  disconnectDatabase,
  getDatabaseStatus,
};

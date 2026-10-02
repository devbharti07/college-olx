/**
 * ============================================================================
 * Admin Service (Frontend API Service Layer)
 * ============================================================================
 * Defines methods for moderator queries: metrics, users list, listings list,
 * and infraction reports.
 * Pure frontend stub ready for administrator backend API connection.
 * Returns empty/unavailable states instead of fake production numbers.
 * ============================================================================
 */

export const adminService = {
  /**
   * Get administrative metrics and KPI summary.
   * Returns null/unavailable state indicating backend is not connected.
   */
  getMetrics: async () => {
    return {
      totalUsers: null,
      totalListings: null,
      activeListings: null,
      soldListings: null,
      pendingReports: null,
      backendConnected: false,
    };
  },

  /**
   * Get registered student users.
   */
  getUsers: async () => {
    return [];
  },

  /**
   * Get campus marketplace listings.
   */
  getListings: async () => {
    return [];
  },

  /**
   * Get community infraction reports.
   */
  getReports: async () => {
    return [];
  },
};

export default adminService;

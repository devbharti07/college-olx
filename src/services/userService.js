/**
 * ============================================================================
 * User Service (Real Backend API Layer)
 * ============================================================================
 * Communicates with backend endpoints under /api/users.
 * Handles current student profile retrieval, profile updates, and public seller
 * profile lookups.
 * ============================================================================
 */

import apiClient from './apiClient.js';

export const userService = {
  /**
   * Get current authenticated student profile.
   * GET /api/users/me
   * @returns {Promise<Object>}
   */
  getProfile: async () => {
    const data = await apiClient.get('/users/me');
    return data?.user || data;
  },

  /**
   * Update student profile fields.
   * PATCH /api/users/me
   * @param {Object} updates - Allowed editable fields: name, avatar, department, pickupSpot, college
   * @returns {Promise<{ user: Object }>}
   */
  updateProfile: async (updates) => {
    const data = await apiClient.patch('/users/me', updates);
    return {
      success: true,
      data: data?.user || data,
      message: 'Profile updated successfully.',
    };
  },

  /**
   * Get public sanitized seller profile by user ID.
   * GET /api/users/:id
   * @param {string} id - User UUID
   * @returns {Promise<Object>}
   */
  getPublicProfile: async (id) => {
    const data = await apiClient.get(`/users/${id}`);
    return data?.user || data;
  },
};

export default userService;

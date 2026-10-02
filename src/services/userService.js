/**
 * ============================================================================
 * User Service (Frontend API Service Layer)
 * ============================================================================
 * Defines methods for student profile retrieval, profile update, and user listings.
 * Pure frontend stub ready for backend user API integration.
 * No filler user profile or fake statistics are returned in production UI.
 * ============================================================================
 */

const PROFILE_STORAGE_KEY = 'campus_classifieds_profile';
const LISTINGS_STORAGE_KEY = 'campus_classifieds_listings';

function getStoredProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse local profile:', e);
  }
  return null;
}

function getStoredListings() {
  try {
    const raw = localStorage.getItem(LISTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse local listings:', e);
  }
  return [];
}

export const userService = {
  /**
   * Get student profile.
   * Returns saved session profile if any, otherwise null (clean empty state).
   */
  getProfile: async () => {
    return getStoredProfile();
  },

  /**
   * Update student profile in local storage.
   */
  updateProfile: async (updates) => {
    const current = getStoredProfile() || {};
    const updated = { ...current, ...updates };
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save profile to localStorage:', e);
    }
    return {
      success: true,
      data: updated,
      message: 'Profile updated in this session.',
    };
  },

  /**
   * Get user's own listings from the shared frontend listings store.
   */
  getMyListings: async () => {
    return getStoredListings();
  },
};

export default userService;

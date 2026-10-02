/**
 * API Client configuration placeholder.
 * Ready for future backend service integration (REST/GraphQL).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = {
  baseUrl: API_BASE_URL,
  // Helper methods can be implemented when backend services are ready.
};

export default apiClient;

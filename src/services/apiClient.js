/**
 * ============================================================================
 * Centralized API Client Service
 * ============================================================================
 * Production-ready HTTP client wrapper with:
 * - Base URL resolution from environment (VITE_API_URL or fallback /api)
 * - Automatic Authorization header injection from stored JWT session
 * - Credentials transmission for HTTP-only cookie support
 * - JSON and FormData handling (automatic multipart boundary resolution)
 * - Standardized error extraction matching backend ApiError format
 * ============================================================================
 */

const rawApiUrl =
  (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_URL) ||
  (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_BASE_URL) ||
  (typeof process !== 'undefined' && process?.env?.VITE_API_URL) ||
  (typeof process !== 'undefined' && process?.env?.VITE_API_BASE_URL) ||
  '/api';

const API_BASE_URL = (() => {
  const trimmed = String(rawApiUrl || '/api').trim().replace(/\/+$/, '');
  if (!trimmed || trimmed === '/api') return '/api';
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
})();

/**
 * Custom application API error wrapping status code and backend error details.
 */
export class ApiClientError extends Error {
  constructor(status, code, message, details = null) {
    super(message || 'An unexpected API error occurred.');
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code || 'API_ERROR';
    this.details = details;
  }
}

// In-memory token provider function (provided by Keycloak AuthProvider)
let currentTokenProvider = null;
let inMemoryToken = null;

/**
 * Configure dynamic in-memory token provider (Keycloak adapter).
 * @param {Function} provider - Async function returning valid access token
 */
export function setTokenProvider(provider) {
  currentTokenProvider = provider;
}

/**
 * Retrieve active auth token from in-memory provider.
 * Tokens are never persisted in localStorage.
 */
export async function getActiveToken() {
  if (typeof currentTokenProvider === 'function') {
    try {
      const token = await currentTokenProvider();
      if (token) return token;
    } catch (err) {
      console.warn('[ApiClient] Failed to obtain token from provider:', err);
    }
  }
  return inMemoryToken || null;
}

// Backward-compatibility shims (in-memory only)
export function getStoredToken() {
  return inMemoryToken;
}

export function setStoredToken(token) {
  inMemoryToken = token || null;
}

export function clearStoredToken() {
  inMemoryToken = null;
}

/**
 * Core HTTP request handler.
 *
 * @param {string} endpoint - Relative path (e.g. '/listings' or '/auth/me')
 * @param {Object} options - Fetch options (method, body, headers, params, etc.)
 * @returns {Promise<any>} Parsed response data
 */
export async function request(endpoint, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    params,
    ...customConfig
  } = options;

  // Build clean URL
  let cleanEndpoint = endpoint.replace(/^\/+/, '');
  if (cleanEndpoint.startsWith('api/')) {
    cleanEndpoint = cleanEndpoint.replace(/^api\//, '');
  }

  let url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL.replace(/\/+$/, '')}/${cleanEndpoint}`;

  if (params && typeof params === 'object') {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const reqHeaders = { ...headers };

  // Dynamically obtain and attach fresh in-memory Keycloak Bearer token
  if (!reqHeaders.Authorization && !reqHeaders.authorization) {
    const token = await getActiveToken();
    if (token) {
      reqHeaders.Authorization = `Bearer ${token}`;
    }
  }

  // Handle request payload
  let reqBody = body;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (body && !isFormData && typeof body === 'object') {
    reqHeaders['Content-Type'] = 'application/json';
    reqBody = JSON.stringify(body);
  } else if (!isFormData && !reqHeaders['Content-Type'] && method !== 'GET') {
    reqHeaders['Content-Type'] = 'application/json';
  }

  // Fetch configuration
  const config = {
    method,
    headers: reqHeaders,
    body: reqBody,
    credentials: 'include', // Support HTTP-only cookie session
    ...customConfig,
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch {
    throw new ApiClientError(
      0,
      'NETWORK_ERROR',
      'Unable to connect to the Campus Classifieds server. Please verify your connection or ensure the backend server is running.'
    );
  }

  // Parse response
  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  // Handle error HTTP status codes
  if (!response.ok) {
    const status = response.status;
    const errorCode = data?.error?.code || `HTTP_${status}`;
    const errorMessage =
      data?.error?.message ||
      data?.message ||
      (status === 404 ? 'Resource not found.' : 'API request failed.');
    const details = data?.error?.details || null;

    // If unauthorized, clear invalid token
    if (status === 401 && endpoint !== '/auth/login') {
      clearStoredToken();
    }

    throw new ApiClientError(status, errorCode, errorMessage, details);
  }

  // Unpack standardized ApiResponse wrapper if present
  if (data && typeof data === 'object' && 'success' in data) {
    return data.data !== undefined ? data.data : data;
  }

  return data;
}

export const apiClient = {
  baseUrl: API_BASE_URL,
  request,
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'DELETE', body }),
  upload: (endpoint, formData, options = {}) =>
    request(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    }),
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  setTokenProvider,
};

export default apiClient;

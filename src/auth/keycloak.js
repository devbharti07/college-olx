import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'campus-classifieds',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'campus-classifieds-web',
};

// Singleton Keycloak client instance
let keycloakInstance = null;

export const getKeycloak = () => {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak(keycloakConfig);
  }
  return keycloakInstance;
};

let initPromise = null;

export const resetKeycloakInit = () => {
  initPromise = null;
  keycloakInstance = null;
};

/**
 * Initialize Keycloak with check-sso session restoration and PKCE S256.
 * Fails gracefully if Keycloak server is offline or unreachable so public pages never crash.
 *
 * @returns {Promise<{ keycloak: Keycloak, authenticated: boolean, isOffline: boolean }>}
 */
export const initKeycloak = () => {
  if (initPromise) return initPromise;

  const keycloak = getKeycloak();

  initPromise = (async () => {
    try {
      const authenticated = await keycloak.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false, // Prevents third-party cookie blocking issues
      });

      return {
        keycloak,
        authenticated: Boolean(authenticated),
        isOffline: false,
      };
    } catch (err) {
      console.warn(
        '[Keycloak] Identity Provider unavailable or offline at',
        keycloakConfig.url,
        '- running in public guest mode.',
        err?.message || err
      );
      initPromise = null; // Reset so retry can succeed
      return {
        keycloak,
        authenticated: false,
        isOffline: true,
      };
    }
  })();

  return initPromise;
};

/**
 * Get active access token, refreshing in-memory if expired or within minValidity window.
 * Tokens are never persisted in localStorage.
 *
 * @param {number} minValidity - Seconds before expiry to trigger automatic refresh (default 30)
 * @returns {Promise<string|null>}
 */
export const getValidToken = async (minValidity = 30) => {
  const keycloak = getKeycloak();
  if (!keycloak || !keycloak.authenticated) {
    return null;
  }

  try {
    // Refresh token in memory if it expires within minValidity seconds
    await keycloak.updateToken(minValidity);
    return keycloak.token || null;
  } catch (err) {
    console.warn('[Keycloak] Token refresh failed, session expired:', err);
    return null;
  }
};

/**
 * Force an immediate token refresh against Keycloak server, regardless of expiration.
 * Used after the user clicks the verification link in their email to fetch updated
 * email_verified claim without logging out or reloading the page.
 *
 * @returns {Promise<{ token: string, emailVerified: boolean }|null>}
 */
export const forceRefreshToken = async () => {
  const keycloak = getKeycloak();
  if (!keycloak || !keycloak.authenticated) {
    return null;
  }

  try {
    // Passing -1 forces Keycloak to refresh the token from server immediately
    const refreshed = await keycloak.updateToken(-1);
    const parsed = keycloak.tokenParsed;
    return {
      token: keycloak.token,
      emailVerified: Boolean(parsed?.email_verified),
      refreshed: Boolean(refreshed),
      parsed,
    };
  } catch (err) {
    console.warn('[Keycloak] Force token refresh failed:', err);
    return null;
  }
};

/**
 * Redirect to Keycloak login page.
 * @param {Object} options - { redirectUri, idpHint, etc. }
 */
export const login = (options = {}) => {
  const keycloak = getKeycloak();
  const redirectUri = options.redirectUri || window.location.origin + '/listings';
  return keycloak.login({
    redirectUri,
    ...options,
  });
};

/**
 * Redirect to Keycloak registration page.
 * @param {Object} options - { redirectUri }
 */
export const register = (options = {}) => {
  const keycloak = getKeycloak();
  const redirectUri = options.redirectUri || window.location.origin + '/listings';
  return keycloak.register({
    redirectUri,
    ...options,
  });
};

/**
 * Redirect to Keycloak password reset flow.
 * Directs user to Keycloak's native reset-credentials endpoint.
 * Passwords and recovery tokens are managed solely by Keycloak.
 *
 * @param {Object} options - { redirectUri }
 */
export const resetPassword = (options = {}) => {
  const redirectUri = options.redirectUri || window.location.origin + '/login';
  const url = `${keycloakConfig.url}/realms/${encodeURIComponent(
    keycloakConfig.realm
  )}/login-actions/reset-credentials?client_id=${encodeURIComponent(
    keycloakConfig.clientId
  )}&tab_id=reset&client_data=${encodeURIComponent(btoa(JSON.stringify({ ru: redirectUri })))}`;
  window.location.href = url;
};

/**
 * Log out of Keycloak session and clear in-memory state.
 * @param {Object} options - { redirectUri }
 */
export const logout = (options = {}) => {
  const keycloak = getKeycloak();
  const redirectUri = options.redirectUri || window.location.origin + '/';
  if (keycloak && keycloak.authenticated) {
    return keycloak.logout({
      redirectUri,
      ...options,
    });
  }
  return Promise.resolve();
};

export default {
  getKeycloak,
  initKeycloak,
  resetKeycloakInit,
  getValidToken,
  forceRefreshToken,
  login,
  register,
  resetPassword,
  logout,
};


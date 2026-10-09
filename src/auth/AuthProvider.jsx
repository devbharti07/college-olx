import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import {
  initKeycloak,
  resetKeycloakInit,
  getValidToken,
  forceRefreshToken,
  login as keycloakLogin,
  register as keycloakRegister,
  resetPassword as keycloakResetPassword,
  logout as keycloakLogout,
} from './keycloak';
import apiClient, { setTokenProvider } from '../services/apiClient';
import messageService, { setTokenGetter } from '../services/messageService';

/**
 * Error boundary to catch any fatal rendering or authentication exceptions
 * and display a user-friendly recovery UI instead of a blank screen.
 */
class AuthErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AuthErrorBoundary] Uncaught component exception:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-md w-full p-8 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-lg text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Authentication service unavailable
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              An unexpected error occurred during application initialization.
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [initAttempt, setInitAttempt] = useState(0);

  // keycloakEmailVerified: email_verified claim from the Keycloak JWT (in-memory, never persisted)
  // null = not yet known; true/false = authoritative from backend
  const [keycloakEmailVerified, setKeycloakEmailVerified] = useState(null);

  /**
   * Rehydrate user profile from PostgreSQL backend.
   * The backend enriches the profile with keycloakEmailVerified from the verified JWT.
   */
  const fetchUserProfile = useCallback(async (activeToken) => {
    try {
      const response = await apiClient.get('/auth/me', {
        headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {},
      });
      if (response?.user) {
        const profile = response.user;
        setUser(profile);
        // Persist keycloakEmailVerified from backend (authoritative — derived from verified JWT claim)
        if (profile.keycloakEmailVerified !== null && profile.keycloakEmailVerified !== undefined) {
          setKeycloakEmailVerified(Boolean(profile.keycloakEmailVerified));
        }
        return profile;
      }
    } catch (err) {
      console.warn('[Auth] Failed to load application profile from backend:', err?.message);
    }
    return null;
  }, []);

  const retryInit = useCallback(() => {
    setIsLoading(true);
    setAuthError(null);
    setIsOffline(false);
    resetKeycloakInit();
    setInitAttempt((prev) => prev + 1);
  }, []);

  // Initialize Keycloak and register token provider for API client
  useEffect(() => {
    let isMounted = true;

    // Register in-memory token provider for apiClient
    if (typeof setTokenProvider === 'function') {
      setTokenProvider(getValidToken);
    }

    // Register token getter for Socket.IO safely
    if (typeof setTokenGetter === 'function') {
      setTokenGetter(getValidToken);
    } else if (typeof messageService?.setTokenGetter === 'function') {
      messageService.setTokenGetter(getValidToken);
    }

    const initialize = async () => {
      try {
        const { keycloak, authenticated, isOffline: offline } = await initKeycloak();

        if (!isMounted) return;

        if (offline) {
          setIsOffline(true);
          setIsLoading(false);
          return;
        }

        if (authenticated && keycloak?.token) {
          setToken(keycloak.token);
          setIsAuthenticated(true);

          // Read email_verified directly from the token claims (in-memory, not persisted)
          const parsedToken = keycloak.tokenParsed;
          const emailVerifiedFromToken = Boolean(parsedToken?.email_verified);
          setKeycloakEmailVerified(emailVerifiedFromToken);

          // Configure Keycloak token renewal hooks
          keycloak.onTokenExpired = async () => {
            try {
              const freshToken = await getValidToken(30);
              if (isMounted && freshToken) {
                setToken(freshToken);
                // Re-read email_verified from the refreshed token
                const freshParsed = keycloak.tokenParsed;
                if (freshParsed) {
                  setKeycloakEmailVerified(Boolean(freshParsed.email_verified));
                }
              }
            } catch (err) {
              console.error('[Keycloak] Auto-refresh failed:', err);
            }
          };

          keycloak.onAuthLogout = () => {
            if (isMounted) {
              setUser(null);
              setToken(null);
              setIsAuthenticated(false);
              setKeycloakEmailVerified(null);
              messageService?.disconnectSocket?.();
            }
          };

          // Rehydrate live profile from PostgreSQL (backend enriches with keycloakEmailVerified)
          const profile = await fetchUserProfile(keycloak.token);
          if (isMounted && !profile) {
            // Fallback user metadata from Keycloak token parsed claims
            const roles = parsedToken?.realm_access?.roles || [];
            setUser({
              id: parsedToken?.sub,
              keycloakUserId: parsedToken?.sub,
              name: parsedToken?.name || parsedToken?.preferred_username || 'Student User',
              email: parsedToken?.email || '',
              role: roles.includes('admin') ? 'admin' : 'student',
              isVerified: false, // Conservative default: require explicit verification
              keycloakEmailVerified: emailVerifiedFromToken,
              college: 'Campus',
            });
          }

          // Only connect Socket.IO if both email verification layers pass
          if (emailVerifiedFromToken) {
            messageService?.connectSocket?.();
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setToken(null);
          setKeycloakEmailVerified(null);
        }
      } catch (err) {
        console.warn('[Keycloak] Unexpected auth initialization error:', err);
        if (isMounted) {
          setAuthError(err?.message || 'Authentication service unavailable');
          setIsOffline(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [fetchUserProfile, initAttempt]);

  const login = useCallback((options) => {
    return keycloakLogin(options);
  }, []);

  const register = useCallback((options) => {
    return keycloakRegister(options);
  }, []);

  const resetPassword = useCallback((options) => {
    return keycloakResetPassword(options);
  }, []);

  const logout = useCallback(async (options) => {
    try {
      await apiClient.post('/auth/logout', {}).catch(() => {});
    } finally {
      messageService?.disconnectSocket?.();
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      setKeycloakEmailVerified(null);
      keycloakLogout(options);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = await getValidToken();
    return fetchUserProfile(currentToken);
  }, [fetchUserProfile]);

  /**
   * Force an immediate refresh of Keycloak token claims.
   * If the user clicked the verification link in Mailpit/email, this fetches the new
   * access token with email_verified: true and updates state immediately.
   */
  const refreshEmailVerification = useCallback(async () => {
    try {
      const refreshed = await forceRefreshToken();
      if (refreshed) {
        if (refreshed.token) {
          setToken(refreshed.token);
        }
        setKeycloakEmailVerified(Boolean(refreshed.emailVerified));
        const profile = await fetchUserProfile(refreshed.token);
        return {
          verified: Boolean(refreshed.emailVerified),
          profile,
        };
      }
      return { verified: false };
    } catch (err) {
      console.warn('[Auth] Failed to refresh email verification status:', err);
      return { verified: false, error: err?.message };
    }
  }, [fetchUserProfile]);

  const isAdmin = Boolean(
    user?.role === 'admin' ||
    user?.role === 'ADMIN'
  );

  const value = {
    user,
    token,
    isAuthenticated,
    /**
     * keycloakEmailVerified: reflects the email_verified claim from the Keycloak JWT.
     * This is the FIRST verification gate — user must have clicked the Keycloak
     * verification link in their email inbox.
     * null = not yet determined (during init).
     */
    keycloakEmailVerified,
    /**
     * isVerified: college/institutional email verification in PostgreSQL.
     * This is the SECOND verification gate — user must have submitted a .edu/.ac.in
     * email and clicked the college verification link.
     */
    isVerified: Boolean(user?.isVerified),
    isAdmin,
    isLoading,
    isOffline,
    authError,
    retryInit,
    login,
    register,
    resetPassword,
    logout,
    refreshUser,
    refreshEmailVerification,
    forceRefreshToken,
    getToken: getValidToken,
  };

  return (
    <AuthErrorBoundary>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </AuthErrorBoundary>
  );
}

export default AuthProvider;

/**
 * Authentication utilities for OHIF token-based access
 */

/**
 * Checks if the current user is authenticated via token
 */
export function isTokenAuthenticated(userAuthenticationService: any): boolean {
  try {
    const user = userAuthenticationService.getUser();
    return user && user.profile && user.profile.user_type === 'token';
  } catch (error) {
    return false;
  }
}

/**
 * Checks if authentication is required for the current context
 */
export function shouldBypassAuthentication(userAuthenticationService: any, location: any): boolean {
  if (isTokenAuthenticated(userAuthenticationService)) {
    return true;
  }

  const urlParams = new URLSearchParams(location.search);
  const hasToken = urlParams.has('token');
  
  if (hasToken) {
    const token = urlParams.get('token');
    return validateTokenFormat(token);
  }

  return false;
}

/**
 * Validates basic JWT token format
 */
export function validateTokenFormat(token: string | null): boolean {
  if (!token) {
    return false;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    const payload = JSON.parse(atob(parts[1]));
    return payload.sub && payload.exp && payload.studyAccess && Array.isArray(payload.studyAccess);
  } catch (error) {
    return false;
  }
}

/**
 * Gets user context for token-authenticated users
 */
export function getTokenUserContext(userAuthenticationService: any) {
  try {
    if (!isTokenAuthenticated(userAuthenticationService)) {
      return null;
    }

    const user = userAuthenticationService.getUser();
    return {
      id: user.profile?.sub,
      type: 'token',
      name: user.profile?.name || `Token User ${user.profile?.sub}`,
      authenticated: true,
      expires_at: user.expires_at
    };
  } catch (error) {
    return null;
  }
}
import { URLTokenManager } from '../../utils/urlTokenManager';

/**
 * Updates the user authentication service with the provided token and cleans the token from the URL.
 * Implements enhanced token-based authentication for secure OHIF access.
 * @param token - The JWT token to set in the user authentication service.
 * @param location - The location object from the router.
 * @param userAuthenticationService - The user authentication service instance.
 * @param query - Query parameters for additional context.
 */
export function updateAuthServiceAndCleanUrl(
  token: string,
  location: any,
  userAuthenticationService: any,
  query?: URLSearchParams
): void {
  if (!token) {
    return;
  }

  try {
    // Validate token format (basic JWT structure check)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.warn('Invalid token format provided');
      return;
    }

    // Extract basic token information for logging (without sensitive data)
    let tokenInfo = null;
    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      tokenInfo = {
        sub: payload.sub,
        exp: payload.exp,
        iat: payload.iat,
        studyCount: payload.studyAccess?.length || 0
      };
    } catch (e) {
      console.warn('Could not parse token payload for logging');
    }

    // Set up token-based authentication
    userAuthenticationService.setServiceImplementation({
      getAuthorizationHeader: () => ({
        Authorization: 'Bearer ' + token,
      }),
      getUser: () => ({
        access_token: token,
        token_type: 'Bearer',
        profile: tokenInfo ? {
          sub: tokenInfo.sub,
          name: `Token User ${tokenInfo.sub}`,
          user_type: 'token'
        } : null,
        expires_at: tokenInfo?.exp,
        expired: tokenInfo?.exp ? tokenInfo.exp < Math.floor(Date.now() / 1000) : false
      }),
      handleUnauthenticated: () => {
        console.warn('Token-based user became unauthenticated');
        // For token users, redirect to an error page or show message
        // instead of redirecting to login
        window.location.href = '/?error=token_expired';
      }
    });

    // Set authentication state
    userAuthenticationService.set({ 
      enabled: true,
      user: {
        access_token: token,
        token_type: 'Bearer',
        profile: tokenInfo ? {
          sub: tokenInfo.sub,
          name: `Token User ${tokenInfo.sub}`,
          user_type: 'token'
        } : null,
        expires_at: tokenInfo?.exp,
        expired: false
      }
    });

    console.log('Token-based authentication configured successfully', {
      user: tokenInfo?.sub,
      studyCount: tokenInfo?.studyCount,
      expiresAt: tokenInfo?.exp ? new Date(tokenInfo.exp * 1000).toISOString() : 'unknown'
    });

  } catch (error) {
    console.error('Error setting up token-based authentication:', error);
    return;
  }

  // Clean the token from URL using enhanced manager
  const tokenManager = URLTokenManager.getInstance();
  tokenManager.cleanTokenFromURL({
    preserveHistory: false,
    logCleanup: true
  });
}

/**
 * Removes the token parameter from the current URL and updates browser history.
 * @param location - The location object from the router.
 */
function cleanTokenFromUrl(location: any): void {
  try {
    // Create a URL object with the current location
    const urlObj = new URL(window.location.origin + window.location.pathname + location.search);

    // Remove the token from the URL object
    urlObj.searchParams.delete('token');
    const cleanUrl = urlObj.toString();

    // Update the browser's history without the token
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', cleanUrl);
    }

    console.log('Token successfully removed from URL');
  } catch (error) {
    console.warn('Failed to clean token from URL:', error);
  }
}

/**
 * Validates if the current request has a valid token context.
 * This is used to determine if token-based authentication should be used.
 * @param query - URL search parameters
 * @returns boolean indicating if token authentication should be used
 */
export function hasValidTokenContext(query: URLSearchParams): boolean {
  const token = query.get('token');
  if (!token) {
    return false;
  }

  // Basic JWT format validation
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    return false;
  }

  try {
    // Check if token is not expired (basic client-side check)
    const payload = JSON.parse(atob(tokenParts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < currentTime) {
      console.warn('Token appears to be expired');
      return false;
    }

    // Check for required claims
    if (!payload.studyAccess || !Array.isArray(payload.studyAccess)) {
      console.warn('Token missing required studyAccess claim');
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Token validation failed:', error);
    return false;
  }
}

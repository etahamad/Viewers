interface KeycloakConfig {
  authority: string;
  clientId: string;
  realm?: string;
}

/**
 * Validates a Keycloak token by calling the token introspection endpoint
 * @param token - The token to validate
 * @param config - Keycloak configuration
 * @returns Promise<boolean> - True if token is valid and active
 */
async function validateKeycloakToken(
  token: string,
  config: KeycloakConfig
): Promise<boolean> {
  try {
    const introspectUrl = `${config.authority}/protocol/openid-connect/token/introspect`;
    
    const response = await fetch(introspectUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `token=${encodeURIComponent(token)}&client_id=${encodeURIComponent(config.clientId)}`,
    });

    if (!response.ok) {
      console.error('Token validation request failed:', response.status, response.statusText);
      return false;
    }

    const result = await response.json();
    return result.active === true;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
}

/**
 * Updates the user authentication service with the provided token and cleans the token from the URL.
 * Enhanced with optional Keycloak token validation for improved security.
 * @param token - The token to set in the user authentication service.
 * @param location - The location object from the router.
 * @param userAuthenticationService - The user authentication service instance.
 * @param keycloakConfig - Optional Keycloak configuration for token validation
 */
export async function updateAuthServiceAndCleanUrl(
  token: string,
  location: any,
  userAuthenticationService: any,
  keycloakConfig?: KeycloakConfig
): Promise<void> {
  if (!token) {
    return;
  }

  // Validate token with Keycloak if configuration is provided
  if (keycloakConfig) {
    console.log('Validating token with Keycloak...');
    const isValid = await validateKeycloakToken(token, keycloakConfig);
    if (!isValid) {
      console.error('Invalid or expired token provided');
      // Still proceed with token setup for backward compatibility
      // In production, you might want to redirect to login instead
    } else {
      console.log('Token validation successful');
    }
  }

  // if a token is passed in, set the userAuthenticationService to use it
  // for the Authorization header for all requests
  userAuthenticationService.setServiceImplementation({
    getAuthorizationHeader: () => ({
      Authorization: 'Bearer ' + token,
    }),
  });

  // Create a URL object with the current location
  const urlObj = new URL(window.location.origin + window.location.pathname + location.search);

  // Remove the token from the URL object
  urlObj.searchParams.delete('token');
  const cleanUrl = urlObj.toString();

  // Update the browser's history without the token
  if (window.history && window.history.replaceState) {
    window.history.replaceState(null, '', cleanUrl);
  }
}

import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { User } from 'oidc-client-ts';
import { initUserManager } from './OpenIdConnectRoutes';
import { useAppConfig } from '@state';

function EarlyTokenHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const [appConfig] = useAppConfig();
  const { oidc, routerBasename, userAuthenticationService } = appConfig;
  const userManager = useMemo(() => initUserManager(oidc, routerBasename), [oidc, routerBasename]);

  const { search, pathname } = location;
  const query = new URLSearchParams(search);
  const token = query.get('token') || query.get('access_token');

  useEffect(() => {
    if (token && userManager && userAuthenticationService) {
      console.log('Early token handler: Processing token...');

      try {
        // Decode the JWT token to get user information
        const decodedToken = jwtDecode(token);

        // Create a proper OIDC User object
        const user = new User({
          access_token: token,
          profile: decodedToken as any,
          token_type: 'Bearer',
          expires_at: decodedToken.exp,
        });

        // Check if token is expired
        if (user.expired) {
          console.error('Token has expired');
          return;
        }

        // Set the user in the authentication service immediately
        // Create a user object that matches the expected interface
        const userForAuth = {
          ...user,
          id_token: token, // Use the access token as id_token for compatibility
        };
        userAuthenticationService.setUser(userForAuth as any);

        // Set the service implementation for authorization headers
        userAuthenticationService.setServiceImplementation({
          getAuthorizationHeader: () => ({
            Authorization: 'Bearer ' + token,
          }),
        });

        console.log(
          'Early token handler: Token authentication successful, user set in authentication service'
        );

        // Clean the URL by removing the token parameter
        const newQuery = new URLSearchParams(search);
        newQuery.delete('token');
        newQuery.delete('access_token');

        const newSearch = newQuery.toString();
        const newUrl = pathname + (newSearch ? '?' + newSearch : '');

        // Update the browser's history without the token
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', newUrl);
        }
      } catch (error) {
        console.error('Early token handler: Error processing token:', error);
      }
    }
  }, [token, userManager, userAuthenticationService, navigate, pathname, search]);

  return null;
}

export default EarlyTokenHandler;

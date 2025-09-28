import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { User } from 'oidc-client-ts';
import { initUserManager } from './OpenIdConnectRoutes';
import { useAppConfig } from '@state';

function TokenHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const [appConfig] = useAppConfig();
  const { oidc, routerBasename, userAuthenticationService } = appConfig;
  const userManager = useMemo(() => initUserManager(oidc, routerBasename), [oidc, routerBasename]);

  const { search, pathname } = location;
  const query = new URLSearchParams(search);
  const accessToken = query.get('access_token') || query.get('token');

  useEffect(() => {
    if (accessToken && userManager) {
      try {
        const decodedToken = jwtDecode(accessToken);
        const user = new User({
          access_token: accessToken,
          profile: decodedToken as any,
          token_type: 'Bearer',
          expires_at: decodedToken.exp,
        });

        if (user.expired) {
          userManager.signinRedirect();
          return;
        }

        userManager.storeUser(user).then(() => {
          // Create a user object that matches the expected interface
          const userForAuth = {
            ...user,
            id_token: accessToken, // Use the access token as id_token for compatibility
          };
          userAuthenticationService.setUser(userForAuth as any);

          const newQuery = new URLSearchParams(search);
          newQuery.delete('access_token');
          newQuery.delete('token');

          navigate(
            {
              pathname,
              search: newQuery.toString(),
            },
            { replace: true }
          );
        });
      } catch (error) {
        console.error('Error processing token:', error);
      }
    }
  }, [accessToken, userManager, userAuthenticationService, navigate, pathname, search]);

  return null;
}

export default TokenHandler;

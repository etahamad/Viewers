import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { User } from 'oidc-client-ts';
import { initUserManager } from './OpenIdConnectRoutes';
import { useAppConfig } from '@state';

function TokenHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { oidc, routerBasename, userAuthenticationService } = useAppConfig();
  const userManager = useMemo(() => initUserManager(oidc, routerBasename), [oidc, routerBasename]);

  const { search, pathname } = location;
  const query = new URLSearchParams(search);
  const accessToken = query.get('access_token');

  useEffect(() => {
    if (accessToken && userManager) {
      console.log('Access token found in URL.');
      const decodedToken = jwtDecode(accessToken);
      const user = new User({
        access_token: accessToken,
        profile: decodedToken,
        token_type: 'Bearer',
        expires_at: decodedToken.exp,
      });

      if (user.expired) {
        console.log('Access token is expired. Redirecting to login.');
        userManager.signinRedirect();
        return;
      }

      console.log('Access token is valid. Logging in user.');
      userManager.storeUser(user).then(() => {
        userAuthenticationService.setUser(user);

        const newQuery = new URLSearchParams(search);
        newQuery.delete('access_token');

        navigate(
          {
            pathname,
            search: newQuery.toString(),
          },
          { replace: true }
        );
      });
    } else {
      console.log('No access token found in URL.');
    }
  }, [accessToken, userManager, userAuthenticationService, navigate, pathname, search]);

  return null;
}

export default TokenHandler;

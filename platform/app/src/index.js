/**
 * Entry point for development and production PWA builds.
 */
import 'regenerator-runtime/runtime';
import { createRoot } from 'react-dom/client';
import App from './App';
import React from 'react';

/**
 * EXTENSIONS AND MODES
 * =================
 * pluginImports.js is dynamically generated from extension and mode
 * configuration at build time.
 *
 * pluginImports.js imports all of the modes and extensions and adds them
 * to the window for processing.
 */
import { modes as defaultModes, extensions as defaultExtensions } from './pluginImports';
import { User } from 'oidc-client-ts';
import { jwtDecode } from 'jwt-decode';
import { initUserManager } from './utils/OpenIdConnectRoutes';
import loadDynamicConfig from './loadDynamicConfig';
import { publicUrl } from './utils/publicUrl';
export { history } from './utils/history';
export { preserveQueryParameters, preserveQueryStrings } from './utils/preserveQueryParameters';

const handleTokenLogin = async config => {
  if (config.oidc && config.oidc.length > 0) {
    const oidcConfig = config.oidc[0];
    const redirectUri = oidcConfig.redirect_uri || '/callback';
    const routerBasename = config.routerBasename || '';

    // Get the path from the redirect URI, handling both absolute and relative URLs.
    // Making sure to remove the basename from the path.
    const callbackPath = new URL(redirectUri, window.location.origin).pathname.replace(
      routerBasename,
      ''
    );
    const currentPath = window.location.pathname.replace(routerBasename, '');

    if (callbackPath === currentPath) {
      return;
    }
  }

  const queryParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));

  const accessToken = queryParams.get('access_token') || hashParams.get('access_token');
  const idToken = queryParams.get('id_token') || hashParams.get('id_token');

  if (accessToken && idToken && config.oidc) {
    console.log('Access token and ID token found in URL, trying to log in.');
    const userManager = initUserManager(config.oidc, config.routerBasename);

    if (userManager) {
      const scope = queryParams.get('scope') || hashParams.get('scope');
      const token_type = queryParams.get('token_type') || hashParams.get('token_type') || 'Bearer';
      const session_state = queryParams.get('session_state') || hashParams.get('session_state');

      const decodedAccessToken = jwtDecode(accessToken);
      const decodedIdToken = jwtDecode(idToken);

      // expires_at is the expiration time of the access token in seconds.
      const expires_at = decodedAccessToken.exp;

      const userProfile = decodedIdToken;

      const user = new User({
        access_token: accessToken,
        id_token: idToken,
        scope: scope,
        token_type: token_type,
        profile: userProfile,
        expires_at: expires_at,
        session_state: session_state,
      });

      if (user.expired) {
        console.log('Access token is expired. Redirecting to login.');
        userManager.signinRedirect();
        return;
      }

      console.log('Access token is valid. Storing user.');
      await userManager.storeUser(user);

      // Clean up the URL
      const newQuery = new URLSearchParams(window.location.search);
      const paramsToRemove = [
        'access_token',
        'id_token',
        'scope',
        'token_type',
        'expires_in',
        'session_state',
        'state',
      ];
      paramsToRemove.forEach(p => newQuery.delete(p));

      let newUrl = `${window.location.pathname}`;
      if (newQuery.toString()) {
        newUrl += `?${newQuery.toString()}`;
      }

      window.history.replaceState({}, '', newUrl);
      window.location.hash = '';
    }
  }
};

loadDynamicConfig(window.config).then(async config_json => {
  // Reset Dynamic config if defined
  if (config_json !== null) {
    window.config = config_json;
  }
  window.config.routerBasename ||= publicUrl;

  await handleTokenLogin(window.config);

  /**
   * Combine our appConfiguration with installed extensions and modes.
   * In the future appConfiguration may contain modes added at runtime.
   *  */
  const appProps = {
    config: window ? window.config : {},
    defaultExtensions,
    defaultModes,
  };

  const container = document.getElementById('root');

  const root = createRoot(container);
  root.render(React.createElement(App, appProps));
});

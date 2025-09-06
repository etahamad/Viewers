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
  const query = new URLSearchParams(window.location.search);
  const accessToken = query.get('access_token');

  if (accessToken && config.oidc) {
    console.log('Access token found in URL, trying to log in.');
    const userManager = initUserManager(config.oidc, config.routerBasename);

    if (userManager) {
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

      console.log('Access token is valid. Storing user.');
      await userManager.storeUser(user);

      const newQuery = new URLSearchParams(window.location.search);
      newQuery.delete('access_token');
      const newUrl = `${window.location.pathname}?${newQuery.toString()}`;
      window.history.replaceState({}, '', newUrl);
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

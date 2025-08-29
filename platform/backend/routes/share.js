// backend/routes/share.js
const express = require('express');
const router = express.Router();
const KcAdminClient = require('@keycloak/keycloak-admin-client').default;

// This would be configured securely in your environment
const keycloakConfig = {
  baseUrl: 'http://your-keycloak-server/auth',
  realmName: 'your-realm',
  clientId: 'ohif-share-link-generator',
  clientSecret: 'your-client-secret',
};

// A simple in-memory store for this example.
// In a real application, you would use a database.
const tokenStore = {};

router.post('/link', async (req, res) => {
  const { studyInstanceUID, expiresIn } = req.body;

  try {
    const kcAdminClient = new KcAdminClient(keycloakConfig);
    await kcAdminClient.auth({
      grantType: 'client_credentials',
    });

    // Perform the token exchange
    const exchangedToken = await kcAdminClient.auth.tokenExchange({
      audience: 'ohif-viewer', // The target client
      subject_token: req.headers.authorization.split(' ')[1], // The user's original token
      requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
      // Add custom claims
      // Note: This part might require a custom Keycloak extension (SPI)
      // to add arbitrary claims during token exchange.
      // A simpler approach might be to store the studyInstanceUID
      // in your database alongside the token's JTI.
    });

    const { access_token, jti } = exchangedToken;

    // Store the token's JTI and usage info in a database
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    tokenStore[jti] = {
      studyInstanceUID,
      expiresAt,
    };

    const shareableLink = `http://localhost:3000/viewer/${studyInstanceUID}?accessToken=${access_token}`;

    res.json({ shareableLink });
  } catch (error) {
    console.error('Error generating shareable link:', error);
    res.status(500).send('Failed to generate shareable link');
  }
});

module.exports = router;

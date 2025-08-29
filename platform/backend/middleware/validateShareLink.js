// backend/middleware/validateShareLink.js
const { Keycloak } = require('keycloak-connect');

// This would be your main Keycloak adapter for the backend
const keycloak = new Keycloak({});

// Your database client
// const db = require('../db'); // You would have a db client here

async function validateShareLink(req, res, next) {
  const { accessToken } = req.query;

  if (accessToken) {
    try {
      // 1. Validate the token with Keycloak
      const grant = await keycloak.grantManager.createGrant({
        access_token: accessToken,
      });

      const token = grant.access_token;
      const { jti, studyInstanceUID: tokenStudyUID } = token.content;

      // 2. Check if the token is for the correct study
      if (tokenStudyUID !== req.params.studyInstanceUID) {
        return res.status(401).send('Unauthorized');
      }

      // 3. Check the expiration and usage from your database
      // const tokenInfo = await db.getTokenInfo(jti);
      // if (!tokenInfo || tokenInfo.expiresAt < new Date()) {
      //   return res.status(401).send('Unauthorized');
      // }

      // If everything is valid, proceed
      return next();
    } catch (error) {
      return res.status(401).send('Unauthorized');
    }
  }

  // If no token, continue with the regular authentication flow
  next();
}

module.exports = validateShareLink;

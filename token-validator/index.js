const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const { RateLimiterMemory } = require('rate-limiter-flexible');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const rateLimiter = new RateLimiterMemory({ points: 100, duration: 60 });
app.use((req, res, next) => {
  rateLimiter.consume(req.ip).then(() => next()).catch(() => res.status(429).json({ error: 'Rate limit exceeded' }));
});

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-here';
const DCM4CHEE_URL = process.env.DCM4CHEE_URL || 'http://dcm4chee:8080';

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'token-validator', timestamp: new Date().toISOString() });
});

// Token generation endpoint
app.post('/api/shares/create', (req, res) => {
  try {
    const { studyInstanceUIDs, sharedBy, expiresIn = '24h' } = req.body;
    const now = Math.floor(Date.now() / 1000);
    const exp = now + parseExpiry(expiresIn);
    
    const payload = {
      sub: `share_${Date.now()}`,
      exp,
      iat: now,
      studyAccess: studyInstanceUIDs,
      shareContext: { sharedBy }
    };
    
    const token = jwt.sign(payload, JWT_SECRET);
    const shareUrl = `${process.env.OHIF_BASE_URL || 'http://localhost'}/viewer?StudyInstanceUIDs=${studyInstanceUIDs.join(',')}&token=${token}`;
    
    res.json({ token, shareUrl, expiresAt: new Date(exp * 1000) });
  } catch (error) {
    res.status(500).json({ error: 'Token creation failed' });
  }
});

function parseExpiry(exp) {
  const units = { s: 1, m: 60, h: 3600, d: 86400 };
  const match = exp.match(/(\d+)([smhd])/);
  return match ? parseInt(match[1]) * units[match[2]] : 86400;
}

// Traefik ForwardAuth validation endpoint
app.get('/validate', async (req, res) => {
  try {
    const token = req.query.token || req.headers['x-forwarded-token'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
      console.log('Validation failed: No token provided');
      return res.status(401).json({ 
        error: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      console.log('JWT verification failed:', jwtError.message);
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
        details: NODE_ENV === 'development' ? jwtError.message : undefined
      });
    }

    // Validate token structure and required claims
    if (!decoded.studyAccess || !Array.isArray(decoded.studyAccess)) {
      console.log('Token validation failed: Missing or invalid studyAccess claim');
      return res.status(403).json({ 
        error: 'Invalid token structure - missing studyAccess',
        code: 'INVALID_TOKEN_STRUCTURE'
      });
    }

    // Check token expiration (additional check)
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      console.log('Token validation failed: Token expired');
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Validate study access permissions
    const requestedStudies = req.query.StudyInstanceUIDs?.split(',') || [];
    
    if (requestedStudies.length > 0) {
      const accessValid = await validateStudyAccess(decoded, requestedStudies, req.ip);
      
      if (!accessValid.valid) {
        console.log('Study access validation failed:', accessValid.error);
        return res.status(403).json({ 
          error: accessValid.error,
          code: 'STUDY_ACCESS_DENIED'
        });
      }
    }

    // Log successful validation
    console.log(`Token validated successfully for user: ${decoded.sub}, studies: ${decoded.studyAccess.join(',')}`);

    // Set response headers for Traefik to forward
    res.set({
      'X-User-ID': decoded.sub,
      'X-User-Type': 'token',
      'X-Study-Access': JSON.stringify(decoded.studyAccess),
      'X-Permissions': JSON.stringify(decoded.permissions || ['read']),
      'X-Token-Valid': 'true',
      'X-Share-Context': JSON.stringify(decoded.shareContext || {})
    });

    res.status(200).send('OK');
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ 
      error: 'Internal server error during validation',
      code: 'VALIDATION_ERROR'
    });
  }
});

// Direct token validation endpoint (for API usage)
app.post('/api/validate', async (req, res) => {
  try {
    const { token, studyInstanceUIDs, clientIp } = req.body;

    if (!token) {
      return res.status(400).json({ 
        valid: false,
        error: { code: 'NO_TOKEN', message: 'Token is required' }
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return res.status(200).json({ 
        valid: false,
        error: { code: 'INVALID_TOKEN', message: jwtError.message }
      });
    }

    // Validate study access if requested
    let accessValid = { valid: true };
    if (studyInstanceUIDs && studyInstanceUIDs.length > 0) {
      accessValid = await validateStudyAccess(decoded, studyInstanceUIDs, clientIp);
    }

    if (!accessValid.valid) {
      return res.status(200).json({ 
        valid: false,
        error: { code: 'STUDY_ACCESS_DENIED', message: accessValid.error }
      });
    }

    res.status(200).json({
      valid: true,
      user: {
        id: decoded.sub,
        type: 'token',
        studyAccess: decoded.studyAccess,
        permissions: decoded.permissions || ['read'],
        shareContext: decoded.shareContext
      }
    });
  } catch (error) {
    console.error('API validation error:', error);
    res.status(500).json({ 
      valid: false,
      error: { code: 'INTERNAL_ERROR', message: 'Validation failed' }
    });
  }
});

// Function to validate study access permissions
async function validateStudyAccess(decoded, requestedStudies, clientIp) {
  try {
    // Check if requested studies are in token's allowed studies
    for (const studyUID of requestedStudies) {
      if (!decoded.studyAccess.includes(studyUID)) {
        return {
          valid: false,
          error: `Access denied for study: ${studyUID}`
        };
      }
    }

    // Check IP restrictions if configured
    if (decoded.shareContext?.restrictions?.ipWhitelist) {
      const allowedIPs = decoded.shareContext.restrictions.ipWhitelist;
      if (clientIp && !allowedIPs.includes(clientIp)) {
        return {
          valid: false,
          error: `Access denied from IP: ${clientIp}`
        };
      }
    }

    // Check time window restrictions
    if (decoded.shareContext?.restrictions?.timeWindow) {
      const currentTime = Math.floor(Date.now() / 1000);
      const { start, end } = decoded.shareContext.restrictions.timeWindow;
      
      if (currentTime < start || currentTime > end) {
        return {
          valid: false,
          error: 'Access outside allowed time window'
        };
      }
    }

    // Optional: Verify studies exist in DCM4CHEE
    if (VALIDATE_STUDY_EXISTENCE && DCM4CHEE_API_TOKEN) {
      try {
        for (const studyUID of requestedStudies) {
          const response = await axios.get(
            `${DCM4CHEE_URL}/dcm4chee-arc/aets/DCM4CHEE/rs/studies/${studyUID}/metadata`,
            { 
              headers: { 
                Authorization: `Bearer ${DCM4CHEE_API_TOKEN}` 
              },
              timeout: 5000
            }
          );
          
          if (response.status !== 200) {
            return {
              valid: false,
              error: `Study not found: ${studyUID}`
            };
          }
        }
      } catch (dcmError) {
        console.warn('DCM4CHEE validation warning:', dcmError.message);
        // Don't fail validation if DCM4CHEE is temporarily unavailable
        // unless in strict mode
        if (process.env.STRICT_STUDY_VALIDATION === 'true') {
          return {
            valid: false,
            error: 'Unable to verify study existence'
          };
        }
      }
    }

    return { valid: true };
  } catch (error) {
    console.error('Study access validation error:', error);
    return {
      valid: false,
      error: 'Study access validation failed'
    };
  }
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});

// Start server
const server = app.listen(port, () => {
  console.log(`OHIF Token Validator listening on port ${port}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`DCM4CHEE URL: ${DCM4CHEE_URL}`);
  console.log(`Study existence validation: ${VALIDATE_STUDY_EXISTENCE ? 'enabled' : 'disabled'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = app;
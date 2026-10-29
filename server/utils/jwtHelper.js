import jwt from 'jsonwebtoken';

/**
 * Escapes special characters from a string to safely construct RegExp without ReDoS risk.
 */
export const escapeRegex = (str = '') => {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Retrieves the cryptographic JWT secret.
 * Enforces production security: refuses to run or sign with fallback secrets in production.
 */
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing in production environment. Refusing to issue insecure tokens.'
      );
    }
    // Development/Test explicit fallback
    return 'freshmart_dev_insecure_jwt_secret_do_not_use_in_production_2026';
  }
  return secret;
};

/**
 * Generates a signed JWT with standardized claims and security guards.
 */
export const signJwtToken = (userId, role, email, name, vendorId = undefined, additionalClaims = {}) => {
  const secret = getJwtSecret();
  const payload = {
    id: String(userId),
    role,
    email,
    name,
    ...(vendorId ? { vendorId } : {}),
    ...additionalClaims
  };

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};


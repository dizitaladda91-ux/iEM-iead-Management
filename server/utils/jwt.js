import jwt from "jsonwebtoken";

const getCleanExpiry = (val, fallback) => {
  if (!val) return fallback;
  const cleaned = String(val).replace(/[\r\n"']/g, "").trim();
  return cleaned || fallback;
};

/**
 * =====================================================
 * Generate Access Token
 * =====================================================
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET?.trim() || "default_jwt_secret",
    {
      expiresIn: getCleanExpiry(process.env.JWT_EXPIRES_IN, "1d"),
    }
  );
};

/**
 * =====================================================
 * Generate Refresh Token
 * =====================================================
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
    },
    process.env.JWT_REFRESH_SECRET?.trim() || "default_jwt_refresh_secret",
    {
      expiresIn: getCleanExpiry(process.env.JWT_REFRESH_EXPIRES_IN, "7d"),
    }
  );
};

/**
 * =====================================================
 * Verify Access Token
 * =====================================================
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_SECRET?.trim() || "default_jwt_secret"
  );
};

/**
 * =====================================================
 * Verify Refresh Token
 * =====================================================
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET?.trim() || "default_jwt_refresh_secret"
  );
};
const jwt = require("jsonwebtoken");
const userService = require("../services/userService");

/**
 * Middleware to authenticate admin users
 */
async function adminAuthMiddleware(req, res, next) {
  try {
    // Get token from cookie (preferred) or header (fallback)
    let token = req.cookies?.adminToken;

    // Fallback to Authorization header if cookie not found
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Check if user is admin
    if (decoded.userType !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // Verify user still exists in database
    const user = await userService.getUserByPK(decoded.PK);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Attach user info to request
    req.user = {
      userType: decoded.userType,
      email: decoded.email,
      PK: decoded.PK,
    };

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authentication error",
      error: error.message,
    });
  }
}

module.exports = adminAuthMiddleware;

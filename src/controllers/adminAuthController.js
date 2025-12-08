const userService = require("../services/userService");

/**
 * Register admin
 */
async function registerAdmin(req, res) {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and name are required",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const result = await userService.registerAdmin(email, password, name);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Login admin
 */
async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await userService.loginAdmin(email, password);

    // Set HTTP-only cookie with JWT token
    const cookieOptions = {
      httpOnly: true, // Prevents JavaScript access
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict", // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/", // Available for all routes
    };

    res.cookie("adminToken", result.token, cookieOptions);

    res.status(200).json({
      success: true,
      message: result.message,
      user: result.user,
      // Don't send token in response body when using cookies
      // token: result.token, // Uncomment if you want to support both methods
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Logout admin
 */
async function logoutAdmin(req, res) {
  try {
    res.clearCookie("adminToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Admin logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Logout error",
      error: error.message,
    });
  }
}

module.exports = {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
};

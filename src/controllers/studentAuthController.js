const userService = require("../services/userService");

/**
 * Register student
 */
async function registerStudent(req, res) {
  try {
    const { usn, password, name } = req.body;

    // Validation
    if (!usn || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "USN, password, and name are required",
      });
    }

    // USN validation (basic check - alphanumeric and uppercase)
    if (!/^[A-Z0-9]+$/.test(usn.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid USN format",
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const result = await userService.registerStudent(
      usn.toUpperCase(),
      password,
      name
    );

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
 * Login student
 */
async function loginStudent(req, res) {
  try {
    const { usn, password } = req.body;

    // Validation
    if (!usn || !password) {
      return res.status(400).json({
        success: false,
        message: "USN and password are required",
      });
    }

    const result = await userService.loginStudent(usn.toUpperCase(), password);

    // Set HTTP-only cookie with JWT token
    const cookieOptions = {
      httpOnly: true, // Prevents JavaScript access
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict", // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/", // Available for all routes
    };

    res.cookie("studentToken", result.token, cookieOptions);

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
 * Logout student
 */
async function logoutStudent(req, res) {
  try {
    res.clearCookie("studentToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Student logged out successfully",
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
  registerStudent,
  loginStudent,
  logoutStudent,
};

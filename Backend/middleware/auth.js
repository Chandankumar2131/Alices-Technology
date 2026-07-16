const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.auth = async (req, res, next) => {
  try {

    // Extract Token
    const token = req.cookies?.token;

    // Check Token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing. Please login.",
      });
    }

    try {

      // Verify Token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      // Attach User To Request
      req.user = decoded;

      if (decoded.accountType === "Candidate") {
        const candidateApi = req.baseUrl === "/api/v1/candidates";
        const allowedAuthApi = req.baseUrl === "/api/v1/auth" &&
          ["/profile", "/change-password"].includes(req.path);
        if (!candidateApi && !allowedAuthApi) {
          return res.status(403).json({
            success: false,
            message: "Candidate accounts cannot access internal HRM resources",
          });
        }
      }

    } catch (error) {

      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    next();

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
};

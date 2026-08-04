const jwt = require("jsonwebtoken");
const User = require("../model/User");
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

      const currentUser = await User.findById(decoded.id).select(
        "accountType isActive +sessionVersion"
      );

      if (!currentUser || !currentUser.isActive) {
        return res.status(401).json({
          success: false,
          message: "Your account is inactive. Please contact an administrator.",
        });
      }

      if ((decoded.sessionVersion || 0) !== (currentUser.sessionVersion || 0)) {
        return res.status(401).json({
          success: false,
          message: "Your session has expired. Please login again.",
        });
      }

      // Attach User To Request
      req.user = { ...decoded, accountType: currentUser.accountType };

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

const isAdmin = async (req, res, next) => {
  try {

    if (req.user.accountType !== "Admin" &&
  req.user.accountType !== "SuperAdmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    next();

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Role verification failed",
    });
  }
};

module.exports = isAdmin;
module.exports = (req, res, next) => {
  try {
    if (req.user.accountType !== "SuperAdmin") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can perform this action",
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
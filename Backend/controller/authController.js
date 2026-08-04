
const User = require("../model/User");
const Profile = require("../model/Profile");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getPagination, paginatedResponse } = require("../utils/pagination");
require("dotenv").config();
const EMPLOYEE_DEPARTMENTS = ["IT", "Marketing", "Lead Generation", "Sales"];
// ==========================================
// CREATE ADMIN (SUPER ADMIN ONLY)
// ==========================================
exports.createAdmin = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      department,
      designation,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields are mandatory",
      });
    }

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Admin already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const profileDetails =
      await Profile.create({});

    const adminId =
      "ADM" +
      Date.now().toString().slice(-6);

    const admin = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      accountType: "Admin",
      department,
      designation,
      employeeId: adminId,
      additionalDetails:
        profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName}%20${lastName}`,
    });

    const adminResponse = admin.toObject();

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: adminResponse,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create admin",
      error: error.message,
    });
  }
};
// ==========================================
// CREATE EMPLOYEE (ADMIN ONLY)
// ==========================================
exports.createEmployee = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      employeeId,
      department,
      designation,
      joiningDate,
    } = req.body;

    // Validation
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !employeeId ||
      !joiningDate ||
      !department
    ) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, email, password, employee ID, department and joining date are mandatory",
      });
    }

    if (!EMPLOYEE_DEPARTMENTS.includes(department)) {
      return res.status(400).json({ success: false, message: "Select a valid employee department" });
    }

    const normalizedEmployeeId = String(employeeId).trim();

    if (!normalizedEmployeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is mandatory",
      });
    }

    const selectedJoiningDate = new Date(joiningDate);

    if (Number.isNaN(selectedJoiningDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid joining date",
      });
    }

    // Check Existing User
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Employee already exists",
      });
    }

    const existingEmployeeId = await User.findOne({
      employeeId: normalizedEmployeeId,
    });

    if (existingEmployeeId) {
      return res.status(409).json({
        success: false,
        message: "Employee ID already exists",
      });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Create Empty Profile
    const profileDetails = await Profile.create({});

    // Create User
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      accountType: "Employee",
      department,
      designation,
      joiningDate: selectedJoiningDate,
      employeeId: normalizedEmployeeId,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName}%20${lastName}`,
    });


   const userResponse = user.toObject();

delete userResponse.password;

return res.status(201).json({
  success: true,
  message: "Employee created successfully",
  data: userResponse,
});
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create employee",
      error: error.message,
    });
  }
};
// ==========================================
// LOGIN
// ==========================================
exports.login = async (req, res) => {
  try {
    const { email, password, portal } =
      req.body;

    if (!email || !password || !portal) {
      return res.status(400).json({
        success: false,
        message:
          "Email, password, and portal are required",
      });
    }

    if (!["workforce", "candidate"].includes(portal)) {
      return res.status(400).json({
        success: false,
        message: "Invalid login portal",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password +sessionVersion").populate("additionalDetails");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check Active Status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated",
      });
    }

    const isCandidate = user.accountType === "Candidate";
    const isCorrectPortal =
      portal === "candidate" ? isCandidate : !isCandidate;

    if (!isCorrectPortal) {
      return res.status(403).json({
        success: false,
        message: isCandidate
          ? "Candidate accounts can only sign in through the Candidate Portal"
          : "Employee, admin, and super admin accounts can only sign in through the Employee & Admin Portal",
      });
    }

    // Compare Password
    const isPasswordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // JWT Payload
    const payload = {  
      id: user._id,
      email: user.email,
      accountType: user.accountType,
      sessionVersion: user.sessionVersion || 0,
    };

    // Generate Token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Update Last Login
    user.lastLogin = new Date();

    await user.save();

    const userResponse = user.toObject();

    const options = {
      expires: new Date(
        Date.now() +
          7 * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };

    return res.cookie(
      "token",
      token,
      options
    ).status(200).json({
      success: true,
      user: userResponse,
      message: "Login successful",
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// ==========================================
// LOGOUT
// ==========================================
exports.logout = async (_req, res) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };

  return res.clearCookie("token", options).status(200).json({
    success: true,
    message: "Logout successful",
  });
};
// ==========================================
// GET ALL EMPLOYEES 
// ==========================================
exports.getAllEmployees =
  async (req, res) => {
    try {
      const { page, limit, skip } = getPagination(req.query);
      const filter = {
        accountType: "Employee",
      };

      const employees =
        await User.find(filter)
          .populate(
            "additionalDetails"
          )
          .select("-password")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

      const total = await User.countDocuments(filter);

      return res.status(200).json({
        success: true,
        ...paginatedResponse({ page, limit, total, data: employees }),
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch employees",
        error: error.message,
      });
    }
  };
// ==========================================
// DEACTIVATE EMPLOYEE
// ==========================================
exports.deactivateEmployee =
  async (req, res) => {
    try {
      const { id } = req.params;
      const { lastWorkingDate, reason, remarks = "" } = req.body;

      if (!lastWorkingDate || !reason?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Last working date and offboarding reason are required",
        });
      }

      const effectiveDate = new Date(`${lastWorkingDate}T12:00:00.000Z`);
      if (Number.isNaN(effectiveDate.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid last working date" });
      }

      const employee = await User.findOne({ _id: id, accountType: "Employee" }).select(
        "+sessionVersion"
      );

      if (!employee) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found",
        });
      }

      if (!employee.isActive) {
        return res.status(409).json({ success: false, message: "Employee is already inactive" });
      }

      if (employee.joiningDate && effectiveDate < employee.joiningDate) {
        return res.status(400).json({
          success: false,
          message: "Last working date cannot be before the joining date",
        });
      }

      employee.isActive = false;
      employee.employmentEndDate = effectiveDate;
      employee.sessionVersion = (employee.sessionVersion || 0) + 1;
      employee.token = undefined;
      employee.offboardingHistory.push({
        action: "Offboarded",
        effectiveDate,
        reason: reason.trim(),
        remarks: remarks.trim(),
        performedBy: req.user.id,
      });
      await employee.save();

      const io = req.app.get("io");
      if (io) io.in(`user:${employee._id}`).disconnectSockets(true);

      return res.status(200).json({
        success: true,
        message:
          "Employee deactivated successfully",
        data: employee,
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
          "Failed to deactivate employee",
        error: error.message,
      });
    }
  };

// ==========================================
// REACTIVATE EMPLOYEE
// ==========================================
exports.reactivateEmployee = async (req, res) => {
  try {
    const employee = await User.findOne({
      _id: req.params.id,
      accountType: "Employee",
    }).select("+sessionVersion");

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    if (employee.isActive) {
      return res.status(409).json({ success: false, message: "Employee is already active" });
    }

    employee.isActive = true;
    employee.employmentEndDate = null;
    employee.sessionVersion = (employee.sessionVersion || 0) + 1;
    employee.offboardingHistory.push({
      action: "Reactivated",
      remarks: String(req.body.remarks || "").trim(),
      performedBy: req.user.id,
    });
    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Employee reactivated successfully",
      data: employee,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to reactivate employee",
      error: error.message,
    });
  }
};

// ==========================================
// RESET EMPLOYEE PASSWORD (SUPER ADMIN ONLY)
// ==========================================
exports.resetEmployeePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { temporaryPassword } = req.body;

    if (!temporaryPassword || temporaryPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Temporary password must be at least 6 characters",
      });
    }

    const employee = await User.findById(id).select("+password +sessionVersion");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (employee.accountType !== "Employee") {
      return res.status(403).json({
        success: false,
        message: "Only employee passwords can be reset from this action",
      });
    }

    if (!employee.isActive) {
      return res.status(409).json({
        success: false,
        message: "Reactivate the employee before resetting their password",
      });
    }

    employee.password = await bcrypt.hash(temporaryPassword, 10);
    employee.token = undefined;
    employee.sessionVersion = (employee.sessionVersion || 0) + 1;
    await employee.save();

    const io = req.app.get("io");
    if (io) io.in(`user:${employee._id}`).disconnectSockets(true);

    const employeeResponse = employee.toObject();

    return res.status(200).json({
      success: true,
      message: "Employee password reset successfully",
      data: employeeResponse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to reset employee password",
      error: error.message,
    });
  }
};

  // ==========================================//
  // USER PROFILE DETAILS  //
  // ==========================================//
  exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .populate("additionalDetails")
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================//
// UPDATE PROFILE DETAILS  //
// ==========================================//
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName } = req.body;

    const user =
      await User.findByIdAndUpdate(
        userId,
        {
          firstName,
          lastName,
        },
        {
          new: true,
        }
      ).select("-password");

    return res.status(200).json({
      success: true,
      message:
        "Profile updated successfully",
      data: user,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================//
// Update Additional Details //
// ==========================================//
exports.updateProfileDetails = async (req, res) => {
    try {

      const userId = req.user.id;

      const user =
        await User.findById(userId);

      const profile =
        await Profile.findById(
          user.additionalDetails
        );

      const fields = [
        "gender",
        "dateOfBirth",
        "contactNumber",
        "address",
        "city",
        "state",
        "country",
        "pincode",
        "bloodGroup",
        "maritalStatus",
        "emergencyContactName",
        "emergencyContactNumber",
      ];

      fields.forEach((field) => {
        if (req.body[field] !== undefined && req.body[field] !== "") {
          profile[field] = req.body[field];
        }
      });

      await profile.save();

      return res.status(200).json({
        success: true,
        message:
          "Profile details updated",
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

// ==========================================//
// CHANGE PASSWORD
// ==========================================//
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new passwords are required",
      });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect current password",
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================//
// SUBMIT RESIGNATION
// ==========================================//
exports.submitResignation = async (req, res) => {
  try {
    if (req.user.accountType !== "Employee") return res.status(403).json({ success: false, message: "Only employees can submit resignations" });
    const userId = req.user.id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Resignation reason is required",
      });
    }

    const user = await User.findById(userId).populate("additionalDetails");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.resignation?.status && user.resignation.status !== "None") {
      return res.status(400).json({
        success: false,
        message: "A resignation request already exists",
      });
    }

    const resignationDate = new Date();
    const lastWorkingDay = new Date(resignationDate);
    lastWorkingDay.setMonth(lastWorkingDay.getMonth() + 1);

    user.resignation = {
      status: "Submitted",
      resignationDate,
      lastWorkingDay,
      reason: reason.trim(),
      knowledgeTransferCompleted: false,
      assetsReturned: false,
      adminRemarks: "",
      reviewedBy: null,
      reviewedAt: null,
    };

    await user.save();
    req.app?.get("io")?.to("role:admin").emit("admin:notifications", { type: "resignation" });

    return res.status(200).json({
      success: true,
      message: "Resignation submitted successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

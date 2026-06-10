
const User = require("../model/User");
const Profile = require("../model/Profile");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
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

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: admin,
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
      department,
      designation,
    } = req.body;

    // Validation
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

    // Check Existing User
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Employee already exists",
      });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Create Empty Profile
    const profileDetails = await Profile.create({});

    // Employee ID
    const employeeId =
      "EMP" +
      Date.now().toString().slice(-6);

    // Create User
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      accountType: "Employee",
      department,
      designation,
      employeeId,
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
    const { email, password } =
      req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    const user = await User.findOne({
      email,
    }).populate("additionalDetails");

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

    user.token = token;

    await user.save();

    // Remove Password
    user.password = undefined;

    const options = {
      expires: new Date(
        Date.now() +
          7 * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    };

    return res.cookie(
      "token",
      token,
      options
    ).status(200).json({
      success: true,
      token,
      user,
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
// GET ALL EMPLOYEES 
// ==========================================
exports.getAllEmployees =
  async (req, res) => {
    try {

      const employees =
        await User.find({
          accountType: "Employee",
        })
          .populate(
            "additionalDetails"
          )
          .select("-password");

      return res.status(200).json({
        success: true,
        count: employees.length,
        data: employees,
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

      const employee =
        await User.findByIdAndUpdate(
          id,
          {
            isActive: false,
          },
          {
            new: true,
          }
        );

      if (!employee) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found",
        });
      }

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
    const {
      firstName,
      lastName,
      department,
      designation,
    } = req.body;

    const user =
      await User.findByIdAndUpdate(
        userId,
        {
          firstName,
          lastName,
          department,
          designation,
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

    const user = await User.findById(userId);
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
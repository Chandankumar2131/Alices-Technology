require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("../model/User");
const Profile = require("../model/Profile");

const createAdmin = async () => {
  try {
    // Database Connection
    await mongoose.connect(process.env.MONGODB_URL);

    console.log("✅ Database Connected");

    // Check Existing Admin
    const existingAdmin = await User.findOne({
      email: process.env.SUPER_ADMIN_EMAIL,
    });

    if (existingAdmin) {
      console.log("⚠️ Admin already exists");
      process.exit(0);
    }

    // Create Empty Profile
    const profile = await Profile.create({
      gender: "Other",
    });

    // Hash Password
    const hashedPassword = await bcrypt.hash(
      process.env.SUPER_ADMIN_PASSWORD,
      10
    );

    // Create Admin
    const admin = await User.create({
      firstName: process.env.SUPER_ADMIN_FIRSTNAME,
      lastName: process.env.SUPER_ADMIN_LASTNAME,

      email: process.env.SUPER_ADMIN_EMAIL,

      password: hashedPassword,

      accountType: "SuperAdmin",

      additionalDetails: profile._id,

      image: `https://api.dicebear.com/7.x/initials/svg?seed=${process.env.SUPER_ADMIN_FIRSTNAME}`,

      department: process.env.SUPER_ADMIN_DEPARTMENT,

      designation: process.env.SUPER_ADMIN_DESIGNATION,

      employeeId: process.env.SUPER_ADMIN_EMPLOYEE_ID,
    });

    console.log("🎉 Super Admin Created Successfully");
    console.log("-----------------------------------");
    console.log("Email:", admin.email);
    console.log(
      "Password:",
      process.env.SUPER_ADMIN_PASSWORD
    );
    console.log("-----------------------------------");

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createAdmin();
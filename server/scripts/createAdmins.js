import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import connectDB from "../config/mongoDB.js";
import User from "../models/User.js";

dotenv.config();

const ADMINS = [
  {
    name: "Platform Super Admin",
    email: "superadmin@demo.com",
    role: "super_admin",
    password: "SeedPass@123",
  },
  {
    name: "System Admin",
    email: "admin@demo.com",
    role: "admin",
    password: "SeedPass@123",
  },
  {
    name: "Finance Administrator",
    email: "finance.admin@demo.com",
    role: "finance_admin",
    password: "SeedPass@123",
  }
];

const createAdmins = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB...");

    for (const adminData of ADMINS) {
      const existingUser = await User.findOne({ email: adminData.email });
      
      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      
      const payload = {
        name: adminData.name,
        email: adminData.email,
        password: hashedPassword,
        role: adminData.role,
        emailVerified: true,
        isActive: true,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminData.name)}&background=111827&color=fff`,
      };

      if (existingUser) {
        await User.updateOne({ _id: existingUser._id }, payload);
        console.log(`Updated existing admin: ${adminData.email}`);
      } else {
        await User.create(payload);
        console.log(`Created new admin: ${adminData.email}`);
      }
    }

    console.log("✅ Admin accounts ready.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to create admins:", error.message);
    process.exit(1);
  }
};

createAdmins();

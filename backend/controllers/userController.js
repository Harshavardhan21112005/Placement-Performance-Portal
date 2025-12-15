import User from "../models/users.js";
import bcrypt from "bcryptjs";
import XLSX from "xlsx";
import fs from "fs";
import PasswordResetToken from "../models/PasswordResetToken.js";
import { sendOtpEmail   } from "../utils/emailService.js";  // adjust path
import dotenv, { decrypt } from "dotenv";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import redis from "../config/redis.js";


dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey"; // store in .env
const RESET_SECRET = process.env.RESET_SECRET || "resetsecret123";


// controllers/authController.js

// ---------------- LOGIN ----------------

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    // ✅ Generate JWT (same as before)
    const token = jwt.sign(
      { id: user._id, role: user.role, roll_number: user.roll_number },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // ✅ Store token in Redis with expiry (same as JWT expiry)
    await redis.set(
      `session:${user._id}:${token}`,
      "valid",
      "EX",
      60 * 60 // 1 hour
    );

    return res.json({
      message: "Login successful",
      token, // 👈 still returned for other routes
      user: {
        roll_number: user.roll_number,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(400).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.decode(token);

    await redis.del(`session:${decoded.id}:${token}`);

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};


// ---------------- FORGOT PASSWORD ----------------
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const otp = crypto.randomInt(100000, 999999).toString();
    const uuid = uuidv4();

    await PasswordResetToken.findOneAndUpdate(
      { email },
      { otp, uuid, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
      { upsert: true, new: true }
    );

    // Send OTP email
    await sendOtpEmail(email, otp);

    // ✅ Instead of sending email back, we send uuid to frontend
    return res.json({ message: "OTP sent to email", uuid });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};

// ---------------- VERIFY RESET TOKEN ----------------
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const tokenDoc = await PasswordResetToken.findOne({ token });
    if (!tokenDoc || tokenDoc.expiresAt < new Date())
      return res.status(400).json({ error: "Invalid or expired token" });

    res.json({ message: "Token verified", token }); // frontend will store this token locally
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// ---------------- RESET PASSWORD ----------------
export const resetPassword = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, RESET_SECRET);
    } catch (err) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const { newPassword, confirmPassword } = req.body;
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ error: "Missing fields" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // password strength check
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!regex.test(newPassword)) {
      return res.status(400).json({
        error: "Password must be 8+ chars, include uppercase, number & special char",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email: decoded.email }, { $set: { password: hashedPassword } });

    return res.json({ message: "Password reset successful" });
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};


// ✅ Step 2: Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { uuid, otp } = req.body;

    const tokenDoc = await PasswordResetToken.findOne({ uuid, otp });
    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const resetToken = jwt.sign({ email: tokenDoc.email }, RESET_SECRET, { expiresIn: "15m" });

    // cleanup
    await PasswordResetToken.deleteMany({ uuid });

    res.json({ message: "OTP verified", resetToken });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};



// 📌 Upload Excel and create users
export const registerStudentsExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    // header:1 => returns each row as array (no headers)

    const currentYear = new Date().getFullYear() % 100; // 2025 -> 25
    const createdUsers = [];
    const skippedUsers = [];

    // start from row 0 (since no header row)
    for (const row of sheet) {
      // each row is array like [roll_number, name, linkedin_id, leetcode_id, git_id]
      const roll_number = row[0];
      const name = row[1];
      const linkedin_id = row[2];
      const leetcode_id = row[3];
      const git_id = row[4];

      // ✅ 1. Check required fields
      if (!roll_number || !name || !linkedin_id || !leetcode_id || !git_id) {
        skippedUsers.push({ row, reason: "Missing required fields" });
        continue;
      }

      // ✅ 2. Validate roll_number format (e.g. 23pw09)
      const match = /^(\d{2})(pw|pt|pc|pd)(\d{2})$/i.exec(roll_number);
      if (!match) {
        skippedUsers.push({ roll_number, reason: "Invalid roll number format" });
        continue;
      }

      const batch = parseInt(match[1], 10); // 23
      if (batch > currentYear || batch < currentYear - 4) {
        skippedUsers.push({ roll_number, reason: "Batch not valid" });
        continue;
      }

      // ✅ 3. Generate email
      const email = `${roll_number}@psgtech.ac.in`;

      // ✅ 4. Check if user already exists
      const exists = await User.findOne({ email });
      if (exists) {
        skippedUsers.push({ roll_number, reason: "User already exists" });
        continue;
      }

      // ✅ 5. Hash password (default = roll_number)
      const hashedPassword = await bcrypt.hash(roll_number, 10);

      // ✅ 6. Create user
      const newUser = new User({
        roll_number,
        name,
        email,
        password: hashedPassword,
        branch: getBranchFromRoll(roll_number),
        linkedin_id,
        leetcode_id,
        git_id,
        role: "student",
      });

      await newUser.save();
      createdUsers.push(roll_number);
    }

    // cleanup uploaded file
    fs.unlinkSync(req.file.path);

    return res.status(201).json({
      message: "Excel processed successfully",
      createdUsers,
      skippedUsers,
    });
  } catch (err) {
    console.error("Error uploading Excel:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};


// Admin registration (only name, email, password)
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // validate email format
    if (!email.endsWith("@psgtech.ac.in")) {
      return res.status(400).json({ error: "Email must be a psgtech.ac.in address" });
    }

    // extract roll_number from email (before @)
    const roll_number = email.split("@")[0];

    // check if user with same roll_number or email exists
    const existingUser = await User.findOne({
      $or: [{ email }, { roll_number }]
    });

    if (existingUser) {
      return res.status(400).json({ error: "User with this email or roll number already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create admin user
    const admin = new User({
      roll_number,
      name,
      email,
      password: hashedPassword,
      role: "admin"
    });

    await admin.save();

    res.status(201).json({
      message: "Admin registered successfully",
      admin: {
        roll_number: admin.roll_number,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error("Error registering admin:", error);
    res.status(500).json({ error: "Server error" });
  }
};


// 📌 Change Role Controller
export const changeUserRole = async (req, res) => {
  try {
    const { admin_roll_number, student_roll_number, new_role } = req.body;

    // 1. Verify if the requester is an admin
    const adminUser = await User.findOne({ roll_number: admin_roll_number });
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Only admins can change user roles" });
    }

    // 2. Check if student exists
    const student = await User.findOne({ roll_number: student_roll_number });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // 3. Update role
    student.role = new_role;
    await student.save();

    return res.status(200).json({
      message: `✅ Role updated successfully for ${student_roll_number}`,
      updatedUser: {
        roll_number: student.roll_number,
        name: student.name,
        old_role: student.role,
        new_role,
      },
    });
  } catch (err) {
    console.error("Error changing role:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

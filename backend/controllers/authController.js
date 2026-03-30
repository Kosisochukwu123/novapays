import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import { resetPasswordEmail, welcomeEmail } from "../utils/emailTemplates.js";
import { loadSettings } from "./adminController.js";

// ── POST /api/auth/register ───────────────────────────────────────────────

export const register = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ message: "Full name, email and password are required" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res
        .status(400)
        .json({ message: "An account with this email already exists" });
    }

    // Check if approval is required
    let settings = { requireApproval: false, platformName: "NovaPay" };
    try {
      settings = await loadSettings();
    } catch {
      /* use defaults */
    }

    const user = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || "",
      password,
      status: settings.requireApproval ? "pending" : "active",
    });

    // Send welcome email — don't block registration if it fails
    try {
      await sendEmail({
        to: user.email,
        subject: `Welcome to ${settings.platformName}!`,
        html: welcomeEmail(settings.platformName, user.fullName),
      });
    } catch (emailErr) {
      console.error("Welcome email failed:", emailErr.message);
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({ token, user: userObj });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // select('+password') is critical — password has select:false in schema
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check account status
    if (user.status === "suspended") {
      return res
        .status(403)
        .json({
          message:
            "Your account has been suspended. Please contact support via the chat.",
        });
    }
    if (user.status === "pending") {
      return res
        .status(403)
        .json({
          message:
            "Your account is pending admin approval. You will be notified when approved.",
        });
    }

    // Update lastLogin without triggering pre-save hook
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.json({ token, user: userObj });
  } catch (err) {
    console.error("login error:", err);
    res
      .status(500)
      .json({
        message: "Login failed. Please try again.",
        detail: err.message,
      });
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

// ── POST /api/auth/forgot-password ───────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return 200 — never reveal if email exists
    if (!user) {
      return res.json({
        message: "If that email exists, a reset link has been sent.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });

    let settings = { platformName: "NovaPay" };
    try {
      settings = await loadSettings();
    } catch {
      /* use defaults */
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await sendEmail({
      to: email,
      subject: `Reset your ${settings.platformName} password`,
      html: resetPasswordEmail(settings.platformName, resetUrl),
    });

    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("forgotPassword error:", err);
    res.status(500).json({ message: "Failed to send reset email" });
  }
};

// ── POST /api/auth/reset-password ────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    if (!token || !email || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Reset link is invalid or has expired" });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
};

import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import { resetPasswordEmail, welcomeEmail } from "../utils/emailTemplates.js";
import { loadSettings } from "./adminController.js";

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ message: "Email already registered" });

    const user = await User.create({
      fullName,
      email,
      phone,
      password,
      status: "pending", // requires admin approval by default
    });

    const settings = await loadSettings();
    const platformName = settings.platformName || "NovaPay";

    // Send welcome email (don't await — don't block registration if it fails)
    sendEmail({
      to: user.email,
      subject: `Welcome to ${platformName}!`,
      html: welcomeEmail(platformName, user.fullName),
    }).catch((err) => console.error("Welcome email failed:", err));

    const token = generateToken(user._id, user.role);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user — make sure password field is selected (it's excluded by default)
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
          message: "Your account has been suspended. Please contact support.",
        });
    }

    if (user.status === "pending") {
      return res
        .status(403)
        .json({
          message:
            "Your account is pending approval. Please wait for admin review.",
        });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ token, user: userObj });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// ── POST /api/auth/forgot-password ────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return 200 — never reveal whether email exists
    if (!user) {
      return res.json({
        message: "If that email exists, a reset link has been sent.",
      });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    // Build reset URL
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // Get platform name from settings
    const settings = await loadSettings();
    const platformName = settings.platformName || "NovaPay";

    await sendEmail({
      to: email,
      subject: `Reset your ${platformName} password`,
      html: resetPasswordEmail(platformName, resetUrl),
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
      email: email.toLowerCase(),
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }, // not expired
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Reset link is invalid or has expired" });
    }

    // Set new password — pre-save hook will hash it
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

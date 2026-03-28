import Withdrawal from "../models/Withdrawal.js";
import User from "../models/User.js";
import { createNotification } from "./notificationController.js";

// POST /api/user/withdrawal — submit withdrawal request
export const submitWithdrawal = async (req, res) => {
  try {
    const {
      fullName,
      bankName,
      accountNumber,
      amount,
      // These are now optional — KYC is handled separately
      reason = "",
      additionalNotes = "",
      proofImage1 = "",
      proofImage2 = "",
    } = req.body;

    // Validate required fields only
    if (!fullName?.trim()) {
      return res
        .status(400)
        .json({ message: "Account holder name is required" });
    }
    if (!bankName?.trim()) {
      return res.status(400).json({ message: "Bank name is required" });
    }
    if (!accountNumber?.trim()) {
      return res.status(400).json({ message: "Account number is required" });
    }
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: "A valid amount is required" });
    }

    // Check user has enough balance
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.balance < parseFloat(amount)) {
      return res.status(400).json({
        message: `Insufficient balance. You have $${user.balance.toFixed(2)} available.`,
      });
    }

    const withdrawal = await Withdrawal.create({
      user: req.user._id,
      fullName: fullName.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      amount: parseFloat(amount),
      reason,
      additionalNotes,
      proofImage1,
      proofImage2,
    });

    res.status(201).json({
      message: "Withdrawal request submitted successfully",
      withdrawal,
    });
  } catch (err) {
    console.error("submitWithdrawal error:", err);
    res.status(500).json({ message: "Failed to submit withdrawal request" });
  }
};

// GET /api/user/withdrawals — get user's own withdrawal history
export const getUserWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ withdrawals });
  } catch {
    res.status(500).json({ message: "Failed to fetch withdrawals" });
  }
};

// ── ADMIN ─────────────────────────────────────────────────────────────────

// GET /api/admin/withdrawals
export const getAllWithdrawals = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const total = await Withdrawal.countDocuments(query);
    const withdrawals = await Withdrawal.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("user", "fullName email");
    res.json({ withdrawals, total });
  } catch {
    res.status(500).json({ message: "Failed to fetch withdrawals" });
  }
};

// PUT /api/admin/withdrawals/:id/approve
export const approveWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id).populate(
      "user",
    );
    if (!withdrawal)
      return res.status(404).json({ message: "Withdrawal not found" });
    if (withdrawal.status !== "pending")
      return res.status(400).json({ message: "Already reviewed" });

    const user = await User.findById(withdrawal.user._id);
    if (user.balance < withdrawal.amount) {
      return res.status(400).json({ message: "User has insufficient balance" });
    }

    user.balance -= withdrawal.amount;
    await user.save();

    withdrawal.status = "approved";
    withdrawal.reviewedAt = new Date();
    withdrawal.reviewedBy = req.user._id;
    withdrawal.adminNote = req.body.adminNote || "";
    await withdrawal.save();

    res.json({ message: "Withdrawal approved", withdrawal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to approve withdrawal" });
  }
};

// PUT /api/admin/withdrawals/:id/reject
export const rejectWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal)
      return res.status(404).json({ message: "Withdrawal not found" });
    if (withdrawal.status !== "pending")
      return res.status(400).json({ message: "Already reviewed" });

    withdrawal.status = "rejected";
    withdrawal.reviewedAt = new Date();
    withdrawal.reviewedBy = req.user._id;
    withdrawal.adminNote = req.body.adminNote || "";
    await withdrawal.save();

    res.json({ message: "Withdrawal rejected", withdrawal });
  } catch {
    res.status(500).json({ message: "Failed to reject withdrawal" });
  }
};

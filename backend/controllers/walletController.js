import Wallet from "../models/Wallet.js";
import Deposit from "../models/Deposit.js";
import User from "../models/User.js";
// import { createNotification } from './notificationController.js';
import Notification from '../models/Notification.js';
import { createNotification } from './notificationController.js';


// ── Default wallets seeded on first run ───────────────────────────────────
const DEFAULT_WALLETS = [
  {
    network: "bitcoin",
    symbol: "BTC",
    label: "Bitcoin",
    address: "PASTE_YOUR_BTC_ADDRESS_HERE",
    network_tag: "BTC Network",
    color: "#f59e0b",
    minDeposit: 0.0001,
    confirmations: 3,
  },
  {
    network: "ethereum",
    symbol: "ETH",
    label: "Ethereum",
    address: "PASTE_YOUR_ETH_ADDRESS_HERE",
    network_tag: "ERC20",
    color: "#818cf8",
    minDeposit: 0.01,
    confirmations: 12,
  },
  {
    network: "usdt_trc20",
    symbol: "USDT",
    label: "USDT (TRC20)",
    address: "PASTE_YOUR_TRC20_ADDRESS_HERE",
    network_tag: "TRC20",
    color: "#22c55e",
    minDeposit: 10,
    confirmations: 20,
  },
  {
    network: "usdt_bep20",
    symbol: "USDT",
    label: "USDT (BEP20)",
    address: "PASTE_YOUR_BEP20_ADDRESS_HERE",
    network_tag: "BEP20",
    color: "#22c55e",
    minDeposit: 10,
    confirmations: 15,
  },
  {
    network: "bnb",
    symbol: "BNB",
    label: "BNB",
    address: "PASTE_YOUR_BNB_ADDRESS_HERE",
    network_tag: "BEP20",
    color: "#fbbf24",
    minDeposit: 0.01,
    confirmations: 15,
  },
  {
    network: "solana",
    symbol: "SOL",
    label: "Solana",
    address: "PASTE_YOUR_SOL_ADDRESS_HERE",
    network_tag: "SOL Network",
    color: "#c084fc",
    minDeposit: 0.1,
    confirmations: 32,
  },
  {
    network: "tron",
    symbol: "TRX",
    label: "Tron",
    address: "PASTE_YOUR_TRX_ADDRESS_HERE",
    network_tag: "TRC20",
    color: "#ef4444",
    minDeposit: 100,
    confirmations: 20,
  },
  {
    network: "litecoin",
    symbol: "LTC",
    label: "Litecoin",
    address: "PASTE_YOUR_LTC_ADDRESS_HERE",
    network_tag: "LTC Network",
    color: "#94a3b8",
    minDeposit: 0.01,
    confirmations: 6,
  },
];

// Seed default wallets if none exist
export const seedWallets = async () => {
  const count = await Wallet.countDocuments();
  if (count === 0) {
    await Wallet.insertMany(DEFAULT_WALLETS);
    console.log("✅ Default wallets seeded");
  }
};

// GET /api/deposit/wallets — public (for users to see deposit addresses)
export const getWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find({ isActive: true })
      .select("-updatedBy")
      .sort({ createdAt: 1 });
    res.json({ wallets });
  } catch (err) {
    console.error("getWallets error:", err);
    res.status(500).json({ message: "Failed to fetch wallets" });
  }
};

// POST /api/user/deposit/notify — user notifies after sending
export const notifyDeposit = async (req, res) => {
  try {
    const { network, symbol, walletAddress, amount, txHash } = req.body;
    if (!network || !walletAddress) {
      return res
        .status(400)
        .json({ message: "Network and wallet address are required" });
    }
    const deposit = await Deposit.create({
      user: req.user._id,
      network,
      symbol,
      walletAddress,
      amount: parseFloat(amount) || 0,
      txHash: txHash || "",
    });
    res.status(201).json({ message: "Deposit notification received", deposit });
  } catch (err) {
    console.error("notifyDeposit error:", err);
    res.status(500).json({ message: "Failed to submit deposit" });
  }
};

// GET /api/user/deposits — user's deposit history
export const getUserDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ deposits });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch deposits" });
  }
};

// ── ADMIN ─────────────────────────────────────────────────────────────────

// GET /api/admin/wallets
export const adminGetWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find().sort({ createdAt: 1 });
    res.json({ wallets });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch wallets" });
  }
};

// PUT /api/admin/wallets/:id
export const adminUpdateWallet = async (req, res) => {
  try {
    const { address, label, network_tag, isActive, minDeposit, confirmations } =
      req.body;
    if (!address?.trim()) {
      return res.status(400).json({ message: "Wallet address is required" });
    }
    const wallet = await Wallet.findByIdAndUpdate(
      req.params.id,
      {
        address: address.trim(),
        label,
        network_tag,
        isActive,
        minDeposit,
        confirmations,
        updatedBy: req.user._id,
      },
      { new: true },
    );
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    res.json({ message: "Wallet updated successfully", wallet });
  } catch (err) {
    console.error("adminUpdateWallet error:", err);
    res.status(500).json({ message: "Failed to update wallet" });
  }
};

// GET /api/admin/deposits
export const adminGetDeposits = async (req, res) => {
  try {
    const { status, page = 1, limit = 30 } = req.query;
    const query = status ? { status } : {};
    const total = await Deposit.countDocuments(query);
    const deposits = await Deposit.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("user", "fullName email");
    res.json({ deposits, total });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch deposits" });
  }
};

// PUT /api/admin/deposits/:id/confirm
export const adminConfirmDeposit = async (req, res) => {
  try {
    const { amount, adminNote } = req.body;
    const deposit = await Deposit.findById(req.params.id).populate('user');
    if (!deposit) return res.status(404).json({ message: 'Deposit not found' });
    if (deposit.status === 'confirmed') {
      return res.status(400).json({ message: 'Deposit already confirmed' });
    }

    const parsedAmount = parseFloat(amount) || deposit.amount;

    // Credit user balance
    await User.findByIdAndUpdate(deposit.user._id, {
      $inc: { balance: parsedAmount },
    });

    // Update deposit record
    const updated = await Deposit.findByIdAndUpdate(
      req.params.id,
      {
        status:      'confirmed',
        amount:      parsedAmount,
        adminNote:   adminNote || '',
        confirmedAt: new Date(),
        confirmedBy: req.user._id,
      },
      { new: true }
    ).populate('user', 'fullName email');

    // Notify the user
    await createNotification(deposit.user._id, {
      title:   'Deposit Confirmed ✓',
      message: `Your ${deposit.symbol} deposit of $${parsedAmount.toFixed(2)} has been confirmed and credited to your account.`,
      type:    'deposit',
      link:    '/deposit',
    });

    res.json({ message: 'Deposit confirmed and balance credited', deposit: updated });
  } catch (err) {
    console.error('adminConfirmDeposit error:', err);
    res.status(500).json({ message: 'Failed to confirm deposit' });
  }
};

// PUT /api/admin/deposits/:id/reject
export const adminRejectDeposit = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: 'Deposit not found' });
    if (deposit.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending deposits can be rejected' });
    }

    const updated = await Deposit.findByIdAndUpdate(
      req.params.id,
      {
        status:      'rejected',
        adminNote:   adminNote || '',
        confirmedBy: req.user._id,
      },
      { new: true }
    ).populate('user', 'fullName email');

    // Notify the user
    await createNotification(deposit.user, {
      title:   'Deposit Rejected',
      message: `Your ${deposit.symbol} deposit request was not approved.${adminNote ? ' Note: ' + adminNote : ''}`,
      type:    'deposit',
      link:    '/deposit',
    });

    res.json({ message: 'Deposit rejected', deposit: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject deposit' });
  }
};

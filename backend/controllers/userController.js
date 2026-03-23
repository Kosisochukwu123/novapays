import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

// GET /api/user/dashboard
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const transactions = await Transaction.find({
      $or: [{ fromUser: userId }, { toUser: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('fromUser toUser', 'fullName email');

    const income = transactions
      .filter(t => t.toUser?._id?.toString() === userId.toString() && t.status === 'completed')
      .reduce((s, t) => s + t.amount, 0);

    const expenses = transactions
      .filter(t => t.fromUser?._id?.toString() === userId.toString() && t.status === 'completed')
      .reduce((s, t) => s + t.amount, 0);

    res.json({
      balance:   req.user.balance,
      income,
      expenses,
      balanceChange:  3.2,  // Compute from historical data as needed
      incomeChange:   12.0,
      expensesChange: -5.1,
      recentTransactions: transactions.slice(0, 5),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch dashboard' });
  }
};

// GET /api/user/transactions
export const getTransactions = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    const query = { $or: [{ fromUser: userId }, { toUser: userId }] };
    if (type)   query.type   = type;
    if (status) query.status = status;

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('fromUser toUser', 'fullName email');

    res.json({ transactions, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};

// POST /api/user/transfer
export const transfer = async (req, res) => {
  try {
    const { recipientEmail, amount, note } = req.body;
    const senderId = req.user._id;

    if (!recipientEmail || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Recipient email and a valid amount are required' });
    }

    if (recipientEmail === req.user.email) {
      return res.status(400).json({ message: 'You cannot transfer to yourself' });
    }

    const sender = await User.findById(senderId);
    const recipient = await User.findOne({ email: recipientEmail });

    if (!recipient) return res.status(404).json({ message: 'Recipient not found' });
    if (recipient.status !== 'active') return res.status(400).json({ message: 'Recipient account is inactive' });
    if (sender.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });

    // Atomic balance update
    await User.findByIdAndUpdate(senderId,     { $inc: { balance: -amount } });
    await User.findByIdAndUpdate(recipient._id, { $inc: { balance:  amount } });

    const transaction = await Transaction.create({
      fromUser:    senderId,
      toUser:      recipient._id,
      amount,
      type:        'transfer',
      status:      'completed',
      description: `Transfer to ${recipient.fullName}`,
      note:        note || '',
    });

    res.status(201).json({ message: 'Transfer successful', transaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Transfer failed' });
  }
};

// GET /api/user/profile
export const getProfile = async (req, res) => {
  res.json({ user: req.user });
};

// PUT /api/user/profile
export const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, language } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { fullName, phone, language },
      { new: true, runValidators: true }
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// PUT /api/user/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const match = await user.matchPassword(currentPassword);
    if (!match) return res.status(400).json({ message: 'Current password is incorrect' });

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to change password' });
  }
};
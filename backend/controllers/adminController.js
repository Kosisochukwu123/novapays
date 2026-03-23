import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import fs from 'fs';
import path from 'path';

// GET /api/admin/dashboard
export const getDashboard = async (req, res) => {
  try {
    const [totalUsers, activeAccounts, suspendedAccounts, pendingAccounts, allTransactions] =
      await Promise.all([
        User.countDocuments({ role: 'user' }),
        User.countDocuments({ status: 'active' }),
        User.countDocuments({ status: 'suspended' }),
        User.countDocuments({ status: 'pending' }),
        Transaction.find({ status: 'completed' }),
      ]);

    const totalDeposits = allTransactions.reduce((s, t) => s + t.amount, 0);

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersWeek = await User.countDocuments({
      createdAt: { $gte: oneWeekAgo },
    });

    res.json({
      totalUsers,
      activeAccounts,
      suspendedAccounts,
      pendingAccounts,
      totalDeposits,
      newUsersWeek,
      activeRate: totalUsers
        ? Math.round((activeAccounts / totalUsers) * 100)
        : 0,
    });
  } catch (err) {
    console.error('getDashboard error:', err);
    res.status(500).json({ message: 'Failed to fetch admin dashboard' });
  }
};

// GET /api/admin/users
export const getUsers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    const query = { role: 'user' };

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email:    { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// PUT /api/admin/users/:id/suspend
export const suspendUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'suspended' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User suspended successfully', user });
  } catch (err) {
    console.error('suspendUser error:', err);
    res.status(500).json({ message: 'Failed to suspend user' });
  }
};

// PUT /api/admin/users/:id/restore
export const restoreUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User restored successfully', user });
  } catch (err) {
    console.error('restoreUser error:', err);
    res.status(500).json({ message: 'Failed to restore user' });
  }
};

// PUT /api/admin/users/:id/approve
export const approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User approved successfully', user });
  } catch (err) {
    console.error('approveUser error:', err);
    res.status(500).json({ message: 'Failed to approve user' });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// POST /api/admin/users/:id/fund
export const fundAccount = async (req, res) => {
  try {
    const { amount, type, note } = req.body;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'A valid amount greater than zero is required' });
    }

    if (!['credit', 'debit'].includes(type)) {
      return res.status(400).json({ message: 'Type must be either credit or debit' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isCredit = type === 'credit';

    if (!isCredit && user.balance < parsedAmount) {
      return res.status(400).json({
        message: `Insufficient balance. User only has $${user.balance.toFixed(2)}`,
      });
    }

    // Use $inc to avoid triggering password pre-save hook
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $inc: { balance: isCredit ? parsedAmount : -parsedAmount } },
      { new: true }
    );

    await Transaction.create({
      fromUser:    isCredit ? null     : user._id,
      toUser:      isCredit ? user._id : null,
      amount:      parsedAmount,
      type:        isCredit ? 'fund'   : 'debit',
      status:      'completed',
      description: `Admin ${isCredit ? 'credit' : 'debit'} — ${note || 'No note'}`,
      note:        note || '',
    });

    res.json({
      message: `Account ${isCredit ? 'credited' : 'debited'} successfully`,
      user: updatedUser,
    });
  } catch (err) {
    console.error('fundAccount error:', err);
    res.status(500).json({
      message: 'Failed to fund account',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

// GET /api/admin/transactions
export const getTransactions = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (type)   query.type   = type;

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('fromUser toUser', 'fullName email');

    res.json({
      transactions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('getTransactions error:', err);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};

// GET /api/admin/settings
let platformSettings = {
  platformName:        'NovaPay',
  defaultCurrency:     'USD',
  transferLimit:       10000,
  maxTransferPerDay:   50000,
  minBalance:          10,
  requireApproval:     true,
  twoFactorAdmin:      true,
  emailNotifications:  true,
  smsNotifications:    false,
  maintenanceMode:     false,
  allowRegistration:   true,
  supportEmail:        'support@novapay.com',
};

// export const getSettings = async (req, res) => {
//   res.json(platformSettings);
// };

// PUT /api/admin/settings
// export const updateSettings = async (req, res) => {
//   try {
//     platformSettings = { ...platformSettings, ...req.body };
//     res.json({ message: 'Settings updated successfully', settings: platformSettings });
//   } catch (err) {
//     console.error('updateSettings error:', err);
//     res.status(500).json({ message: 'Failed to update settings' });
//   }
// };

// PUT /api/admin/transactions/:id
export const updateTransaction = async (req, res) => {
  try {
    const { description, status, note } = req.body;

    const allowed = ['pending', 'completed', 'failed'];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const update = {};
    if (description !== undefined) update.description = description.trim();
    if (status      !== undefined) update.status      = status;
    if (note        !== undefined) update.note        = note.trim();

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).populate('fromUser toUser', 'fullName email');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ message: 'Transaction updated successfully', transaction });
  } catch (err) {
    console.error('updateTransaction error:', err);
    res.status(500).json({ message: 'Failed to update transaction' });
  }
};


// Path to persist settings as JSON file (simple, no extra DB model needed)
const SETTINGS_PATH = path.resolve('./data/settings.json');

const DEFAULT_SETTINGS = {
  platformName:       'NovaPay',
  logoUrl:            '',
  logoText:           'NP',
  defaultCurrency:    'USD',
  transferLimit:      10000,
  maxTransferPerDay:  50000,
  minBalance:         10,
  requireApproval:    true,
  twoFactorAdmin:     true,
  emailNotifications: true,
  smsNotifications:   false,
  maintenanceMode:    false,
  allowRegistration:  true,
  supportEmail:       'support@novapay.com',
};

const loadSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch { /* use defaults */ }
  return { ...DEFAULT_SETTINGS };
};

const saveSettings = (data) => {
  try {
    const dir = path.resolve('./data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
};

// GET /api/admin/settings
export const getSettings = async (req, res) => {
  res.json(loadSettings());
};

// PUT /api/admin/settings
export const updateSettings = async (req, res) => {
  try {
    const current  = loadSettings();
    const updated  = { ...current, ...req.body };
    saveSettings(updated);
    res.json({ message: 'Settings updated successfully', ...updated });
  } catch (err) {
    console.error('updateSettings error:', err);
    res.status(500).json({ message: 'Failed to update settings' });
  }
};
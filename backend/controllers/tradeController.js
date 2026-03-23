import Trade from '../models/Trade.js';
import User  from '../models/User.js';

// POST /api/user/trade
export const executeTrade = async (req, res) => {
  try {
    const { symbol, name, assetType, action, quantity, priceAtTrade } = req.body;

    if (!symbol || !name || !assetType || !action || !quantity || !priceAtTrade) {
      return res.status(400).json({ message: 'All trade fields are required' });
    }

    const total = parseFloat((quantity * priceAtTrade).toFixed(2));
    const user  = await User.findById(req.user._id);

    if (action === 'buy') {
      if (user.balance < total) {
        return res.status(400).json({
          message: `Insufficient balance. You need $${total.toFixed(2)} but have $${user.balance.toFixed(2)}`,
        });
      }
      await User.findByIdAndUpdate(req.user._id, { $inc: { balance: -total } });
    }

    if (action === 'sell') {
      await User.findByIdAndUpdate(req.user._id, { $inc: { balance: total } });
    }

    const trade = await Trade.create({
      user: req.user._id,
      symbol, name, assetType, action,
      quantity:     parseFloat(quantity),
      priceAtTrade: parseFloat(priceAtTrade),
      total,
    });

    const updatedUser = await User.findById(req.user._id);
    res.status(201).json({ message: 'Trade executed successfully', trade, balance: updatedUser.balance });
  } catch (err) {
    console.error('executeTrade error:', err);
    res.status(500).json({ message: 'Failed to execute trade' });
  }
};

// GET /api/user/trades
export const getMyTrades = async (req, res) => {
  try {
    const trades = await Trade.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'fullName email');
    res.json({ trades });
  } catch (err) {
    console.error('getMyTrades error:', err);
    res.status(500).json({ message: 'Failed to fetch trades' });
  }
};

// GET /api/admin/trades
export const getAllTrades = async (req, res) => {
  try {
    const trades = await Trade.find()
      .sort({ createdAt: -1 })
      .populate('user', 'fullName email');
    res.json({ trades });
  } catch (err) {
    console.error('getAllTrades error:', err);
    res.status(500).json({ message: 'Failed to fetch trades' });
  }
};

// PUT /api/admin/trades/:id/resolve
export const resolveTrade = async (req, res) => {
  try {
    const { outcome, returnAmount, adminNote } = req.body;

    if (!['win', 'loss'].includes(outcome)) {
      return res.status(400).json({ message: 'Outcome must be either win or loss' });
    }

    const trade = await Trade.findById(req.params.id).populate('user');
    if (!trade) return res.status(404).json({ message: 'Trade not found' });

    if (trade.status === 'closed') {
      return res.status(400).json({ message: 'This trade has already been resolved' });
    }

    const parsedReturn = parseFloat(returnAmount) || 0;
    const profitLoss   = outcome === 'win' ? parsedReturn - trade.total : -(trade.total);

    if (outcome === 'win') {
      await User.findByIdAndUpdate(
        trade.user._id,
        { $inc: { balance: parsedReturn } }
      );
    }

    const updatedTrade = await Trade.findByIdAndUpdate(
      req.params.id,
      {
        outcome,
        returnAmount: parsedReturn,
        profitLoss,
        adminNote:    adminNote || '',
        status:       'closed',
        resolvedAt:   new Date(),
        resolvedBy:   req.user._id,
      },
      { new: true }
    ).populate('user', 'fullName email');

    res.json({ message: `Trade marked as ${outcome}`, trade: updatedTrade });
  } catch (err) {
    console.error('resolveTrade error:', err);
    res.status(500).json({ message: 'Failed to resolve trade' });
  }
};
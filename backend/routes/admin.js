import express from 'express';
import {
  getDashboard,
  getUsers,
  suspendUser,
  restoreUser,
  approveUser,
  deleteUser,
  fundAccount,
  getTransactions,
  updateTransaction,
  getSettings,
  updateSettings,
    updateUserKYC,  
} from '../controllers/adminController.js';

import {
  getAllTrades,
  resolveTrade,
} from '../controllers/tradeController.js';

import {
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
} from '../controllers/withdrawalController.js';

import {
  adminGetWallets,
  adminUpdateWallet,
  adminGetDeposits,
  adminConfirmDeposit,
  adminRejectDeposit,
} from '../controllers/walletController.js';

import { protect }   from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';

import {
  adminGetChats,
  adminGetChat,
  adminSendMessage,
  adminMarkRead,
  adminCloseChat,
} from '../controllers/chatController.js';




const router = express.Router();

router.use(protect, adminOnly);

router.get('/dashboard',                getDashboard);
router.get('/users',                    getUsers);
router.put('/users/:id/suspend',        suspendUser);
router.put('/users/:id/restore',        restoreUser);
router.put('/users/:id/approve',        approveUser);
router.delete('/users/:id',             deleteUser);
router.post('/users/:id/fund',          fundAccount);
router.get('/transactions',             getTransactions);
router.put('/transactions/:id',         updateTransaction);
router.get('/settings',                 getSettings);
router.put('/settings',                 updateSettings);
router.get('/trades',                   getAllTrades);
router.put('/trades/:id/resolve',       resolveTrade);
router.get('/withdrawals',              getAllWithdrawals);
router.put('/withdrawals/:id/approve',  approveWithdrawal);
router.put('/withdrawals/:id/reject',   rejectWithdrawal);
router.get('/wallets',                  adminGetWallets);
router.put('/wallets/:id',              adminUpdateWallet);
router.get('/deposits',                 adminGetDeposits);
router.put('/deposits/:id/confirm',     adminConfirmDeposit);
router.put('/deposits/:id/reject',      adminRejectDeposit);

router.get('/chats',              adminGetChats);
router.get('/chats/:id',          adminGetChat);
router.post('/chats/:id/message', adminSendMessage);
router.put('/chats/:id/read',     adminMarkRead);
router.put('/chats/:id/close',    adminCloseChat);

router.put('/users/:id/kyc', updateUserKYC);


// PUT /api/admin/users/:id/kyc
router.put('/users/:id/kyc', async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const update = {
      kycStatus:    status,
      kycVerified:  status === 'verified',
      ...(rejectionReason && { kycRejectionReason: rejectionReason }),
    };
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `KYC ${status}`, user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update KYC' });
  }
});

export default router;
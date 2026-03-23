import express from 'express';
import {
  getDashboard, getTransactions, transfer,
  getProfile, updateProfile, changePassword,
} from '../controllers/userController.js';
import { submitWithdrawal, getUserWithdrawals } from '../controllers/withdrawalController.js';
import { executeTrade, getMyTrades } from '../controllers/tradeController.js';

import { notifyDeposit, getUserDeposits, getWallets } from '../controllers/walletController.js';

import { protect } from '../middleware/auth.js';
import { getSettings } from '../controllers/adminController.js';
import {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  clearAll,
} from '../controllers/notificationController.js';


const router = express.Router();

router.use(protect); // all user routes require auth

router.get('/dashboard',          getDashboard);
router.get('/transactions',       getTransactions);
router.post('/transfer',          transfer);
router.get('/profile',            getProfile);
router.put('/profile',            updateProfile);
router.put('/change-password',    changePassword);
router.post('/withdrawal',   submitWithdrawal);
router.get('/withdrawals',   getUserWithdrawals);
router.post('/trade',  executeTrade);
router.get('/trades',  getMyTrades);
router.get('/deposit/wallets',  getWallets);
router.post('/deposit/notify',  notifyDeposit);
router.get('/deposits',         getUserDeposits);

router.get('/notifications',              getNotifications);
router.put('/notifications/read-all',     markAllRead);
router.put('/notifications/:id/read',     markRead);
router.delete('/notifications',           clearAll);
router.delete('/notifications/:id',       deleteNotification);




export default router;
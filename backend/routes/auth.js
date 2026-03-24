import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { forgotPassword, resetPassword } from '../controllers/authController.js';


const router = express.Router();

router.post('/register', register);
router.post('/login',    login);
router.get('/me',        protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

export default router;
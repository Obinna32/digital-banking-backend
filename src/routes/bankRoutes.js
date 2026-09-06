import express from 'express';
import { registerUser, verifyOnboarding, createAccount } from '../controllers/bankController.js';
import { nameEnquiry, transferFunds, getBalance, getTransactionHistory } from '../controllers/bankingController.js'
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/auth/register', registerUser);
router.post('/onboard/verify', protect, verifyOnboarding);
router.post('/account/create', protect, createAccount);

router.post('/banking/name-enquiry', protect, nameEnquiry);
router.post('/banking/transfer', protect, transferFunds);
router.get('/banking/balance', protect, getBalance);
router.get('/banking/history', protect, getTransactionHistory);

export default router;

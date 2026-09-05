import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import { nibssNameEnquiry, nibssInterBankTransfer } from '../services/nibssService.js';
import crypto from 'crypto';

//Name Enquiry
export const nameEnquiry = async(req, res) => {
    const { accountNumber, bankCode } = req.body;
    try{
        //Intra-bank
        if(bankCode === 'OUR_BANK_CODE'){
            const account = await Account.findOne({ accountNumber }).populate('userId', 'fullName');
            if (!account) return res.status(404).json({message: 'Account not found'});
            return res.status(200).json({ accountNumber, accountName: account.userId.fullName});
        }

        //Inter-bank
        const data = await nibssNameEnquiry(accountNumber, bankCode);
        res.status(200).json(data);

    }catch(error){
        res.status(500).json({error: error.message});
    }
};

//Funds Transfer
export const transferFunds = async (req, res) => {
  const { recipientAccountNumber, recipientBankCode, amount, narration } = req.body;
  try {
    const senderAccount = await Account.findOne({ userId: req.user._id });
    if (!senderAccount) return res.status(404).json({ message: 'Sender account not found' });

    if (senderAccount.balance < amount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    const reference = 'TXN-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    const isIntraBank = recipientBankCode === 'OUR_BANK_CODE';

    if (isIntraBank) {
      const recipientAccount = await Account.findOne({ accountNumber: recipientAccountNumber });
      if (!recipientAccount) return res.status(404).json({ message: 'Recipient account not found' });

      // Execute atomic balance updates
      senderAccount.balance -= Number(amount);
      recipientAccount.balance += Number(amount);

      await senderAccount.save();
      await recipientAccount.save();

      // Log transaction for sender
      await Transaction.create({
        reference,
        senderAccountId: senderAccount._id,
        senderAccountNumber: senderAccount.accountNumber,
        recipientAccountNumber,
        recipientBankCode,
        amount,
        type: 'INTRA_BANK',
        status: 'SUCCESSFUL',
        narration,
        userId: req.user._id
      });

      return res.status(200).json({ message: 'Intra-bank transfer successful', reference });
    } else {
      // Inter-bank Transfer
      senderAccount.balance -= Number(amount);
      await senderAccount.save();

      const txnLog = await Transaction.create({
        reference,
        senderAccountId: senderAccount._id,
        senderAccountNumber: senderAccount.accountNumber,
        recipientAccountNumber,
        recipientBankCode,
        amount,
        type: 'INTER_BANK',
        status: 'PENDING',
        narration,
        userId: req.user._id
      });

      // Forward to NIBSS
      const nibssRes = await nibssInterBankTransfer({
        reference,
        senderAccountNumber: senderAccount.accountNumber,
        recipientAccountNumber,
        recipientBankCode,
        amount
      });

      txnLog.status = nibssRes.status === 'SUCCESS' ? 'SUCCESSFUL' : 'FAILED';
      await txnLog.save();

      if (txnLog.status === 'FAILED') {
        // Revert funds on failure
        senderAccount.balance += Number(amount);
        await senderAccount.save();
        return res.status(400).json({ message: 'Inter-bank transfer failed via NIBSS' });
      }

      return res.status(200).json({ message: 'Inter-bank transfer successful', reference });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Balance Check
export const getBalance = async (req, res) => {
    try{
        const account = await Account.findOne({ userId: req.user._id});
        if (!account) return res.status(404).json({message: 'Account not found'});
        res.status(200).json({accountNumber: account.accountNumber, balance: account.balance});
    } catch(error){
        res.status(500).json({error: error.message});
    }
};

//Transaction History
export const getTransactionHistory = async (req, res) => {
    try {
        const history = await Transaction.find({ userId: req.user._id}).sort({ createdAt: -1});
        res.status(200).json({count: history.length, transaction: history});
    }catch(error){
        res.status(500).json({error: error.message});
    }
};
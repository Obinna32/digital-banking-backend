import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
    {
        reference: { type: String, required: true, unique: true }, 
        senderAccountId: { type: mongoose.Schema.Types.ObjectId, ref: Account },
        senderAccountNumber: {type: String, required: true},
        recipientAccountNumber: { type: String, required: true },
        recipientBankCode: {type: String, required: true},
        amount: { type: Number, required: true},
        type: { type: String, enum: ['INTRA_BANK', 'INTER_BANK'], required: true},
        status: { type: String, enum: ['PENDING', 'SUCCESSFUL', 'FAILED'], default: 'PENDING'},
        narration: { type: String, default: 'Funds Transfer' },
        userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}
    },
    { timestamps: true }
);

export const Transaction = mongoose.model('Transaction', transactionSchema);
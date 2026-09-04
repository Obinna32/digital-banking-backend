import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
    {
        userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true},
        accountNumber: {type: String, required: true, unique: true},
        balance: {type: Number, default: 15000 },
        bankName: {type: String, default: 'Phoenix Bank'}
    },
    {timestamps: true}
);

export const Account = mongoose.model('Account', accountSchema);
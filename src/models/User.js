import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true},
        email: { type: String, required: true, unique: true},
        password: {type: String, required: true},
        bvn: {type: String, default: null},
        nin: { type: String, default: null },
        isOnboarded: {type: Boolean, default: false},
        hasAccount: { type: Boolean, default: false}
    },
    { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
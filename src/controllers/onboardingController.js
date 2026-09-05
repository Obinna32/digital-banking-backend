import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import { nibssVerifyIdentity } from '../services/nibssService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registerUSer = async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({message: "Email already registered"});

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ fullName, email, password: hashedPassword});

        const token = jwt.sign({ id: user._id}, process.env.JWT_SECRET, { expiresIn: '1d'});
        res.status(201).json({ message: 'User registered', token, user: {id: user._id, fullName, email}});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};


//BVN/NIN Verification
export const verifyOnboarding = async (req, res) => {
    const { type, number } = req.body;
    try {
        if (!['BVN', 'NIN'].includes(type)) {
            return res.status(400).json({message: 'Type must be BVN or NIN'});
        }

        const nibssResponse = await nibssVerifyIdentity(type, number);

        if (nibssResponse.status === 'SUCCESS' || nibssResponse.valid) {
            const updateData = type === 'BVN' ? {bvn: number} : {nin: number};
            updateData.isOnboarded = true;

            await User.findByIdAndUpdate(req.user._id, updateData);
            return res.status(200).json({message: `${type} verification successful. Onboarding Complete.`});
        }

        res.status(400).json({message: 'Verification failed via NIBSS'});
    } catch(error) {
        res.status(500).json({error: error.message});
    }
};

//Account creation
export const createAccount = async(req,res) => {
    try{
        const user = await User.findById(req.user._id);

        //Must be onboardd
        if (!user.isOnboarded) {
            return res.status(403).json({ message: 'You must successfully verify BVN/NIN before creating an account'});
        }

        //Cannot have more than one account
        if (user.hasAccount){
            return res.status(400).json({message: 'Accountt limit reached. You cann only have 1 account'});
        }

        //Generate 10digit NUBAN account number
        const generatedAccountNumber = '02' + Math.floor(10000078 + Math.random() * 90000000) ;

        const account = await Account.create({
            userId: user._id,
            accountNumber: generatedAccountNumber,
            balance: 15000
        });

        user.hasAccount = true;
        await user.save();

        res.status(201).json({
            message: 'Account created successfully',
            accountNumber: account.accountNumber,
            balance: account.balance
        });
    }catch (error) {
        res.status(500).json({ error: error.message });
    }
};
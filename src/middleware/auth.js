//this to ensure that a operational request passes through a JWT authentication middleware to ensure Data Privacy with req.user

import jwt from 'jsonwebtoken';
import { User} from '../models/Userjs';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try{
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user){
                return res.status(401).json({message: 'User not found or unauthorized'});
            }
            return next();
        } catch (error) {
            return res.status(401).json({message: 'Token Verification failed'});
        }
    }

    if (!token) {
        return res.status(401).json({message: 'Not authorized, no token provided'});
    }
};
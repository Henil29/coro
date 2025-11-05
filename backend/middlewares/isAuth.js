import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from "../models/user.model.js";

export const isAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        let decodedData = jwt.verify(token, process.env.JWT_SECRET);

        if (decodedData.id) {
            req.user = await User.findById(decodedData.id);
        } else if (decodedData.email) {
            req.user = await User.findOne({ email: decodedData.email });
        }

        if (!req.user) {
            return res.status(404).json({ message: 'User not found' });
        }

        next();
    }
    catch (error) {
        res.status(500).json({
            message: 'Authentication failed'
        });
    }
}
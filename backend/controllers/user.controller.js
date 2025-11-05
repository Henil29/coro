import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { passwordStrength } from 'check-password-strength';

function generateToken(email, res) {
    const token = jwt.sign(
        { email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return token;
}

export const registerUser = async (req, res) => {
    try {
        if (req.cookies.token) {
            return res.status(200).json({ message: 'User already logged in. Pls logout first' });
        }

        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields (name, email, password)' });
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // check password strength
        const strength = passwordStrength(password).value;
        if (strength === 'Too weak') {
            return res.status(400).json({ message: 'Password must be at least 6 characters long and contain at least one number and one special character' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const token = generateToken(email, res);

        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({
            message: 'User registered successfully',
            newUser: {
                name: newUser.name,
                email: newUser.email,
                _id: newUser._id
            },
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const loginUser = async (req, res) => {
    try {
        if (req.cookies.token) {
            return res.status(200).json({ message: 'User already logged in. Pls logout first' });
        }

        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(email, res);
        res.status(200).json({
            message: 'User logged in successfully',
            user: {
                name: user.name,
                email: user.email,
                _id: user._id
            },
            token
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const logoutUser = (req, res) => {
    if (!req.cookies.token) {
        return res.status(400).json({ message: 'No user is logged in' });
    }
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    res.status(200).json({ message: 'User logged out successfully' });
};

export const getUser = async (req, res) => {
    try {
        const email = req.user.email;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
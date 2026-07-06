const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, email, password, role, phoneNumber } = req.body;
    const normalizedRole = typeof role === 'string' ? role.toLowerCase() : role;
    console.log(`Registration attempt for: ${email}`);
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log('User already exists');
            return res.status(400).json({ message: 'User already exists' });
        }

        console.log('Creating user...');
        const user = await User.create({ name, email, password, role: normalizedRole, phoneNumber });
        console.log('User created successfully');
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: error.message });
    }
});

const fs = require('fs');
const path = require('path');

const logError = (msg) => {
    try { fs.appendFileSync(path.join(__dirname, '../debug_login.log'), `${new Date().toISOString()} - ${msg}\n`); } catch(e) {}
};

// @desc    Login user
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    logError(`Login attempt for: ${email}`);
    try {
        const user = await User.findOne({ email });
        if (!user) {
            logError('User not found');
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        logError('User found, comparing password...');
        const isMatch = await user.comparePassword(password);
        if (isMatch) {
            logError('Password match, generating token...');
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isApproved: user.isApproved,
                phoneNumber: user.phoneNumber,
                token: generateToken(user._id)
            });
        } else {
            logError('Password mismatch');
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        logError(`Login error: ${error.message}\nStack: ${error.stack}`);
        res.status(500).json({ message: error.message });
    }
});

const { protect } = require('../middleware/authMiddleware');

// @desc    Get current user profile
// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('savedProperties');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Toggle save property
// @route   POST /api/auth/save-property/:id
router.post('/save-property/:id', protect, async (req, res) => {
    try {
        const propertyId = req.params.id;
        // Use $addToSet / $pull with runValidators:false so we don't re-validate
        // legacy fields (e.g. capitalized `role` values that pre-date the
        // current enum) when toggling a saved property.
        const existing = await User.findById(req.user._id).select('savedProperties').lean();
        if (!existing) return res.status(404).json({ message: 'User not found' });
        const has = (existing.savedProperties || []).some((id) => String(id) === String(propertyId));
        const update = has
            ? { $pull: { savedProperties: propertyId } }
            : { $addToSet: { savedProperties: propertyId } };
        const updated = await User.findByIdAndUpdate(
            req.user._id,
            update,
            { new: true, runValidators: false },
        ).select('savedProperties');
        res.json(updated.savedProperties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all verified agencies (Public)
// @route   GET /api/auth/agencies
router.get('/agencies', async (req, res) => {
    try {
        const agencies = await User.find({ role: 'Agency', isApproved: true }).select('name email');
        res.json(agencies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

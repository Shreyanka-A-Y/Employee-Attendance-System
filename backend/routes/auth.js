const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['employee', 'manager']).withMessage('Invalid role'),
  ],
  async (req, res) => {
    try {
      console.log('Registration request received:', { email: req.body.email, name: req.body.name });
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg).join(', ');
        console.log('Validation errors:', errorMessages);
        return res.status(400).json({ message: errorMessages });
      }

      const { name, email, password, role, employeeId, department } = req.body;

      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Check if employeeId is unique
      if (employeeId) {
        const existingEmployee = await User.findOne({ employeeId });
        if (existingEmployee) {
          return res.status(400).json({ message: 'Employee ID already exists' });
        }
      }

      // Create new user - use create() to ensure it's saved
      user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password, // Will be hashed by pre-save hook
        role: role || 'employee',
        employeeId: employeeId ? employeeId.trim() : undefined,
        department: department ? department.trim() : undefined,
      });

      console.log('User created successfully:', user.email, 'ID:', user._id);

      const token = generateToken(user._id);

      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          department: user.department,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      if (error.code === 11000) {
        // MongoDB duplicate key error
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({ message: `${field} already exists` });
      }
      if (error.name === 'ValidationError') {
        return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join(', ') });
      }
      res.status(500).json({ message: error.message || 'Server error' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      console.log('Login request received:', { email: req.body.email });
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg).join(', ');
        console.log('Validation errors:', errorMessages);
        return res.status(400).json({ message: errorMessages });
      }

      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        console.log('Password mismatch for:', email);
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      const token = generateToken(user._id);
      console.log('Login successful for:', email);

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          department: user.department,
          profileImage: user.profileImage,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: error.message || 'Server error' });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        employeeId: req.user.employeeId,
        department: req.user.department,
        profileImage: req.user.profileImage,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


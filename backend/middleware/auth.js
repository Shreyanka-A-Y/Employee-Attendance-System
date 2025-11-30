const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      console.error('User not found for ID:', decoded.userId);
      return res.status(401).json({ message: 'Token is not valid - user not found' });
    }

    // Ensure user object has _id
    if (!user._id) {
      console.error('User object missing _id:', user);
      return res.status(401).json({ message: 'Invalid user data' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const managerAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'manager') {
        return res.status(403).json({ message: 'Access denied. Manager role required.' });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({ message: 'Authorization failed' });
  }
};

module.exports = { auth, managerAuth };


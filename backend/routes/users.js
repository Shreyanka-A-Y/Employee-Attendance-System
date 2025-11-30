const express = require('express');
const multer = require('multer');
const User = require('../models/User');
const { auth, managerAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Test route to verify router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Users router is working' });
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
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
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, department } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (department !== undefined) updates.department = department;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');

    res.json({
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
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/profile/upload-image
// @desc    Upload profile image
// @access  Private
router.post('/profile/upload-image', auth, (req, res, next) => {
  upload.single('profileImage')(req, res, (err) => {
    if (err) {
      console.error('Multer error in route:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ message: err.message || 'File upload error' });
      }
      return res.status(400).json({ message: err.message || 'Invalid file type. Only images are allowed.' });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('Upload route hit');
    console.log('File:', req.file);
    console.log('User:', req.user._id);
    console.log('Request body:', req.body);

    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ message: 'No image file provided. Please select an image file.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete old profile image if exists
    if (user.profileImage) {
      const oldImagePath = path.join(__dirname, '../uploads', user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        try {
          fs.unlinkSync(oldImagePath);
          console.log('Old image deleted:', oldImagePath);
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
      }
    }

    // Update user with new image path
    const imagePath = `/uploads/profile-images/${req.file.filename}`;
    user.profileImage = imagePath;
    await user.save();

    console.log('Image uploaded successfully:', imagePath);

    res.json({
      message: 'Profile image uploaded successfully',
      profileImage: imagePath,
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
    console.error('Upload image error:', error);
    console.error('Error stack:', error.stack);
    // Delete uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads/profile-images', req.file.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error('Error deleting uploaded file:', err);
        }
      }
    }
    res.status(500).json({ message: error.message || 'Failed to upload image' });
  }
});

// @route   DELETE /api/users/profile/delete-image
// @desc    Delete profile image
// @access  Private
router.delete('/profile/delete-image', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.profileImage) {
      const imagePath = path.join(__dirname, '../uploads', user.profileImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      user.profileImage = null;
      await user.save();
    }

    res.json({
      message: 'Profile image deleted successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
        profileImage: null,
      },
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ message: 'Failed to delete image' });
  }
});

// @route   GET /api/users/all
// @desc    Get all employees (Manager)
// @access  Private (Manager)
router.get('/all', managerAuth, async (req, res) => {
  try {
    const users = await User.find({ role: 'employee' }).select('-password');
    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/departments
// @desc    Get all distinct departments from Users collection
// @access  Private (Manager)
router.get('/departments', managerAuth, async (req, res) => {
  try {
    // Get all distinct departments from employees
    const departments = await User.distinct('department', { 
      role: 'employee',
      department: { $exists: true, $ne: null, $ne: '' }
    });
    
    // Filter out null/empty values and sort alphabetically
    const filteredDepartments = departments
      .filter(dept => dept && dept.trim() !== '')
      .sort();
    
    res.json({ departments: filteredDepartments });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


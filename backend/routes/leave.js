const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { notifyLeaveApplication, notifyLeaveDecision } = require('../utils/notifications');

console.log('Leave routes module loaded');

// Helper function to get day bounds
const getDayBounds = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// Helper function to create attendance entries for approved leave
const createLeaveAttendanceEntries = async (userId, startDate, endDate, leaveType) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const currentDate = new Date(start);
  const attendanceEntries = [];

  while (currentDate <= end) {
    const dateStr = new Date(currentDate);
    dateStr.setHours(0, 0, 0, 0);

    // Check if attendance already exists
    const existing = await Attendance.findOne({
      userId,
      date: dateStr,
    });

    if (existing) {
      // Update existing attendance to leave status
      existing.status = 'leave';
      existing.leaveType = leaveType;
      existing.checkInTime = null;
      existing.checkOutTime = null;
      existing.totalHours = 0;
      await existing.save();
      attendanceEntries.push(existing);
    } else {
      // Create new attendance entry
      const attendance = await Attendance.create({
        userId,
        date: dateStr,
        status: 'leave',
        leaveType: leaveType,
        totalHours: 0,
      });
      attendanceEntries.push(attendance);
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return attendanceEntries;
};

// @route   POST /api/leave/apply
// @desc    Employee apply for leave
// @access  Private (Employee)
router.post(
  '/apply',
  auth,
  body('leaveType').notEmpty().withMessage('Leave type is required'),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  async (req, res) => {
    console.log('POST /api/leave/apply - Route hit');
    try {
      // Check if user is employee
      if (req.user.role !== 'employee') {
        return res.status(403).json({ message: 'Only employees can apply for leave' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { leaveType, reason, startDate, endDate, document } = req.body;

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start < today) {
        return res.status(400).json({ message: 'Start date cannot be in the past' });
      }

      if (end < start) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }

      // Get employee name for notification
      const employee = await User.findById(req.user._id);

      // Create leave request
      const leave = await Leave.create({
        userId: req.user._id,
        leaveType,
        reason,
        startDate: start,
        endDate: end,
        document: document || null,
        status: 'pending',
      });

      // Notify managers about leave application
      await notifyLeaveApplication({
        leaveId: leave._id,
        userId: req.user._id,
        employeeName: employee.name,
        leaveType,
        startDate: start,
        endDate: end,
      });

      res.status(201).json({
        message: 'Leave application submitted successfully',
        leave: {
          id: leave._id,
          leaveType: leave.leaveType,
          reason: leave.reason,
          startDate: leave.startDate,
          endDate: leave.endDate,
          status: leave.status,
          createdAt: leave.createdAt,
        },
      });
    } catch (error) {
      console.error('Leave application error:', error);
      res.status(500).json({ message: error.message || 'Server error' });
    }
  }
);

// @route   GET /api/leave/my-requests
// @desc    Get current employee's leave requests
// @access  Private (Employee)
router.get('/my-requests', auth, async (req, res) => {
  try {
    console.log('GET /api/leave/my-requests - Route hit');
    console.log('User ID:', req.user._id);
    console.log('User role:', req.user.role);

    if (req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Only employees can view their leave requests' });
    }

    const leaves = await Leave.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${leaves.length} leave requests for user ${req.user._id}`);
    res.json({ leaves });
  } catch (error) {
    console.error('Get my leave requests error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   GET /api/leave/pending
// @desc    Get all pending leave requests (Manager only)
// @access  Private (Manager)
router.get('/pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers can view pending leave requests' });
    }

    const leaves = await Leave.find({ status: 'pending' })
      .populate('userId', 'name email employeeId department')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ leaves });
  } catch (error) {
    console.error('Get pending leaves error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   GET /api/leave/all
// @desc    Get all leave requests (Manager only)
// @access  Private (Manager)
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers can view all leave requests' });
    }

    const { status, employeeId, startDate, endDate } = req.query;
    const query = {};

    if (status) query.status = status;
    if (employeeId) {
      const user = await User.findOne({ employeeId });
      if (user) query.userId = user._id;
    }
    if (startDate || endDate) {
      query.$or = [];
      if (startDate) {
        query.$or.push({ startDate: { $gte: new Date(startDate) } });
      }
      if (endDate) {
        query.$or.push({ endDate: { $lte: new Date(endDate) } });
      }
    }

    const leaves = await Leave.find(query)
      .populate('userId', 'name email employeeId department')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ leaves });
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   POST /api/leave/:id/approve
// @desc    Approve a leave request (Manager only)
// @access  Private (Manager)
router.post('/:id/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers can approve leave requests' });
    }

    const leave = await Leave.findById(req.params.id).populate('userId');
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Leave request is not pending' });
    }

    // Update leave status
    leave.status = 'approved';
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    leave.managerComment = req.body.comment || '';
    await leave.save();

    // Create attendance entries for approved leave dates
    await createLeaveAttendanceEntries(
      leave.userId._id,
      leave.startDate,
      leave.endDate,
      leave.leaveType
    );

    // Notify employee about approval
    await notifyLeaveDecision({
      leaveId: leave._id,
      userId: leave.userId._id,
      managerId: req.user._id,
      status: 'approved',
      leaveType: leave.leaveType,
      managerComment: leave.managerComment,
      startDate: leave.startDate,
      endDate: leave.endDate,
    });

    res.json({
      message: 'Leave request approved successfully',
      leave: {
        id: leave._id,
        status: leave.status,
        approvedAt: leave.approvedAt,
        managerComment: leave.managerComment,
      },
    });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   POST /api/leave/:id/reject
// @desc    Reject a leave request (Manager only)
// @access  Private (Manager)
router.post('/:id/reject', auth, async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers can reject leave requests' });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Leave request is not pending' });
    }

    // Update leave status
    leave.status = 'rejected';
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    leave.managerComment = req.body.comment || '';
    await leave.save();

    // Populate userId for notification
    await leave.populate('userId');

    // Notify employee about rejection
    await notifyLeaveDecision({
      leaveId: leave._id,
      userId: leave.userId._id,
      managerId: req.user._id,
      status: 'rejected',
      leaveType: leave.leaveType,
      managerComment: leave.managerComment,
      startDate: leave.startDate,
      endDate: leave.endDate,
    });

    res.json({
      message: 'Leave request rejected',
      leave: {
        id: leave._id,
        status: leave.status,
        approvedAt: leave.approvedAt,
        managerComment: leave.managerComment,
      },
    });
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   GET /api/leave/stats
// @desc    Get leave statistics (Manager only)
// @access  Private (Manager)
router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers can view leave statistics' });
    }

    const total = await Leave.countDocuments();
    const pending = await Leave.countDocuments({ status: 'pending' });
    const approved = await Leave.countDocuments({ status: 'approved' });
    const rejected = await Leave.countDocuments({ status: 'rejected' });

    res.json({
      total,
      pending,
      approved,
      rejected,
    });
  } catch (error) {
    console.error('Get leave stats error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;


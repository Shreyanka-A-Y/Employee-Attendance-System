const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');

// @route   GET /api/calendar/month
// @desc    Get combined attendance and leave data for a month
// @access  Private
router.get('/month', auth, async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ message: 'Year and month are required' });
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month) - 1; // JavaScript months are 0-indexed

    // Get start and end of month
    const startDate = new Date(yearNum, monthNum, 1);
    const endDate = new Date(yearNum, monthNum + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    // Get attendance records for the month
    const attendanceRecords = await Attendance.find({
      userId: req.user._id,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).lean();

    // Get leave records for the month
    const leaveRecords = await Leave.find({
      userId: req.user._id,
      $or: [
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate },
        },
      ],
    }).lean();

    // Create a map of date -> status
    const statusMap = new Map();

    // Process attendance records
    attendanceRecords.forEach((att) => {
      const date = new Date(att.date);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      
      // If attendance status is 'leave', it means it was already processed from an approved leave
      if (att.status === 'leave') {
        statusMap.set(dateStr, 'leave-approved');
      } else {
        statusMap.set(dateStr, att.status);
      }
    });

    // Process leave records (overrides attendance if approved)
    leaveRecords.forEach((leave) => {
      const start = new Date(leave.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(leave.endDate);
      end.setHours(0, 0, 0, 0);

      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Only override if leave is approved, or if no attendance exists and leave is pending
        if (leave.status === 'approved') {
          statusMap.set(dateStr, 'leave-approved');
        } else if (leave.status === 'pending' && !statusMap.has(dateStr)) {
          statusMap.set(dateStr, 'leave-pending');
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    // Convert map to array format
    const result = Array.from(statusMap.entries()).map(([date, status]) => ({
      date,
      status,
    }));

    res.json(result);
  } catch (error) {
    console.error('Get calendar month error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   GET /api/calendar/month/all
// @desc    Get combined attendance and leave data for all employees (Manager only)
// @access  Private (Manager)
router.get('/month/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers can view all calendar data' });
    }

    const { year, month, userId } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ message: 'Year and month are required' });
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month) - 1;

    const startDate = new Date(yearNum, monthNum, 1);
    const endDate = new Date(yearNum, monthNum + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    // Build query
    const attendanceQuery = {
      date: { $gte: startDate, $lte: endDate },
    };
    const leaveQuery = {
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
      ],
    };

    if (userId) {
      attendanceQuery.userId = userId;
      leaveQuery.userId = userId;
    }

    // Get attendance and leave records
    const [attendanceRecords, leaveRecords] = await Promise.all([
      Attendance.find(attendanceQuery).populate('userId', 'name email employeeId').lean(),
      Leave.find(leaveQuery).populate('userId', 'name email employeeId').lean(),
    ]);

    // Group by date and user
    const resultMap = new Map();

    // Process attendance
    attendanceRecords.forEach((att) => {
      const date = new Date(att.date);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      const key = `${dateStr}_${att.userId._id}`;
      
      if (att.status === 'leave') {
        resultMap.set(key, {
          date: dateStr,
          userId: att.userId._id,
          userName: att.userId.name,
          status: 'leave-approved',
        });
      } else {
        resultMap.set(key, {
          date: dateStr,
          userId: att.userId._id,
          userName: att.userId.name,
          status: att.status,
        });
      }
    });

    // Process leaves (override attendance if approved)
    leaveRecords.forEach((leave) => {
      const start = new Date(leave.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(leave.endDate);
      end.setHours(0, 0, 0, 0);

      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const key = `${dateStr}_${leave.userId._id}`;
        
        if (leave.status === 'approved') {
          resultMap.set(key, {
            date: dateStr,
            userId: leave.userId._id,
            userName: leave.userId.name,
            status: 'leave-approved',
          });
        } else if (leave.status === 'pending' && !resultMap.has(key)) {
          resultMap.set(key, {
            date: dateStr,
            userId: leave.userId._id,
            userName: leave.userId.name,
            status: 'leave-pending',
          });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    const result = Array.from(resultMap.values());
    res.json(result);
  } catch (error) {
    console.error('Get calendar month all error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;


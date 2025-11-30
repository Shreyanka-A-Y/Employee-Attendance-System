const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { auth, managerAuth } = require('../middleware/auth');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const router = express.Router();

// Helper function to get start and end of day
const getDayBounds = (date) => {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  const start = new Date(normalizedDate);
  const end = new Date(normalizedDate);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @route   POST /api/attendance/checkin
// @desc    Employee check-in
// @access  Private (Employee)
router.post('/checkin', auth, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const { start, end } = getDayBounds(today);

    // Check if already checked in today
    let attendance = await Attendance.findOne({
      userId: req.user._id,
      date: { $gte: start, $lte: end },
    });

    if (attendance && attendance.checkInTime) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    // Determine status (late if after 9:30 AM)
    const checkInTime = new Date();
    const lateThreshold = new Date(today);
    lateThreshold.setHours(9, 30, 0, 0);
    const status = checkInTime > lateThreshold ? 'late' : 'present';

    if (attendance) {
      // Update existing record
      attendance.checkInTime = checkInTime;
      attendance.status = status;
      attendance.totalHours = 0; // Reset hours until checkout
      await attendance.save();
      console.log('Updated attendance record:', attendance._id);
    } else {
      // Create new record
      attendance = await Attendance.create({
        userId: req.user._id,
        date: today,
        checkInTime: checkInTime,
        status: status,
        totalHours: 0,
      });
      console.log('Created new attendance record:', attendance._id);
    }

    res.json({
      message: 'Checked in successfully',
      attendance: {
        checkInTime: attendance.checkInTime,
        status: attendance.status,
      },
    });
  } catch (error) {
    console.error('Check-in error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Already checked in today' });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   POST /api/attendance/checkout
// @desc    Employee check-out
// @access  Private (Employee)
router.post('/checkout', auth, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const { start, end } = getDayBounds(today);

    const attendance = await Attendance.findOne({
      userId: req.user._id,
      date: { $gte: start, $lte: end },
    });

    if (!attendance || !attendance.checkInTime) {
      return res.status(400).json({ message: 'Please check in first' });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    const checkOutTime = new Date();
    attendance.checkOutTime = checkOutTime;

    // Calculate hours explicitly
    const hours = (checkOutTime - attendance.checkInTime) / (1000 * 60 * 60);
    attendance.totalHours = Math.round(hours * 100) / 100; // Round to 2 decimal places

    // Update status if half-day
    if (hours < 4) {
      attendance.status = 'half-day';
    }

    await attendance.save();
    console.log('Updated checkout for attendance:', attendance._id, 'Hours:', attendance.totalHours);

    res.json({
      message: 'Checked out successfully',
      attendance: {
        checkOutTime: attendance.checkOutTime,
        totalHours: attendance.totalHours,
        status: attendance.status,
      },
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   GET /api/attendance/today
// @desc    Get today's attendance status
// @access  Private (Employee)
router.get('/today', auth, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const { start, end } = getDayBounds(today);

    const attendance = await Attendance.findOne({
      userId: req.user._id,
      date: { $gte: start, $lte: end },
    });

    if (attendance) {
      res.json({
        status: attendance.status || 'absent',
        checkInTime: attendance.checkInTime || null,
        checkOutTime: attendance.checkOutTime || null,
        totalHours: attendance.totalHours || 0,
      });
    } else {
      res.json({
        status: 'absent',
        checkInTime: null,
        checkOutTime: null,
        totalHours: 0,
      });
    }
  } catch (error) {
    console.error('Get today error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   GET /api/attendance/my-history
// @desc    Get employee's attendance history
// @access  Private (Employee)
router.get('/my-history', auth, async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 30 } = req.query;
    const query = { userId: req.user._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Attendance.countDocuments(query);

    res.json({
      attendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/my-summary
// @desc    Get employee's monthly summary
// @access  Private (Employee)
router.get('/my-summary', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(month) - 1 : now.getMonth();
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const start = new Date(targetYear, targetMonth, 1);
    const end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const attendance = await Attendance.find({
      userId: req.user._id,
      date: { $gte: start, $lte: end },
    });

    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      totalHours: 0,
      totalDays: attendance.length,
    };

    attendance.forEach((record) => {
      if (record.status === 'present') summary.present++;
      else if (record.status === 'absent') summary.absent++;
      else if (record.status === 'late') summary.late++;
      else if (record.status === 'half-day') summary.halfDay++;

      summary.totalHours += record.totalHours || 0;
    });

    res.json({ summary, month: targetMonth + 1, year: targetYear });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/all
// @desc    Get all employees' attendance (Manager)
// @access  Private (Manager)
router.get('/all', managerAuth, async (req, res) => {
  try {
    const { employeeId, startDate, endDate, status, page = 1, limit = 30 } = req.query;
    const query = {};

    if (employeeId) {
      const user = await User.findOne({ employeeId });
      if (user) {
        query.userId = user._id;
      } else {
        return res.json({ attendance: [], pagination: { page: 1, limit: 30, total: 0, pages: 0 } });
      }
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const attendance = await Attendance.find(query)
      .populate('userId', 'name email employeeId department')
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Attendance.countDocuments(query);

    res.json({
      attendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/employee/:id
// @desc    Get specific employee's attendance (Manager)
// @access  Private (Manager)
router.get('/employee/:id', managerAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { userId: req.params.id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const attendance = await Attendance.find(query)
      .populate('userId', 'name email employeeId department')
      .sort({ date: -1 });

    res.json({ attendance });
  } catch (error) {
    console.error('Get employee attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/summary
// @desc    Get team attendance summary (Manager)
// @access  Private (Manager)
router.get('/summary', managerAuth, async (req, res) => {
  try {
    const { month, year, department } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(month) - 1 : now.getMonth();
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const start = new Date(targetYear, targetMonth, 1);
    const end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    // Build user query
    const userQuery = { role: 'employee' };
    if (department) {
      userQuery.department = department;
    }

    const users = await User.find(userQuery);
    const userIds = users.map((u) => u._id);

    const attendance = await Attendance.find({
      userId: { $in: userIds },
      date: { $gte: start, $lte: end },
    }).populate('userId', 'name employeeId department');

    const summary = {
      totalEmployees: users.length,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      totalHours: 0,
      byDepartment: {},
    };

    attendance.forEach((record) => {
      if (record.status === 'present') summary.present++;
      else if (record.status === 'absent') summary.absent++;
      else if (record.status === 'late') summary.late++;
      else if (record.status === 'half-day') summary.halfDay++;

      summary.totalHours += record.totalHours || 0;

      const dept = record.userId?.department || 'Unassigned';
      if (!summary.byDepartment[dept]) {
        summary.byDepartment[dept] = { present: 0, absent: 0, late: 0, halfDay: 0 };
      }
      if (record.status === 'present') summary.byDepartment[dept].present++;
      else if (record.status === 'absent') summary.byDepartment[dept].absent++;
      else if (record.status === 'late') summary.byDepartment[dept].late++;
      else if (record.status === 'half-day') summary.byDepartment[dept].halfDay++;
    });

    res.json({ summary, month: targetMonth + 1, year: targetYear });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/today-status
// @desc    Get today's attendance status for all employees (Manager)
// @access  Private (Manager)
router.get('/today-status', managerAuth, async (req, res) => {
  try {
    const today = new Date();
    const { start, end } = getDayBounds(today);

    const users = await User.find({ role: 'employee' });
    const userIds = users.map((u) => u._id);

    const attendance = await Attendance.find({
      userId: { $in: userIds },
      date: { $gte: start, $lte: end },
    }).populate('userId', 'name email employeeId department');

    const present = attendance.filter((a) => a.checkInTime);
    const absent = users.filter((u) => !attendance.find((a) => a.userId._id.toString() === u._id.toString()));
    const late = attendance.filter((a) => a.status === 'late');

    res.json({
      present: present.length,
      absent: absent.length,
      late: late.length,
      total: users.length,
      presentList: present,
      absentList: absent.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        employeeId: u.employeeId,
        department: u.department,
      })),
      lateList: late,
    });
  } catch (error) {
    console.error('Get today status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/export
// @desc    Export attendance data as CSV (Manager)
// @access  Private (Manager)
router.get('/export', managerAuth, async (req, res) => {
  try {
    const { startDate, endDate, employeeId, department } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    let userIds = [];
    if (employeeId) {
      const user = await User.findOne({ employeeId });
      if (user) userIds = [user._id];
    } else if (department) {
      const users = await User.find({ department, role: 'employee' });
      userIds = users.map((u) => u._id);
    } else {
      const users = await User.find({ role: 'employee' });
      userIds = users.map((u) => u._id);
    }

    if (userIds.length > 0) {
      query.userId = { $in: userIds };
    }

    const attendance = await Attendance.find(query)
      .populate('userId', 'name email employeeId department')
      .sort({ date: -1 });

    const csvData = attendance.map((record) => ({
      Date: record.date.toISOString().split('T')[0],
      'Employee Name': record.userId?.name || 'N/A',
      'Employee ID': record.userId?.employeeId || 'N/A',
      Department: record.userId?.department || 'N/A',
      'Check In': record.checkInTime ? record.checkInTime.toISOString() : 'N/A',
      'Check Out': record.checkOutTime ? record.checkOutTime.toISOString() : 'N/A',
      Status: record.status,
      'Total Hours': record.totalHours || 0,
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-${Date.now()}.csv`);

    // Simple CSV generation
    const headers = Object.keys(csvData[0] || {});
    const csvRows = [
      headers.join(','),
      ...csvData.map((row) => headers.map((header) => `"${row[header]}"`).join(',')),
    ];

    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


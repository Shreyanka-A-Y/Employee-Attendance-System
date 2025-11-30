const express = require('express');
const router = express.Router();
const { auth, managerAuth } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const User = require('../models/User');

console.log('Calendar routes module loaded - Employee routes available');

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

// @route   GET /api/calendar/employee/:userId/summary
// @desc    Get summary statistics for an employee (Manager only)
// @access  Private (Manager)
// NOTE: This route MUST come before /employee/:userId to avoid route matching conflicts
router.get('/employee/:userId/summary', managerAuth, async (req, res) => {
  try {
    console.log('========================================');
    console.log('GET /api/calendar/employee/:userId/summary - Route hit');
    console.log('Request params:', req.params);
    console.log('Request query:', req.query);
    console.log('User ID from params:', req.params.userId);
    console.log('Manager user:', req.user?.name, req.user?.role);

    const { userId } = req.params;
    const { year, month } = req.query;

    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error('❌ Invalid userId:', userId);
      return res.status(400).json({ message: 'User ID is required and must be valid' });
    }

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Verify employee exists
    const employee = await User.findById(userId);
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({ message: 'Employee not found' });
    }

    let startDate, endDate;

    if (year && month) {
      const yearNum = parseInt(year);
      const monthNum = parseInt(month) - 1;
      startDate = new Date(yearNum, monthNum, 1);
      endDate = new Date(yearNum, monthNum + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to current month
      const today = new Date();
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    // Get leave records
    const leaveRecords = await Leave.find({
      userId,
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
      ],
    }).lean();

    // Calculate statistics
    const stats = {
      totalDays: 0,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      leaveApproved: 0,
      leavePending: 0,
      onTimePercentage: 0,
    };

    // Count working days (excluding weekends for now, can be enhanced)
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sunday (0) and Saturday (6)
        stats.totalDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Process attendance
    attendanceRecords.forEach((att) => {
      if (att.status === 'present') stats.present++;
      else if (att.status === 'absent') stats.absent++;
      else if (att.status === 'late') stats.late++;
      else if (att.status === 'half-day') stats.halfDay++;
      else if (att.status === 'leave') stats.leaveApproved++;
    });

    // Process leaves
    leaveRecords.forEach((leave) => {
      if (leave.status === 'approved') {
        const start = new Date(leave.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(leave.endDate);
        end.setHours(0, 0, 0, 0);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        stats.leaveApproved += days;
      } else if (leave.status === 'pending') {
        const start = new Date(leave.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(leave.endDate);
        end.setHours(0, 0, 0, 0);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        stats.leavePending += days;
      }
    });

    // Calculate on-time percentage (present / (present + late))
    const totalPresentAndLate = stats.present + stats.late;
    if (totalPresentAndLate > 0) {
      stats.onTimePercentage = Math.round((stats.present / totalPresentAndLate) * 100);
    }

    console.log('✅ Summary calculated:', {
      userId,
      period: `${year}-${month}`,
      stats
    });

    const response = {
      userId,
      year: parseInt(year) || new Date().getFullYear(),
      month: parseInt(month) || new Date().getMonth() + 1,
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      statistics: stats,
    };

    console.log('✅ Sending response:', {
      status: 'success',
      dataKeys: Object.keys(response)
    });
    console.log('========================================');

    res.json(response);
  } catch (error) {
    console.error('========================================');
    console.error('❌ Get employee summary error:', {
      message: error.message,
      stack: error.stack,
      userId: req.params.userId,
      year: req.query.year,
      month: req.query.month
    });
    console.error('========================================');
    res.status(500).json({ 
      message: error.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   GET /api/calendar/employee/:userId
// @desc    Get detailed calendar data for a specific employee (Manager only)
// @access  Private (Manager)
router.get('/employee/:userId', managerAuth, async (req, res) => {
  try {
    console.log('GET /api/calendar/employee/:userId - Route hit');
    console.log('User ID:', req.params.userId);

    const { userId } = req.params;
    const { year, month, date } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Verify employee exists
    const employee = await User.findById(userId);
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({ message: 'Employee not found' });
    }

    let startDate, endDate;

    if (date) {
      // Get specific date
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      startDate = new Date(targetDate);
      endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (year && month) {
      // Get month range
      const yearNum = parseInt(year);
      const monthNum = parseInt(month) - 1;
      startDate = new Date(yearNum, monthNum, 1);
      endDate = new Date(yearNum, monthNum + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      return res.status(400).json({ message: 'Either date or year and month are required' });
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ date: 1 })
      .lean();

    // Get leave records
    const leaveRecords = await Leave.find({
      userId,
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
      ],
    })
      .sort({ startDate: 1 })
      .lean();

    // Build detailed calendar data
    const calendarData = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const attendance = attendanceRecords.find((att) => {
        const attDate = new Date(att.date);
        attDate.setHours(0, 0, 0, 0);
        return attDate.getTime() === currentDate.getTime();
      });

      const leave = leaveRecords.find((l) => {
        const leaveStart = new Date(l.startDate);
        leaveStart.setHours(0, 0, 0, 0);
        const leaveEnd = new Date(l.endDate);
        leaveEnd.setHours(0, 0, 0, 0);
        return currentDate >= leaveStart && currentDate <= leaveEnd;
      });

      let status = 'no-record';
      let details = null;

      if (attendance) {
        if (attendance.status === 'leave') {
          status = 'leave-approved';
        } else {
          status = attendance.status;
        }
        details = {
          checkInTime: attendance.checkInTime,
          checkOutTime: attendance.checkOutTime,
          totalHours: attendance.totalHours,
          status: attendance.status,
        };
      } else if (leave) {
        if (leave.status === 'approved') {
          status = 'leave-approved';
        } else if (leave.status === 'pending') {
          status = 'leave-pending';
        }
        details = {
          leaveType: leave.leaveType,
          reason: leave.reason,
          leaveStatus: leave.status,
          managerComment: leave.managerComment,
        };
      }

      calendarData.push({
        date: dateStr,
        status,
        attendance: details,
        leave: leave ? {
          leaveType: leave.leaveType,
          reason: leave.reason,
          status: leave.status,
          managerComment: leave.managerComment,
        } : null,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      employee: {
        id: employee._id,
        name: employee.name,
        employeeId: employee.employeeId,
        department: employee.department,
        email: employee.email,
      },
      calendarData,
    });
  } catch (error) {
    console.error('Get employee calendar error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;

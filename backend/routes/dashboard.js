const express = require('express');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { auth, managerAuth } = require('../middleware/auth');

const router = express.Router();

// Helper function to get start and end of day
const getDayBounds = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @route   GET /api/dashboard/employee
// @desc    Get employee dashboard data
// @access  Private (Employee)
router.get('/employee', auth, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { start, end } = getDayBounds(today);

    // Today's attendance
    const todayAttendance = await Attendance.findOne({
      userId: req.user._id,
      date: { $gte: start, $lte: end },
    });

    // Last 7 days
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const recentAttendance = await Attendance.find({
      userId: req.user._id,
      date: { $gte: sevenDaysAgo },
    })
      .sort({ date: -1 })
      .limit(7);

    // Monthly stats
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const monthlyAttendance = await Attendance.find({
      userId: req.user._id,
      date: { $gte: monthStart, $lte: monthEnd },
    });

    const monthlyStats = {
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      totalHours: 0,
    };

    monthlyAttendance.forEach((record) => {
      if (record.status === 'present') monthlyStats.present++;
      else if (record.status === 'absent') monthlyStats.absent++;
      else if (record.status === 'late') monthlyStats.late++;
      else if (record.status === 'half-day') monthlyStats.halfDay++;
      monthlyStats.totalHours += record.totalHours || 0;
    });

    // Total hours (all time) - query from database
    const allAttendance = await Attendance.find({ userId: req.user._id });
    const totalHours = allAttendance.reduce((sum, record) => sum + (record.totalHours || 0), 0);

    res.json({
      todayStatus: {
        checkedIn: !!todayAttendance?.checkInTime,
        checkedOut: !!todayAttendance?.checkOutTime,
        status: todayAttendance?.status || 'absent',
        checkInTime: todayAttendance?.checkInTime,
        checkOutTime: todayAttendance?.checkOutTime,
        totalHours: todayAttendance?.totalHours || 0,
      },
      monthlyStats,
      totalHours: Math.round(totalHours * 100) / 100,
      recentAttendance: recentAttendance.map((a) => ({
        date: a.date,
        status: a.status,
        checkInTime: a.checkInTime,
        checkOutTime: a.checkOutTime,
        totalHours: a.totalHours || 0,
      })),
    });
  } catch (error) {
    console.error('Employee dashboard error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   GET /api/dashboard/manager
// @desc    Get manager dashboard data
// @access  Private (Manager)
router.get('/manager', managerAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { start, end } = getDayBounds(today);

    // Total employees - query from database
    const totalEmployees = await User.countDocuments({ role: 'employee' });

    // Today's status - get all employees from database
    const users = await User.find({ role: 'employee' });
    const userIds = users.map((u) => u._id);

    if (userIds.length === 0) {
      return res.json({
        totalEmployees: 0,
        todayStats: { present: 0, absent: 0, late: 0 },
        weeklyTrend: [],
        departmentStats: {},
        lateArrivals: [],
        absentList: [],
      });
    }

    const todayAttendance = await Attendance.find({
      userId: { $in: userIds },
      date: { $gte: start, $lte: end },
    }).populate('userId', 'name employeeId department');

    const todayPresent = todayAttendance.filter((a) => a.checkInTime).length;
    const todayAbsent = totalEmployees - todayPresent;
    const todayLate = todayAttendance.filter((a) => a.status === 'late').length;

    // Weekly trend (last 7 days) - query from database
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const weeklyAttendance = await Attendance.find({
      userId: { $in: userIds },
      date: { $gte: sevenDaysAgo },
    });

    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const { start: dayStart, end: dayEnd } = getDayBounds(date);
      const dayAttendance = weeklyAttendance.filter(
        (a) => {
          const recordDate = new Date(a.date);
          recordDate.setHours(0, 0, 0, 0);
          return recordDate >= dayStart && recordDate <= dayEnd;
        }
      );
      weeklyTrend.push({
        date: date.toISOString().split('T')[0],
        present: dayAttendance.filter((a) => a.checkInTime).length,
        absent: totalEmployees - dayAttendance.filter((a) => a.checkInTime).length,
      });
    }

    // Department-wise attendance - query from database
    const departments = await User.distinct('department', { role: 'employee' });
    const departmentStats = {};
    for (const dept of departments) {
      const deptUsers = await User.find({ department: dept, role: 'employee' });
      const deptUserIds = deptUsers.map((u) => u._id);
      const deptAttendance = await Attendance.find({
        userId: { $in: deptUserIds },
        date: { $gte: start, $lte: end },
      });
      departmentStats[dept || 'Unassigned'] = {
        total: deptUsers.length,
        present: deptAttendance.filter((a) => a.checkInTime).length,
        absent: deptUsers.length - deptAttendance.filter((a) => a.checkInTime).length,
      };
    }

    // Late arrivals today
    const lateArrivals = todayAttendance
      .filter((a) => a.status === 'late' && a.userId)
      .map((a) => ({
        name: a.userId.name,
        employeeId: a.userId.employeeId,
        department: a.userId.department,
        checkInTime: a.checkInTime,
      }));

    // Absent list today
    const presentUserIds = todayAttendance.map((a) => a.userId?._id?.toString()).filter(Boolean);
    const absentList = users
      .filter((u) => !presentUserIds.includes(u._id.toString()))
      .map((u) => ({
        name: u.name,
        employeeId: u.employeeId,
        department: u.department,
        email: u.email,
      }));

    res.json({
      totalEmployees,
      todayStats: {
        present: todayPresent,
        absent: todayAbsent,
        late: todayLate,
      },
      weeklyTrend,
      departmentStats,
      lateArrivals,
      absentList,
    });
  } catch (error) {
    console.error('Manager dashboard error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;


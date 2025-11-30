const express = require('express');
const router = express.Router();
const { auth, managerAuth } = require('../middleware/auth');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Leave = require('../models/Leave');

// @route   GET /api/notifications
// @desc    Get all notifications for the current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { category, unreadOnly, limit = 50 } = req.query;

    // Helper function to map department to target group
    const getDepartmentGroup = (department) => {
      if (!department) return null;
      const deptLower = department.toLowerCase();
      if (deptLower.includes('dev') || deptLower.includes('develop')) return 'dev';
      if (deptLower.includes('test') || deptLower.includes('qa') || deptLower.includes('quality')) return 'test';
      if (deptLower.includes('support') || deptLower.includes('customer')) return 'support';
      if (deptLower.includes('design') || deptLower.includes('ui') || deptLower.includes('graphic')) return 'design';
      if (deptLower.includes('manag')) return 'management';
      return null;
    };

    const userDepartmentGroup = getDepartmentGroup(req.user.department);

    // Build query
    const query = {
      $or: [
        { receiverId: userId },
        { targetGroup: 'all' },
        ...(userDepartmentGroup ? [{ targetGroup: userDepartmentGroup }] : []),
      ],
    };

    // Filter by category if provided
    if (category) {
      query.category = category;
    }

    // Filter by read status if provided
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    // Fetch notifications
    const notifications = await Notification.find(query)
      .populate('senderId', 'name email employeeId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Count unread notifications
    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false,
    });

    // Group notifications by category
    const grouped = {
      leave: [],
      approval: [],
      notice: [],
      alert: [],
      system: [],
      all: notifications,
    };

    notifications.forEach((notif) => {
      if (grouped[notif.category]) {
        grouped[notif.category].push(notif);
      }
    });

    res.json({
      notifications,
      grouped,
      unreadCount,
      total: notifications.length,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Helper function to map department to target group
    const getDepartmentGroup = (department) => {
      if (!department) return null;
      const deptLower = department.toLowerCase();
      if (deptLower.includes('dev') || deptLower.includes('develop')) return 'dev';
      if (deptLower.includes('test') || deptLower.includes('qa') || deptLower.includes('quality')) return 'test';
      if (deptLower.includes('support') || deptLower.includes('customer')) return 'support';
      if (deptLower.includes('design') || deptLower.includes('ui') || deptLower.includes('graphic')) return 'design';
      if (deptLower.includes('manag')) return 'management';
      return null;
    };

    const userDepartmentGroup = getDepartmentGroup(req.user.department);

    const count = await Notification.countDocuments({
      isRead: false,
      $or: [
        { receiverId: userId },
        { targetGroup: 'all' },
        ...(userDepartmentGroup ? [{ targetGroup: userDepartmentGroup }] : []),
      ],
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    // Verify notification belongs to user or is targeted to them
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Helper function to map department to target group
    const getDepartmentGroup = (department) => {
      if (!department) return null;
      const deptLower = department.toLowerCase();
      if (deptLower.includes('dev') || deptLower.includes('develop')) return 'dev';
      if (deptLower.includes('test') || deptLower.includes('qa') || deptLower.includes('quality')) return 'test';
      if (deptLower.includes('support') || deptLower.includes('customer')) return 'support';
      if (deptLower.includes('design') || deptLower.includes('ui') || deptLower.includes('graphic')) return 'design';
      if (deptLower.includes('manag')) return 'management';
      return null;
    };

    const userDepartmentGroup = getDepartmentGroup(req.user.department);

    // Check if user has access to this notification
    const hasAccess =
      notification.receiverId?.toString() === userId.toString() ||
      notification.targetGroup === 'all' ||
      notification.targetGroup === userDepartmentGroup;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark as read
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read for current user
// @access  Private
router.put('/read-all', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Helper function to map department to target group
    const getDepartmentGroup = (department) => {
      if (!department) return null;
      const deptLower = department.toLowerCase();
      if (deptLower.includes('dev') || deptLower.includes('develop')) return 'dev';
      if (deptLower.includes('test') || deptLower.includes('qa') || deptLower.includes('quality')) return 'test';
      if (deptLower.includes('support') || deptLower.includes('customer')) return 'support';
      if (deptLower.includes('design') || deptLower.includes('ui') || deptLower.includes('graphic')) return 'design';
      if (deptLower.includes('manag')) return 'management';
      return null;
    };

    const userDepartmentGroup = getDepartmentGroup(req.user.department);

    await Notification.updateMany(
      {
        isRead: false,
        $or: [
          { receiverId: userId },
          { targetGroup: 'all' },
          ...(userDepartmentGroup ? [{ targetGroup: userDepartmentGroup }] : []),
        ],
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   POST /api/notifications/broadcast
// @desc    Manager broadcast notice to team(s)
// @access  Private (Manager)
router.post('/broadcast', managerAuth, async (req, res) => {
  try {
    const { message, targetGroup, title } = req.body;

    if (!message || !targetGroup) {
      return res.status(400).json({
        message: 'Message and target group are required',
      });
    }

    const validGroups = ['all', 'dev', 'test', 'support', 'design', 'management'];
    if (!validGroups.includes(targetGroup)) {
      return res.status(400).json({
        message: 'Invalid target group',
      });
    }

    // Get all users in the target group
    let targetUsers = [];
    if (targetGroup === 'all') {
      targetUsers = await User.find({ role: 'employee' });
    } else {
      // Map group names to department names
      const departmentMap = {
        dev: ['Development', 'Developer', 'Dev'],
        test: ['Testing', 'QA', 'Test', 'Quality Assurance'],
        support: ['Support', 'Customer Support'],
        design: ['Design', 'UI/UX', 'Graphics'],
        management: ['Management', 'Manager'],
      };

      const departments = departmentMap[targetGroup] || [targetGroup];
      targetUsers = await User.find({
        role: 'employee',
        department: { $in: departments },
      });
    }

    // Create notifications for each user
    const notifications = targetUsers.map((user) => ({
      senderId: req.user._id,
      receiverId: user._id,
      targetGroup: targetGroup,
      category: 'notice',
      title: title || 'Team Notice',
      message: message,
      isRead: false,
      createdAt: new Date(),
    }));

    // Also create a group notification for those who match by department
    await Notification.create({
      senderId: req.user._id,
      receiverId: null,
      targetGroup: targetGroup,
      category: 'notice',
      title: title || 'Team Notice',
      message: message,
      isRead: false,
    });

    // Insert individual notifications
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({
      message: 'Notice broadcasted successfully',
      recipientsCount: targetUsers.length,
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   POST /api/notifications
// @desc    Create a notification (internal use)
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      receiverId,
      targetGroup,
      category,
      title,
      message,
      metadata,
    } = req.body;

    if (!category || !title || !message) {
      return res.status(400).json({
        message: 'Category, title, and message are required',
      });
    }

    const notification = await Notification.create({
      senderId: req.user._id,
      receiverId: receiverId || null,
      targetGroup: targetGroup || null,
      category,
      title,
      message,
      metadata: metadata || {},
      isRead: false,
    });

    res.status(201).json({
      message: 'Notification created successfully',
      notification,
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;


const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create a notification when employee applies for leave
 */
async function notifyLeaveApplication(leaveData) {
  try {
    // Find all managers
    const managers = await User.find({ role: 'manager' });

    if (managers.length === 0) {
      console.log('No managers found to notify about leave application');
      return;
    }

    // Create notifications for each manager
    const notifications = managers.map((manager) => ({
      senderId: leaveData.userId,
      receiverId: manager._id,
      category: 'leave',
      title: 'New Leave Application',
      message: `${leaveData.employeeName} has applied for ${leaveData.leaveType} leave from ${new Date(leaveData.startDate).toLocaleDateString()} to ${new Date(leaveData.endDate).toLocaleDateString()}`,
      metadata: {
        leaveId: leaveData.leaveId,
        leaveType: leaveData.leaveType,
        startDate: leaveData.startDate,
        endDate: leaveData.endDate,
      },
      isRead: false,
    }));

    await Notification.insertMany(notifications);
    console.log(`Created ${notifications.length} leave application notifications`);
  } catch (error) {
    console.error('Error creating leave application notifications:', error);
  }
}

/**
 * Create a notification when manager approves/rejects leave
 */
async function notifyLeaveDecision(leaveData) {
  try {
    const notification = await Notification.create({
      senderId: leaveData.managerId,
      receiverId: leaveData.userId,
      category: 'approval',
      title: `Leave Request ${leaveData.status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your ${leaveData.leaveType} leave request has been ${leaveData.status}${leaveData.managerComment ? `: ${leaveData.managerComment}` : ''}`,
      metadata: {
        leaveId: leaveData.leaveId,
        approvalStatus: leaveData.status,
        managerComment: leaveData.managerComment || null,
        leaveType: leaveData.leaveType,
        startDate: leaveData.startDate,
        endDate: leaveData.endDate,
      },
      isRead: false,
    });

    console.log('Created leave decision notification:', notification._id);
    return notification;
  } catch (error) {
    console.error('Error creating leave decision notification:', error);
    throw error;
  }
}

module.exports = {
  notifyLeaveApplication,
  notifyLeaveDecision,
};


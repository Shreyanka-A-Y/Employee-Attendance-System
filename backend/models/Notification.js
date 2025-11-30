const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  targetGroup: {
    type: String,
    enum: ['all', 'dev', 'test', 'support', 'design', 'management', null],
    default: null,
    index: true,
  },
  category: {
    type: String,
    enum: ['leave', 'approval', 'notice', 'alert', 'system'],
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  metadata: {
    leaveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Leave',
      default: null,
    },
    approvalStatus: {
      type: String,
      enum: ['approved', 'rejected', null],
      default: null,
    },
    managerComment: {
      type: String,
      trim: true,
      default: null,
    },
    leaveType: {
      type: String,
      default: null,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  readAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Index for efficient queries
notificationSchema.index({ receiverId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ targetGroup: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ senderId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);


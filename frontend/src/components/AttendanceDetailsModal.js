import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAttendanceByDate, clearDateDetails, setDateDetailsFromCache } from '../store/slices/attendanceSlice';
import { X, MapPin, Clock, Calendar, User, AlertCircle } from 'lucide-react';
import './AttendanceDetailsModal.css';

const AttendanceDetailsModal = ({ isOpen, onClose, date, userId = null, employeeName = null }) => {
  const dispatch = useDispatch();
  const { dateDetails, dateDetailsCache, loading, error } = useSelector((state) => state.attendance);

  useEffect(() => {
    if (isOpen && date) {
      // Check cache first
      const cached = dateDetailsCache?.[date];
      if (cached && cached.hasRecord !== undefined) {
        // Check if cache is for the same user
        const cacheUserId = cached.employee?.id;
        if ((userId && cacheUserId === userId) || (!userId && !cacheUserId)) {
          // Cache is valid, set it directly to dateDetails
          if (!dateDetails || dateDetails.date !== date) {
            // Set from cache
            dispatch(setDateDetailsFromCache(cached));
          }
          return;
        }
      }
      // Fetch from API
      console.log('Fetching attendance details for date:', date, 'userId:', userId);
      dispatch(getAttendanceByDate({ date, userId }));
    }
  }, [isOpen, date, userId, dispatch, dateDetailsCache, dateDetails]);

  useEffect(() => {
    // Clear details when modal closes
    if (!isOpen) {
      dispatch(clearDateDetails());
    }
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'present':
        return 'status-badge present';
      case 'late':
        return 'status-badge late';
      case 'half-day':
        return 'status-badge halfday';
      case 'absent':
        return 'status-badge absent';
      case 'leave-approved':
        return 'status-badge leave-approved';
      case 'leave-pending':
        return 'status-badge leave-pending';
      default:
        return 'status-badge no-record';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'present':
        return 'Present';
      case 'late':
        return 'Late';
      case 'half-day':
        return 'Half Day';
      case 'absent':
        return 'Absent';
      case 'leave-approved':
        return 'On Leave (Approved)';
      case 'leave-pending':
        return 'On Leave (Pending)';
      default:
        return 'No Record';
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="attendance-details-modal-overlay" onClick={handleOverlayClick}>
      <div className="attendance-details-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <Calendar size={20} />
            <h2>Attendance Details</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="modal-loading">Loading attendance details...</div>
          ) : error ? (
            <div className="modal-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          ) : !dateDetails || (dateDetails.hasRecord === false) ? (
            <div className="modal-no-record">
              <AlertCircle size={48} className="no-record-icon" />
              <p>No attendance record available for this day.</p>
              <p className="no-record-date">{date ? formatDate(date) : ''}</p>
            </div>
          ) : (
            <>
              {/* Date and Employee Info */}
              <div className="detail-section">
                <div className="detail-row">
                  <div className="detail-label">
                    <Calendar size={16} />
                    <span>Date</span>
                  </div>
                  <div className="detail-value">{formatDate(dateDetails.date)}</div>
                </div>
                {dateDetails.employee && (
                  <div className="detail-row">
                    <div className="detail-label">
                      <User size={16} />
                      <span>Employee</span>
                    </div>
                    <div className="detail-value">
                      {dateDetails.employee.name}
                      {dateDetails.employee.employeeId && ` (${dateDetails.employee.employeeId})`}
                    </div>
                  </div>
                )}
                <div className="detail-row">
                  <div className="detail-label">
                    <span>Status</span>
                  </div>
                  <div className="detail-value">
                    <span className={getStatusBadgeClass(dateDetails.status)}>
                      {getStatusLabel(dateDetails.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendance Details */}
              {dateDetails.attendance && (
                <div className="detail-section">
                  <h3 className="section-title">Attendance Information</h3>
                  <div className="detail-row">
                    <div className="detail-label">
                      <Clock size={16} />
                      <span>Check-In Time</span>
                    </div>
                    <div className="detail-value">
                      {formatTime(dateDetails.attendance.checkInTime)}
                    </div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">
                      <Clock size={16} />
                      <span>Check-Out Time</span>
                    </div>
                    <div className="detail-value">
                      {formatTime(dateDetails.attendance.checkOutTime)}
                    </div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">
                      <span>Total Working Hours</span>
                    </div>
                    <div className="detail-value">
                      {dateDetails.attendance.totalHours || 0} hours
                    </div>
                  </div>
                  {dateDetails.lateInfo && dateDetails.lateInfo.isLate && (
                    <div className="detail-row warning">
                      <div className="detail-label">
                        <AlertCircle size={16} />
                        <span>Late Arrival</span>
                      </div>
                      <div className="detail-value">
                        {dateDetails.lateInfo.minutesLate} minutes late
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Leave Details */}
              {dateDetails.leave && (
                <div className="detail-section">
                  <h3 className="section-title">Leave Information</h3>
                  <div className="detail-row">
                    <div className="detail-label">
                      <span>Leave Type</span>
                    </div>
                    <div className="detail-value">{dateDetails.leave.leaveType}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">
                      <span>Reason</span>
                    </div>
                    <div className="detail-value">{dateDetails.leave.reason}</div>
                  </div>
                  {dateDetails.leave.managerComment && (
                    <div className="detail-row">
                      <div className="detail-label">
                        <span>Manager Comment</span>
                      </div>
                      <div className="detail-value">{dateDetails.leave.managerComment}</div>
                    </div>
                  )}
                  {dateDetails.leave.approvedAt && (
                    <div className="detail-row">
                      <div className="detail-label">
                        <span>Approved At</span>
                      </div>
                      <div className="detail-value">
                        {new Date(dateDetails.leave.approvedAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Geolocation (if available in future) */}
              {dateDetails.attendance?.checkInLocation && (
                <div className="detail-section">
                  <h3 className="section-title">Location</h3>
                  <div className="location-info">
                    <MapPin size={16} />
                    <span>
                      {dateDetails.attendance.checkInLocation.latitude.toFixed(6)},{' '}
                      {dateDetails.attendance.checkInLocation.longitude.toFixed(6)}
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${dateDetails.attendance.checkInLocation.latitude},${dateDetails.attendance.checkInLocation.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-map-link"
                    >
                      View on Map
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDetailsModal;


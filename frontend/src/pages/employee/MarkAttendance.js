import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getTodayStatus, checkIn, checkOut } from '../../store/slices/attendanceSlice';
import './MarkAttendance.css';

const MarkAttendance = () => {
  const dispatch = useDispatch();
  const { todayStatus, loading } = useSelector((state) => state.attendance);

  useEffect(() => {
    dispatch(getTodayStatus());
  }, [dispatch]);

  const handleCheckIn = () => {
    dispatch(checkIn()).then(() => {
      dispatch(getTodayStatus());
    });
  };

  const handleCheckOut = () => {
    dispatch(checkOut()).then(() => {
      dispatch(getTodayStatus());
    });
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="container">
      <h1>Mark Attendance</h1>

      <div className="attendance-card">
        <div className="attendance-header">
          <h2>Today's Attendance</h2>
          <div className="date-display">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>

        <div className="attendance-status">
          <div className="status-badge">
            <span className="status-label">Current Status:</span>
            <span className={`status-value status-${todayStatus?.status || 'absent'}`}>
              {todayStatus?.status?.toUpperCase() || 'NOT CHECKED IN'}
            </span>
          </div>
        </div>

        <div className="time-records">
          <div className="time-record">
            <div className="time-label">Check In Time</div>
            <div className="time-value">
              {todayStatus?.checkInTime ? formatTime(todayStatus.checkInTime) : 'Not checked in'}
            </div>
          </div>
          <div className="time-record">
            <div className="time-label">Check Out Time</div>
            <div className="time-value">
              {todayStatus?.checkOutTime ? formatTime(todayStatus.checkOutTime) : 'Not checked out'}
            </div>
          </div>
          {todayStatus?.totalHours > 0 && (
            <div className="time-record">
              <div className="time-label">Total Hours</div>
              <div className="time-value hours">{todayStatus.totalHours} hours</div>
            </div>
          )}
        </div>

        <div className="action-section">
          {!todayStatus?.checkInTime ? (
            <button
              onClick={handleCheckIn}
              className="btn btn-success btn-checkin"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Check In'}
            </button>
          ) : !todayStatus?.checkOutTime ? (
            <button
              onClick={handleCheckOut}
              className="btn btn-danger btn-checkout"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Check Out'}
            </button>
          ) : (
            <div className="completed-message">
              <p>✓ You have completed your attendance for today!</p>
            </div>
          )}
        </div>

        <div className="info-box">
          <h3>Attendance Rules</h3>
          <ul>
            <li>Check-in time: Before 9:30 AM is considered on-time</li>
            <li>Check-in after 9:30 AM is marked as late</li>
            <li>Minimum 4 hours required for full day attendance</li>
            <li>Less than 4 hours is considered half-day</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;


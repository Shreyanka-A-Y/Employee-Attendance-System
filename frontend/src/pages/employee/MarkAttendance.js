import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getTodayStatus, checkIn, checkOut } from '../../store/slices/attendanceSlice';
import './MarkAttendance.css';

const MarkAttendance = () => {
  const dispatch = useDispatch();
  const { todayStatus, loading, error } = useSelector((state) => state.attendance);
  const [localError, setLocalError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    dispatch(getTodayStatus());
  }, [dispatch]);

  // Debug: Log todayStatus changes
  useEffect(() => {
    console.log('Today Status Updated:', {
      checkInTime: todayStatus?.checkInTime,
      checkOutTime: todayStatus?.checkOutTime,
      status: todayStatus?.status,
      fullStatus: todayStatus,
    });
  }, [todayStatus]);

  // Clear local error when status updates
  useEffect(() => {
    if (todayStatus?.checkInTime) {
      setLocalError(null);
    }
  }, [todayStatus]);

  const handleCheckIn = async () => {
    // Prevent duplicate clicks
    if (isProcessing || loading || todayStatus?.checkInTime) {
      return;
    }

    setLocalError(null);
    setIsProcessing(true);
    
    try {
      const result = await dispatch(checkIn());
      if (checkIn.fulfilled.match(result)) {
        // Success - immediately update local state shows check-in
        // Then refresh to get complete status
        await dispatch(getTodayStatus());
      } else {
        // Error occurred - show backend error message
        const errorMessage = result.payload || 'Check-in failed. Please try again.';
        setLocalError(errorMessage);
        console.error('Check-in error:', errorMessage);
        // Refresh status to get latest state (might already be checked in)
        await dispatch(getTodayStatus());
      }
    } catch (err) {
      console.error('Check-in exception:', err);
      setLocalError('An unexpected error occurred. Please try again.');
      await dispatch(getTodayStatus());
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    // Prevent duplicate clicks
    if (isProcessing || loading || !todayStatus?.checkInTime || todayStatus?.checkOutTime) {
      return;
    }

    setLocalError(null);
    setIsProcessing(true);
    
    try {
      const result = await dispatch(checkOut());
      if (checkOut.fulfilled.match(result)) {
        // Success - refresh status
        await dispatch(getTodayStatus());
      } else {
        // Error occurred - show backend error message
        const errorMessage = result.payload || 'Check-out failed. Please try again.';
        setLocalError(errorMessage);
        console.error('Check-out error:', errorMessage);
        // Refresh status to get latest state
        await dispatch(getTodayStatus());
      }
    } catch (err) {
      console.error('Check-out exception:', err);
      setLocalError('An unexpected error occurred. Please try again.');
      await dispatch(getTodayStatus());
    } finally {
      setIsProcessing(false);
    }
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
          {(localError || error) && (
            <div className="error-message" style={{ 
              padding: '10px', 
              marginBottom: '15px', 
              backgroundColor: '#fee', 
              color: '#c33', 
              borderRadius: '5px',
              border: '1px solid #fcc'
            }}>
              {localError || error}
            </div>
          )}
          {!todayStatus?.checkInTime ? (
            <button
              onClick={handleCheckIn}
              className="btn btn-success btn-checkin"
              disabled={loading || isProcessing}
            >
              {loading || isProcessing ? 'Processing...' : 'Check In'}
            </button>
          ) : !todayStatus?.checkOutTime ? (
            <button
              onClick={handleCheckOut}
              className="btn btn-danger btn-checkout"
              disabled={loading || isProcessing}
            >
              {loading || isProcessing ? 'Processing...' : 'Check Out'}
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


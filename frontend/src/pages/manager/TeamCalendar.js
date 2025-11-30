import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getEmployeeCalendar,
  getAllEmployees,
  clearError,
} from '../../store/slices/calendarSlice';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './TeamCalendar.css';

const TeamCalendar = () => {
  const dispatch = useDispatch();
  const { employeeCalendar, employees, loading, error } = useSelector(
    (state) => state.calendar
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch employees on mount
  useEffect(() => {
    dispatch(getAllEmployees());
  }, [dispatch]);

  // Fetch calendar data when employee or month changes
  useEffect(() => {
    if (selectedEmployeeId) {
      const year = calendarDate.getFullYear();
      const month = calendarDate.getMonth() + 1;
      dispatch(getEmployeeCalendar({ userId: selectedEmployeeId, year, month }));
    }
  }, [dispatch, selectedEmployeeId, calendarDate]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleEmployeeChange = (e) => {
    setSelectedEmployeeId(e.target.value);
    setSelectedDate(null);
    setShowDetailsModal(false);
  };

  const handleCalendarChange = (date) => {
    setCalendarDate(date);
    setSelectedDate(null);
    setShowDetailsModal(false);
  };

  const handleDateClick = (date) => {
    if (!selectedEmployeeId) return;
    setSelectedDate(date);
    setShowDetailsModal(true);
  };

  const getStatusClass = (status, date) => {
    const dateStr = date.toISOString().split('T')[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = dateStr === today.toISOString().split('T')[0];

    const baseClasses = [];
    if (isToday) {
      baseClasses.push('calendar-today');
    }

    switch (status) {
      case 'present':
        baseClasses.push('calendar-status-present');
        break;
      case 'late':
        baseClasses.push('calendar-status-late');
        break;
      case 'half-day':
        baseClasses.push('calendar-status-halfday');
        break;
      case 'absent':
        baseClasses.push('calendar-status-absent');
        break;
      case 'leave-approved':
        baseClasses.push('calendar-status-leave-approved');
        break;
      case 'leave-pending':
        baseClasses.push('calendar-status-leave-pending');
        break;
      case 'no-record':
        baseClasses.push('calendar-status-no-record');
        break;
      default:
        break;
    }

    return baseClasses.join(' ');
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month' || !employeeCalendar?.calendarData) return null;

    const dateStr = date.toISOString().split('T')[0];
    const dayData = employeeCalendar.calendarData.find((item) => item.date === dateStr);

    if (dayData) {
      return getStatusClass(dayData.status, date);
    }

    // Check if it's today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateStr === today.toISOString().split('T')[0]) {
      return 'calendar-today';
    }

    return null;
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month' || !employeeCalendar?.calendarData) return null;

    const dateStr = date.toISOString().split('T')[0];
    const dayData = employeeCalendar.calendarData.find((item) => item.date === dateStr);

    if (dayData) {
      const status = dayData.status;
      if (status === 'leave-approved') {
        return <div className="calendar-badge leave-badge">L</div>;
      }
      if (status === 'leave-pending') {
        return <div className="calendar-badge pending-badge">P</div>;
      }
      if (status === 'late') {
        return <div className="calendar-badge late-badge">Late</div>;
      }
      if (status === 'present') {
        return <div className="calendar-dot present-dot"></div>;
      }
      if (status === 'half-day') {
        return <div className="calendar-badge halfday-badge">½</div>;
      }
      if (status === 'absent') {
        return <div className="calendar-dot absent-dot"></div>;
      }
    }

    return null;
  };

  const getSelectedDateData = () => {
    if (!selectedDate || !employeeCalendar?.calendarData) return null;
    const dateStr = selectedDate.toISOString().split('T')[0];
    return employeeCalendar.calendarData.find((item) => item.date === dateStr);
  };

  const selectedDateData = getSelectedDateData();
  const selectedEmployee = employees.find((emp) => emp._id === selectedEmployeeId);

  return (
    <div className="container">
      <h1>Employee Calendar</h1>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Employee Selection */}
      <div className="card employee-selector-card">
        <div className="employee-selector">
          <label htmlFor="employeeSelect" className="selector-label">
            Select Employee:
          </label>
          <select
            id="employeeSelect"
            value={selectedEmployeeId}
            onChange={handleEmployeeChange}
            className="form-control employee-select"
            disabled={loading}
          >
            <option value="">-- Select an Employee --</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name} {emp.employeeId ? `(${emp.employeeId})` : ''} - {emp.department || 'No Department'}
              </option>
            ))}
          </select>
        </div>

        {selectedEmployee && (
          <div className="employee-info">
            <h3>{selectedEmployee.name}</h3>
            <div className="employee-details">
              <span><strong>ID:</strong> {selectedEmployee.employeeId || 'N/A'}</span>
              <span><strong>Department:</strong> {selectedEmployee.department || 'N/A'}</span>
              <span><strong>Email:</strong> {selectedEmployee.email || 'N/A'}</span>
            </div>
          </div>
        )}
      </div>

      {selectedEmployeeId && (
        <>
          {/* Calendar */}
          <div className="calendar-layout">
            <div className="calendar-section">
              <div className="card">
                {loading && (
                  <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Loading calendar...</p>
                  </div>
                )}
                <Calendar
                  onChange={handleCalendarChange}
                  value={calendarDate}
                  onClickDay={handleDateClick}
                  tileClassName={tileClassName}
                  tileContent={tileContent}
                  className="team-calendar"
                  onActiveStartDateChange={({ activeStartDate }) => {
                    if (activeStartDate) {
                      setCalendarDate(activeStartDate);
                    }
                  }}
                />
                <div className="legend">
                  <div className="legend-item">
                    <span className="legend-color present"></span>
                    <span>Present</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color absent"></span>
                    <span>Absent</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color late"></span>
                    <span>Late</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color half-day"></span>
                    <span>Half Day</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color leave-approved"></span>
                    <span>Leave (Approved)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color leave-pending"></span>
                    <span>Leave (Pending)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color no-record"></span>
                    <span>No Record</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!selectedEmployeeId && (
        <div className="card empty-state-card">
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>Select an Employee</h3>
            <p>Please select an employee from the dropdown above to view their calendar and attendance details.</p>
          </div>
        </div>
      )}

      {/* Date Details Modal */}
      {showDetailsModal && selectedDate && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Attendance Details</h2>
              <button
                className="modal-close"
                onClick={() => setShowDetailsModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-date">
                <strong>Date:</strong> {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              <div className="detail-status">
                <strong>Status:</strong>
                <span className={`status-badge status-${selectedDateData?.status || 'no-record'}`}>
                  {!selectedDateData || selectedDateData.status === 'no-record' ? 'No Record' :
                   selectedDateData.status === 'leave-approved' ? 'On Leave (Approved)' :
                   selectedDateData.status === 'leave-pending' ? 'On Leave (Pending)' :
                   selectedDateData.status.charAt(0).toUpperCase() + selectedDateData.status.slice(1)}
                </span>
              </div>

              {selectedDateData?.attendance && (
                <div className="detail-section">
                  <h4>Attendance Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Check In:</strong>
                      <span>
                        {selectedDateData.attendance.checkInTime
                          ? new Date(selectedDateData.attendance.checkInTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Not checked in'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <strong>Check Out:</strong>
                      <span>
                        {selectedDateData.attendance.checkOutTime
                          ? new Date(selectedDateData.attendance.checkOutTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Not checked out'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <strong>Total Hours:</strong>
                      <span>{selectedDateData.attendance.totalHours?.toFixed(2) || '0.00'} hrs</span>
                    </div>
                    <div className="detail-item">
                      <strong>Status:</strong>
                      <span className={`status-badge status-${selectedDateData.attendance.status}`}>
                        {selectedDateData.attendance.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedDateData?.leave && (
                <div className="detail-section">
                  <h4>Leave Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Leave Type:</strong>
                      <span>{selectedDateData.leave.leaveType}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Status:</strong>
                      <span className={`status-badge status-${selectedDateData.leave.status}`}>
                        {selectedDateData.leave.status}
                      </span>
                    </div>
                    <div className="detail-item full-width">
                      <strong>Reason:</strong>
                      <p>{selectedDateData.leave.reason}</p>
                    </div>
                    {selectedDateData.leave.managerComment && (
                      <div className="detail-item full-width">
                        <strong>Manager Comment:</strong>
                        <p>{selectedDateData.leave.managerComment}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(!selectedDateData || selectedDateData.status === 'no-record') && (
                <div className="detail-section">
                  <p className="no-record-message">No attendance or leave record found for this date.</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamCalendar;

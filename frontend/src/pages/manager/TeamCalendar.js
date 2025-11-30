import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllAttendance } from '../../store/slices/attendanceSlice';
import { getCalendarMonthAll } from '../../store/slices/calendarSlice';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './TeamCalendar.css';

const TeamCalendar = () => {
  const dispatch = useDispatch();
  const { allAttendance } = useSelector((state) => state.attendance);
  const { monthDataAll } = useSelector((state) => state.calendar);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    dispatch(getAllAttendance({ startDate: startDate.toISOString(), endDate: endDate.toISOString() }));
  }, [dispatch, selectedDate]);

  // Fetch calendar data when month changes
  useEffect(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth() + 1;
    dispatch(getCalendarMonthAll({ year, month, userId: selectedUserId || undefined }));
  }, [dispatch, calendarDate, selectedUserId]);

  const handleCalendarChange = (date) => {
    setCalendarDate(date);
  };

  // Get unique users from attendance data
  const uniqueUsers = Array.from(
    new Set(
      allAttendance
        .map((att) => att.userId?._id)
        .filter(Boolean)
    )
  );

  // Status color mapping
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
      default:
        break;
    }

    return baseClasses.join(' ');
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;

    const dateStr = date.toISOString().split('T')[0];
    
    // If filtering by user, show only that user's status
    if (selectedUserId) {
      const statusData = monthDataAll?.find(
        (item) => item.date === dateStr && item.userId === selectedUserId
      );
      if (statusData) {
        return getStatusClass(statusData.status, date);
      }
    } else {
      // Show aggregated status (most common status for that date)
      const dateStatuses = monthDataAll?.filter((item) => item.date === dateStr);
      if (dateStatuses && dateStatuses.length > 0) {
        // Count statuses
        const statusCounts = {};
        dateStatuses.forEach((item) => {
          statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
        });
        
        // Get most common status
        const mostCommonStatus = Object.keys(statusCounts).reduce((a, b) =>
          statusCounts[a] > statusCounts[b] ? a : b
        );
        
        return getStatusClass(mostCommonStatus, date);
      }
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
    if (view !== 'month') return null;

    const dateStr = date.toISOString().split('T')[0];
    const dateStatuses = monthDataAll?.filter((item) => item.date === dateStr);
    
    if (dateStatuses && dateStatuses.length > 0) {
      // Count statuses for this date
      const statusCounts = {};
      dateStatuses.forEach((item) => {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
      });
      
      const mostCommonStatus = Object.keys(statusCounts).reduce((a, b) =>
        statusCounts[a] > statusCounts[b] ? a : b
      );
      
      if (mostCommonStatus === 'leave-approved') {
        return <div className="calendar-badge leave-badge">L</div>;
      }
      if (mostCommonStatus === 'leave-pending') {
        return <div className="calendar-badge pending-badge">P</div>;
      }
      if (mostCommonStatus === 'late') {
        return <div className="calendar-badge late-badge">Late</div>;
      }
      if (mostCommonStatus === 'present') {
        return <div className="calendar-dot present-dot"></div>;
      }
      if (mostCommonStatus === 'half-day') {
        return <div className="calendar-badge halfday-badge">½</div>;
      }
      if (mostCommonStatus === 'absent') {
        return <div className="calendar-dot absent-dot"></div>;
      }
    }

    return null;
  };

  const getDateAttendance = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return allAttendance.filter(
      (att) => new Date(att.date).toISOString().split('T')[0] === dateStr
    );
  };

  const selectedDateAttendance = getDateAttendance(selectedDate);

  return (
    <div className="container">
      <h1>Team Calendar View</h1>

      <div className="calendar-layout">
        <div className="calendar-section">
          <div className="card">
            <div className="calendar-filters">
              <label htmlFor="userFilter">Filter by Employee:</label>
              <select
                id="userFilter"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="form-control"
              >
                <option value="">All Employees</option>
                {uniqueUsers.map((userId) => {
                  const user = allAttendance.find((att) => att.userId?._id === userId)?.userId;
                  return (
                    <option key={userId} value={userId}>
                      {user?.name || 'Unknown'} ({user?.employeeId || 'N/A'})
                    </option>
                  );
                })}
              </select>
            </div>
            <Calendar
              onChange={handleCalendarChange}
              value={calendarDate}
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
            </div>
          </div>
        </div>

        <div className="details-section">
          <div className="card">
            <h2>Attendance for {selectedDate.toLocaleDateString()}</h2>
            {selectedDateAttendance.length === 0 ? (
              <p>No attendance records for this date</p>
            ) : (
              <div className="attendance-list">
                <div className="summary-stats">
                  <div className="summary-item">
                    <span className="summary-label">Total:</span>
                    <span className="summary-value">{selectedDateAttendance.length}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Present:</span>
                    <span className="summary-value present">
                      {selectedDateAttendance.filter((a) => a.status === 'present' || a.status === 'late').length}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Absent:</span>
                    <span className="summary-value absent">
                      {selectedDateAttendance.filter((a) => a.status === 'absent').length}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Leave:</span>
                    <span className="summary-value leave">
                      {selectedDateAttendance.filter((a) => a.status === 'leave').length}
                    </span>
                  </div>
                </div>
                <table className="details-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>ID</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Check In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDateAttendance.map((record, idx) => (
                      <tr key={idx}>
                        <td>{record.userId?.name || 'N/A'}</td>
                        <td>{record.userId?.employeeId || 'N/A'}</td>
                        <td>{record.userId?.department || 'N/A'}</td>
                        <td>
                          <span className={`badge status-${record.status}`}>
                            {record.status === 'leave' ? 'Leave' : record.status}
                          </span>
                        </td>
                        <td>
                          {record.checkInTime
                            ? new Date(record.checkInTime).toLocaleTimeString()
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamCalendar;

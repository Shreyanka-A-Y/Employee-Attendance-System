import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllAttendance } from '../../store/slices/attendanceSlice';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './TeamCalendar.css';

const TeamCalendar = () => {
  const dispatch = useDispatch();
  const { allAttendance } = useSelector((state) => state.attendance);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('month');

  useEffect(() => {
    const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    dispatch(getAllAttendance({ startDate: startDate.toISOString(), endDate: endDate.toISOString() }));
  }, [dispatch, selectedDate]);

  const getDateAttendance = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return allAttendance.filter(
      (att) => new Date(att.date).toISOString().split('T')[0] === dateStr
    );
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dayAttendance = getDateAttendance(date);
      if (dayAttendance.length > 0) {
        const presentCount = dayAttendance.filter((a) => a.status === 'present' || a.status === 'late').length;
        const totalCount = dayAttendance.length;
        const ratio = presentCount / totalCount;
        if (ratio >= 0.8) return 'calendar-day high-attendance';
        if (ratio >= 0.5) return 'calendar-day medium-attendance';
        return 'calendar-day low-attendance';
      }
    }
    return null;
  };

  const selectedDateAttendance = getDateAttendance(selectedDate);

  return (
    <div className="container">
      <h1>Team Calendar View</h1>

      <div className="calendar-layout">
        <div className="calendar-section">
          <div className="card">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileClassName={tileClassName}
              className="team-calendar"
            />
            <div className="legend">
              <div className="legend-item">
                <span className="legend-color high-attendance"></span>
                <span>High Attendance (80%+)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color medium-attendance"></span>
                <span>Medium Attendance (50-79%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color low-attendance"></span>
                <span>Low Attendance (&lt;50%)</span>
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
                          <span className={`badge status-${record.status}`}>{record.status}</span>
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


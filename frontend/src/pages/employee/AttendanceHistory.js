import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMyHistory, getMySummary } from '../../store/slices/attendanceSlice';
import { getCalendarMonth } from '../../store/slices/calendarSlice';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './AttendanceHistory.css';

const AttendanceHistory = () => {
  const dispatch = useDispatch();
  const { history, summary, loading, error } = useSelector((state) => state.attendance);
  const { monthData } = useSelector((state) => state.calendar);
  const [view, setView] = useState('table');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const recordsPerPage = 10;

  useEffect(() => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    dispatch(getMyHistory(params));
  }, [dispatch, startDate, endDate]);

  useEffect(() => {
    dispatch(getMySummary({ month: selectedMonth, year: selectedYear }));
  }, [dispatch, selectedMonth, selectedYear]);

  // Fetch calendar data when view changes or month changes
  useEffect(() => {
    if (view === 'calendar') {
      const year = calendarDate.getFullYear();
      const month = calendarDate.getMonth() + 1;
      dispatch(getCalendarMonth({ year, month }));
    }
  }, [dispatch, view, calendarDate]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedMonth(new Date().getMonth() + 1);
    setSelectedYear(new Date().getFullYear());
    setCurrentPage(1);
  };

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
    const statusData = monthData?.find((item) => item.date === dateStr);
    
    if (statusData) {
      return getStatusClass(statusData.status, date);
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
    const statusData = monthData?.find((item) => item.date === dateStr);
    
    if (statusData) {
      const status = statusData.status;
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

  const handleCalendarChange = (date) => {
    setCalendarDate(date);
  };

  // Pagination logic
  const totalPages = history ? Math.ceil(history.length / recordsPerPage) : 0;
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedHistory = history ? history.slice(startIndex, endIndex) : [];

  if (loading) {
    return (
      <div className="attendance-history-page">
        <div className="attendance-history-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading attendance history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="attendance-history-page">
        <div className="attendance-history-container">
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <p>Error loading attendance: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-history-page">
      <div className="attendance-history-container">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">My Attendance History</h1>
            <p className="page-subtitle">Track and review your attendance records</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="view-toggle-container">
          <div className="view-toggle">
            <button
              onClick={() => setView('table')}
              className={`view-toggle-btn ${view === 'table' ? 'active' : ''}`}
              aria-label="Table View"
            >
              <span className="toggle-icon">📊</span>
              <span>Table View</span>
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`view-toggle-btn ${view === 'calendar' ? 'active' : ''}`}
              aria-label="Calendar View"
            >
              <span className="toggle-icon">📅</span>
              <span>Calendar View</span>
            </button>
          </div>
        </div>

        {/* Filters Card */}
        <div className="filters-card">
          <div className="filters-header">
            <h3 className="filters-title">
              <span className="filter-icon">🔍</span>
              Filters
            </h3>
            <button
              onClick={handleResetFilters}
              className="btn-reset-filters"
              aria-label="Reset Filters"
            >
              <span>🔄</span>
              Reset
            </button>
          </div>
          <div className="filters-grid">
            <div className="filter-field">
              <label htmlFor="startDate" className="filter-label">
                <span className="label-icon">📅</span>
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-input"
              />
            </div>
            <div className="filter-field">
              <label htmlFor="endDate" className="filter-label">
                <span className="label-icon">📅</span>
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-input"
              />
            </div>
            <div className="filter-field">
              <label htmlFor="month" className="filter-label">
                <span className="label-icon">📆</span>
                Month
              </label>
              <select
                id="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="filter-select"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label htmlFor="year" className="filter-label">
                <span className="label-icon">📅</span>
                Year
              </label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="filter-select"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table View */}
        {view === 'table' && (
          <div className="table-card">
            <div className="table-header">
              <h2 className="table-title">Attendance Records</h2>
              {history && history.length > 0 && (
                <span className="table-count">{history.length} record{history.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Total Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {!history || history.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        <div className="empty-state-content">
                          <span className="empty-icon">📋</span>
                          <p>No attendance records found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedHistory.map((record, idx) => (
                      <tr key={idx}>
                        <td className="date-cell">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td>
                          <span className={`status-badge status-${record.status}`}>
                            {record.status === 'leave' ? 'Leave' : record.status}
                          </span>
                        </td>
                        <td className="time-cell">
                          {record.checkInTime
                            ? new Date(record.checkInTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </td>
                        <td className="time-cell">
                          {record.checkOutTime
                            ? new Date(record.checkOutTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </td>
                        <td className="hours-cell">{record.totalHours ? `${record.totalHours.toFixed(2)} hrs` : '0 hrs'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {history && history.length > recordsPerPage && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                  aria-label="Previous Page"
                >
                  ← Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                  aria-label="Next Page"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Calendar View */}
        {view === 'calendar' && (
          <div className="calendar-card">
            <div className="calendar-header">
              <h2 className="calendar-title">Calendar View</h2>
            </div>
            <div className="calendar-wrapper">
              <Calendar
                onChange={handleCalendarChange}
                value={calendarDate}
                tileClassName={tileClassName}
                tileContent={tileContent}
                className="attendance-calendar"
                onActiveStartDateChange={({ activeStartDate }) => {
                  if (activeStartDate) {
                    setCalendarDate(activeStartDate);
                  }
                }}
              />
            </div>
            <div className="legend">
              <div className="legend-item">
                <span className="legend-color present"></span>
                <span className="legend-label">Present</span>
              </div>
              <div className="legend-item">
                <span className="legend-color absent"></span>
                <span className="legend-label">Absent</span>
              </div>
              <div className="legend-item">
                <span className="legend-color late"></span>
                <span className="legend-label">Late</span>
              </div>
              <div className="legend-item">
                <span className="legend-color half-day"></span>
                <span className="legend-label">Half Day</span>
              </div>
              <div className="legend-item">
                <span className="legend-color leave-approved"></span>
                <span className="legend-label">Leave (Approved)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color leave-pending"></span>
                <span className="legend-label">Leave (Pending)</span>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Summary Cards */}
        {summary && (
          <div className="summary-section">
            <h2 className="summary-section-title">
              Monthly Summary - {new Date(2000, summary.month - 1).toLocaleString('default', { month: 'long' })} {summary.year}
            </h2>
            <div className="summary-cards-grid">
              <div className="summary-card present">
                <div className="summary-card-icon">✅</div>
                <div className="summary-card-content">
                  <span className="summary-card-label">Present</span>
                  <span className="summary-card-value">{summary.summary.present}</span>
                </div>
              </div>
              <div className="summary-card absent">
                <div className="summary-card-icon">❌</div>
                <div className="summary-card-content">
                  <span className="summary-card-label">Absent</span>
                  <span className="summary-card-value">{summary.summary.absent}</span>
                </div>
              </div>
              <div className="summary-card late">
                <div className="summary-card-icon">⏰</div>
                <div className="summary-card-content">
                  <span className="summary-card-label">Late</span>
                  <span className="summary-card-value">{summary.summary.late}</span>
                </div>
              </div>
              <div className="summary-card halfday">
                <div className="summary-card-icon">⏱️</div>
                <div className="summary-card-content">
                  <span className="summary-card-label">Half Day</span>
                  <span className="summary-card-value">{summary.summary.halfDay}</span>
                </div>
              </div>
              <div className="summary-card hours">
                <div className="summary-card-icon">⏲️</div>
                <div className="summary-card-content">
                  <span className="summary-card-label">Total Hours</span>
                  <span className="summary-card-value">{summary.summary.totalHours.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceHistory;

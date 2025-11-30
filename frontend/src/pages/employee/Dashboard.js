import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getEmployeeDashboard } from '../../store/slices/dashboardSlice';
import { getTodayStatus } from '../../store/slices/attendanceSlice';
import { checkIn, checkOut } from '../../store/slices/attendanceSlice';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import './Dashboard.css';

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const { employeeData, loading: dashboardLoading, error: dashboardError } = useSelector((state) => state.dashboard);
  const { todayStatus, loading: attendanceLoading } = useSelector((state) => state.attendance);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getEmployeeDashboard());
    dispatch(getTodayStatus());
  }, [dispatch]);

  // Show loading only if we don't have any data yet
  if ((dashboardLoading || attendanceLoading) && !employeeData && !todayStatus) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div>
            <h3>Error loading dashboard</h3>
            <p>{dashboardError}</p>
            <small>Please check your connection and try again.</small>
          </div>
        </div>
      </div>
    );
  }

  const handleCheckIn = () => {
    dispatch(checkIn()).then(() => {
      dispatch(getTodayStatus());
      dispatch(getEmployeeDashboard());
    });
  };

  const handleCheckOut = () => {
    dispatch(checkOut()).then(() => {
      dispatch(getTodayStatus());
      dispatch(getEmployeeDashboard());
    });
  };

  const chartData = employeeData?.recentAttendance?.map((att) => ({
    date: new Date(att.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    hours: att.totalHours || 0,
  })) || [];

  // Gradient colors for chart bars
  const getGradientColor = (value, maxValue) => {
    const ratio = value / (maxValue || 1);
    if (ratio > 0.8) return '#3b82f6'; // Royal blue
    if (ratio > 0.5) return '#6366f1'; // Indigo
    return '#8b5cf6'; // Purple
  };

  const maxHours = Math.max(...chartData.map(d => d.hours), 1);

  // Icons as SVG components
  const ClockIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  );

  const CalendarIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );

  const CheckInIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );

  const CheckOutIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6"></path>
    </svg>
  );

  const StatsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  );

  const HoursIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1 className="dashboard-title">Welcome back, <span className="user-name">{user?.name}</span>!</h1>
          <p className="dashboard-subtitle">Here's your attendance overview</p>
        </div>
        <div className="header-date">
          <CalendarIcon />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Today's Status Card */}
      <div className="dashboard-card today-status-card">
        <div className="card-header">
          <div className="card-header-content">
            <div className="card-icon-wrapper status-icon">
              <ClockIcon />
            </div>
            <div>
              <h2 className="card-title">Today's Status</h2>
              <p className="card-subtitle">Your attendance for today</p>
            </div>
          </div>
        </div>
        <div className="status-content">
          <div className="status-info">
            <div className="status-item">
              <span className="status-label">Status</span>
              <span className={`status-value status-${todayStatus?.status || 'absent'}`}>
                {todayStatus?.status?.toUpperCase() || 'NOT CHECKED IN'}
              </span>
            </div>
            {todayStatus?.checkInTime && (
              <div className="status-item">
                <span className="status-label">Check In</span>
                <span className="status-value time-value">
                  {new Date(todayStatus.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
            {todayStatus?.checkOutTime && (
              <div className="status-item">
                <span className="status-label">Check Out</span>
                <span className="status-value time-value">
                  {new Date(todayStatus.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
            {todayStatus?.totalHours > 0 && (
              <div className="status-item">
                <span className="status-label">Total Hours</span>
                <span className="status-value hours-value">{todayStatus.totalHours} hrs</span>
              </div>
            )}
          </div>
          <div className="action-buttons">
            {!todayStatus?.checkInTime && (
              <button onClick={handleCheckIn} className="btn-modern btn-checkin-modern">
                <CheckInIcon />
                <span>Check In</span>
              </button>
            )}
            {todayStatus?.checkInTime && !todayStatus?.checkOutTime && (
              <button onClick={handleCheckOut} className="btn-modern btn-checkout-modern">
                <CheckOutIcon />
                <span>Check Out</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid-modern">
        <div className="dashboard-card stat-card-modern">
          <div className="card-header">
            <div className="card-header-content">
              <div className="card-icon-wrapper stats-icon-wrapper">
                <StatsIcon />
              </div>
              <h3 className="card-title-small">Monthly Stats</h3>
            </div>
          </div>
          <div className="stat-content-modern">
            <div className="stat-item-modern">
              <div className="stat-item-header">
                <span className="stat-label-modern">Present</span>
                <span className="stat-badge present-badge"></span>
              </div>
              <span className="stat-value-modern present-value">{employeeData?.monthlyStats?.present || 0}</span>
            </div>
            <div className="stat-item-modern">
              <div className="stat-item-header">
                <span className="stat-label-modern">Absent</span>
                <span className="stat-badge absent-badge"></span>
              </div>
              <span className="stat-value-modern absent-value">{employeeData?.monthlyStats?.absent || 0}</span>
            </div>
            <div className="stat-item-modern">
              <div className="stat-item-header">
                <span className="stat-label-modern">Late</span>
                <span className="stat-badge late-badge"></span>
              </div>
              <span className="stat-value-modern late-value">{employeeData?.monthlyStats?.late || 0}</span>
            </div>
            <div className="stat-item-modern">
              <div className="stat-item-header">
                <span className="stat-label-modern">Half Day</span>
                <span className="stat-badge halfday-badge"></span>
              </div>
              <span className="stat-value-modern halfday-value">{employeeData?.monthlyStats?.halfDay || 0}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card stat-card-modern hours-card">
          <div className="card-header">
            <div className="card-header-content">
              <div className="card-icon-wrapper hours-icon-wrapper">
                <HoursIcon />
              </div>
              <h3 className="card-title-small">Total Hours</h3>
            </div>
          </div>
          <div className="hours-content">
            <div className="hours-value-large">{employeeData?.totalHours || 0}</div>
            <div className="hours-label">Hours This Month</div>
          </div>
        </div>
      </div>

      {/* Recent Attendance Chart */}
      {chartData.length > 0 && (
        <div className="dashboard-card chart-card">
          <div className="card-header">
            <div className="card-header-content">
              <h2 className="card-title">Last 7 Days Attendance</h2>
              <p className="card-subtitle">Daily hours breakdown</p>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif' }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                />
                <Bar 
                  dataKey="hours" 
                  radius={[12, 12, 0, 0]}
                  fill="url(#barGradient)"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getGradientColor(entry.hours, maxHours)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Attendance Table */}
      <div className="dashboard-card table-card">
        <div className="card-header">
          <div className="card-header-content">
            <h2 className="card-title">Recent Attendance</h2>
            <p className="card-subtitle">Your latest attendance records</p>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="attendance-table-modern">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {employeeData?.recentAttendance && employeeData.recentAttendance.length > 0 ? (
                employeeData.recentAttendance.map((att, idx) => (
                  <tr key={idx} className="table-row-modern">
                    <td className="table-date">{new Date(att.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>
                      <span className={`badge-modern status-${att.status}`}>{att.status}</span>
                    </td>
                    <td className="table-time">{att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td className="table-time">{att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td className="table-hours">{att.totalHours || 0} hrs</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="table-empty">
                    <div className="empty-state">
                      <CalendarIcon />
                      <p>No recent attendance records</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;


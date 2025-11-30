import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getTeamSummary, exportAttendance, getDepartments } from '../../store/slices/attendanceSlice';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Reports.css';

const Reports = () => {
  const dispatch = useDispatch();
  const { teamSummary, departments } = useSelector((state) => state.attendance);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    department: '',
  });

  // Fetch departments on component mount
  useEffect(() => {
    dispatch(getDepartments());
  }, [dispatch]);

  // Fetch team summary when filters change
  useEffect(() => {
    const params = { ...filters };
    Object.keys(params).forEach((key) => {
      if (!params[key]) delete params[key];
    });
    dispatch(getTeamSummary(params));
  }, [dispatch, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleExport = () => {
    const params = { ...filters };
    Object.keys(params).forEach((key) => {
      if (!params[key]) delete params[key];
    });
    dispatch(exportAttendance(params));
  };

  const departmentData = teamSummary?.summary?.byDepartment
    ? Object.entries(teamSummary.summary.byDepartment).map(([name, stats]) => ({
        name,
        present: stats.present,
        absent: stats.absent,
        late: stats.late,
        halfDay: stats.halfDay,
      }))
    : [];

  return (
    <div className="container">
      <h1>Reports & Analytics</h1>

      {/* Filters */}
      <div className="card filters-card">
        <h2>Report Filters</h2>
        <div className="filters-grid">
          <div className="form-group">
            <label>Month</label>
            <select name="month" value={filters.month} onChange={handleFilterChange}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Year</label>
            <select name="year" value={filters.year} onChange={handleFilterChange}>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Department</label>
            <select name="department" value={filters.department} onChange={handleFilterChange}>
              <option value="">All Departments</option>
              {departments && departments.length > 0 ? (
                departments.map((dept, idx) => (
                  <option key={idx} value={dept}>
                    {dept}
                  </option>
                ))
              ) : (
                <option value="" disabled>Loading departments...</option>
              )}
            </select>
          </div>
        </div>
        <div className="filter-actions">
          <button onClick={handleExport} className="btn btn-success">
            Export CSV Report
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {teamSummary && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Employees</h3>
            <div className="stat-value">{teamSummary.summary.totalEmployees}</div>
          </div>
          <div className="stat-card">
            <h3>Total Present</h3>
            <div className="stat-value present">{teamSummary.summary.present}</div>
          </div>
          <div className="stat-card">
            <h3>Total Absent</h3>
            <div className="stat-value absent">{teamSummary.summary.absent}</div>
          </div>
          <div className="stat-card">
            <h3>Late Arrivals</h3>
            <div className="stat-value late">{teamSummary.summary.late}</div>
          </div>
          <div className="stat-card">
            <h3>Half Days</h3>
            <div className="stat-value halfday">{teamSummary.summary.halfDay}</div>
          </div>
          <div className="stat-card">
            <h3>Total Hours</h3>
            <div className="stat-value">{teamSummary.summary.totalHours.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Department Chart */}
      {departmentData.length > 0 && (
        <div className="card">
          <h2>Department-wise Attendance</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" fill="#10b981" name="Present" />
              <Bar dataKey="absent" fill="#ef4444" name="Absent" />
              <Bar dataKey="late" fill="#f59e0b" name="Late" />
              <Bar dataKey="halfDay" fill="#6366f1" name="Half Day" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Department Details Table */}
      {departmentData.length > 0 && (
        <div className="card">
          <h2>Department Details</h2>
          <table className="reports-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Late</th>
                <th>Half Day</th>
              </tr>
            </thead>
            <tbody>
              {departmentData.map((dept, idx) => (
                <tr key={idx}>
                  <td>{dept.name}</td>
                  <td className="present">{dept.present}</td>
                  <td className="absent">{dept.absent}</td>
                  <td className="late">{dept.late}</td>
                  <td className="halfday">{dept.halfDay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reports;


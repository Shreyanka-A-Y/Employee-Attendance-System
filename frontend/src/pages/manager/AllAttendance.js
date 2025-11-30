import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllAttendance, exportAttendance } from '../../store/slices/attendanceSlice';
import './AllAttendance.css';

const AllAttendance = () => {
  const dispatch = useDispatch();
  const { allAttendance, loading } = useSelector((state) => state.attendance);
  const [filters, setFilters] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    status: '',
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = { ...filters, page };
    Object.keys(params).forEach((key) => {
      if (!params[key]) delete params[key];
    });
    dispatch(getAllAttendance(params));
  }, [dispatch, filters, page]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const handleExport = () => {
    const params = { ...filters };
    Object.keys(params).forEach((key) => {
      if (!params[key]) delete params[key];
    });
    dispatch(exportAttendance(params));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'present';
      case 'absent':
        return 'absent';
      case 'late':
        return 'late';
      case 'half-day':
        return 'halfday';
      default:
        return '';
    }
  };

  return (
    <div className="container">
      <h1>All Employees Attendance</h1>

      {/* Filters */}
      <div className="card filters-card">
        <h2>Filters</h2>
        <div className="filters-grid">
          <div className="form-group">
            <label>Employee ID</label>
            <input
              type="text"
              name="employeeId"
              value={filters.employeeId}
              onChange={handleFilterChange}
              placeholder="Enter Employee ID"
            />
          </div>
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="half-day">Half Day</option>
            </select>
          </div>
        </div>
        <div className="filter-actions">
          <button onClick={handleExport} className="btn btn-success">
            Export CSV
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card">
        <h2>Attendance Records</h2>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee Name</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {allAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  allAttendance.map((record, idx) => (
                    <tr key={idx}>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      <td>{record.userId?.name || 'N/A'}</td>
                      <td>{record.userId?.employeeId || 'N/A'}</td>
                      <td>{record.userId?.department || 'N/A'}</td>
                      <td>
                        {record.checkInTime
                          ? new Date(record.checkInTime).toLocaleTimeString()
                          : '-'}
                      </td>
                      <td>
                        {record.checkOutTime
                          ? new Date(record.checkOutTime).toLocaleTimeString()
                          : '-'}
                      </td>
                      <td>
                        <span className={`badge status-${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td>{record.totalHours || 0} hrs</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="pagination">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <span>Page {page}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={allAttendance.length < 30}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AllAttendance;


import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getManagerDashboard } from '../../store/slices/dashboardSlice';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Dashboard.css';

const ManagerDashboard = () => {
  const dispatch = useDispatch();
  const { managerData, loading, error } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(getManagerDashboard());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error" style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '5px' }}>
          Error loading dashboard: {error}
        </div>
      </div>
    );
  }

  const weeklyData = managerData?.weeklyTrend || [];
  const departmentData = Object.entries(managerData?.departmentStats || {}).map(([name, stats]) => ({
    name,
    present: stats.present,
    absent: stats.absent,
  }));

  const pieData = [
    { name: 'Present', value: managerData?.todayStats?.present || 0 },
    { name: 'Absent', value: managerData?.todayStats?.absent || 0 },
    { name: 'Late', value: managerData?.todayStats?.late || 0 },
  ];

  const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

  return (
    <div className="container">
      <h1>Manager Dashboard</h1>

      {/* Today's Stats */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <h3>Total Employees</h3>
          <div className="stat-value large">{managerData?.totalEmployees || 0}</div>
        </div>
        <div className="stat-card success">
          <h3>Present Today</h3>
          <div className="stat-value large">{managerData?.todayStats?.present || 0}</div>
        </div>
        <div className="stat-card danger">
          <h3>Absent Today</h3>
          <div className="stat-value large">{managerData?.todayStats?.absent || 0}</div>
        </div>
        <div className="stat-card warning">
          <h3>Late Arrivals</h3>
          <div className="stat-value large">{managerData?.todayStats?.late || 0}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="card chart-card">
          <h2>Weekly Attendance Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="present" stroke="#10b981" name="Present" />
              <Line type="monotone" dataKey="absent" stroke="#ef4444" name="Absent" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h2>Today's Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Stats */}
      {departmentData.length > 0 && (
        <div className="card">
          <h2>Department-wise Attendance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" fill="#10b981" name="Present" />
              <Bar dataKey="absent" fill="#ef4444" name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Late Arrivals */}
      {managerData?.lateArrivals?.length > 0 && (
        <div className="card">
          <h2>Late Arrivals Today</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Check In Time</th>
              </tr>
            </thead>
            <tbody>
              {managerData.lateArrivals.map((emp, idx) => (
                <tr key={idx}>
                  <td>{emp.name}</td>
                  <td>{emp.employeeId}</td>
                  <td>{emp.department}</td>
                  <td>{new Date(emp.checkInTime).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Absent List */}
      {managerData?.absentList?.length > 0 && (
        <div className="card">
          <h2>Absent Employees Today</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {managerData.absentList.map((emp, idx) => (
                <tr key={idx}>
                  <td>{emp.name}</td>
                  <td>{emp.employeeId}</td>
                  <td>{emp.department}</td>
                  <td>{emp.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;


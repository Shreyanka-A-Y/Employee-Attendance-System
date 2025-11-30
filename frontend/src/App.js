import React, { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMe, logout } from './store/slices/authSlice';
import PrivateRoute from './components/PrivateRoute';

// Employee Pages
import EmployeeLogin from './pages/employee/Login';
import EmployeeRegister from './pages/employee/Register';
import EmployeeDashboard from './pages/employee/Dashboard';
import MarkAttendance from './pages/employee/MarkAttendance';
import AttendanceHistory from './pages/employee/AttendanceHistory';
import EmployeeProfile from './pages/employee/Profile';

// Manager Pages
import ManagerLogin from './pages/manager/Login';
import ManagerDashboard from './pages/manager/Dashboard';
import AllAttendance from './pages/manager/AllAttendance';
import TeamCalendar from './pages/manager/TeamCalendar';
import Reports from './pages/manager/Reports';

// Layout
import Layout from './components/Layout';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    // Only call getMe once on mount if we have a token
    // This prevents unnecessary API calls and reload loops
    if (token && !hasCheckedAuth.current && !isAuthenticated && !user) {
      hasCheckedAuth.current = true;
      dispatch(getMe()).catch(() => {
        // If getMe fails, ensure we're logged out
        dispatch(logout());
      });
    }
  }, [dispatch, isAuthenticated, user]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<EmployeeLogin />} />
      <Route path="/register" element={<EmployeeRegister />} />
      <Route path="/manager/login" element={<ManagerLogin />} />

      {/* Employee Routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route
          index
          element={
            user?.role === 'manager' ? (
              <Navigate to="/manager/dashboard" />
            ) : (
              <Navigate to="/employee/dashboard" />
            )
          }
        />
        <Route
          path="employee/dashboard"
          element={<EmployeeDashboard />}
        />
        <Route
          path="employee/attendance"
          element={<MarkAttendance />}
        />
        <Route
          path="employee/history"
          element={<AttendanceHistory />}
        />
        <Route
          path="employee/profile"
          element={<EmployeeProfile />}
        />
      </Route>

      {/* Manager Routes */}
      <Route
        path="/manager/dashboard"
        element={
          <PrivateRoute requiredRole="manager">
            <Layout>
              <ManagerDashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/manager/attendance"
        element={
          <PrivateRoute requiredRole="manager">
            <Layout>
              <AllAttendance />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/manager/calendar"
        element={
          <PrivateRoute requiredRole="manager">
            <Layout>
              <TeamCalendar />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/manager/reports"
        element={
          <PrivateRoute requiredRole="manager">
            <Layout>
              <Reports />
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;


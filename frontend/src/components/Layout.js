import React from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import './Layout.css';

const Layout = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate(user?.role === 'manager' ? '/manager/login' : '/login');
  };

  const isManager = user?.role === 'manager';

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            <Link to="/" className="logo">
              Attendance System
            </Link>
            <div className="nav-links">
              {isManager ? (
                <>
                  <Link
                    to="/manager/dashboard"
                    className={location.pathname === '/manager/dashboard' ? 'active' : ''}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/manager/attendance"
                    className={location.pathname === '/manager/attendance' ? 'active' : ''}
                  >
                    All Attendance
                  </Link>
                  <Link
                    to="/manager/calendar"
                    className={location.pathname === '/manager/calendar' ? 'active' : ''}
                  >
                    Calendar
                  </Link>
                  <Link
                    to="/manager/reports"
                    className={location.pathname === '/manager/reports' ? 'active' : ''}
                  >
                    Reports
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/employee/dashboard"
                    className={location.pathname === '/employee/dashboard' ? 'active' : ''}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/employee/attendance"
                    className={location.pathname === '/employee/attendance' ? 'active' : ''}
                  >
                    Mark Attendance
                  </Link>
                  <Link
                    to="/employee/history"
                    className={location.pathname === '/employee/history' ? 'active' : ''}
                  >
                    History
                  </Link>
                  <Link
                    to="/employee/profile"
                    className={location.pathname === '/employee/profile' ? 'active' : ''}
                  >
                    Profile
                  </Link>
                </>
              )}
              <div className="user-info">
                <span>{user?.name}</span>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="main-content">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default Layout;


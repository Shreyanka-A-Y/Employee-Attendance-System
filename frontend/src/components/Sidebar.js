import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import {
  LayoutDashboard,
  Calendar,
  History,
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ onMobileToggle, isMobileOpen: externalMobileOpen, onCollapsedChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isManager = user?.role === 'manager';

  // Stable toggle function using functional update
  const handleToggleCollapse = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if mobile view
    if (window.innerWidth <= 768) {
      const newMobileState = !isMobileOpen;
      setIsMobileOpen(newMobileState);
      if (onMobileToggle) {
        onMobileToggle(newMobileState);
      }
    } else {
      // Desktop: use stable functional update
      setIsCollapsed(prev => {
        const newState = !prev;
        localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
        return newState;
      });
    }
  }, [isMobileOpen, onMobileToggle]);

  // Handle keyboard events for toggle button
  const handleToggleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggleCollapse(e);
    }
  }, [handleToggleCollapse]);

  // Sync collapsed state to parent
  useEffect(() => {
    if (onCollapsedChange) {
      onCollapsedChange(isCollapsed);
    }
  }, [isCollapsed, onCollapsedChange]);

  // Sync mobile state from external prop
  useEffect(() => {
    if (externalMobileOpen !== undefined) {
      setIsMobileOpen(externalMobileOpen);
    }
  }, [externalMobileOpen]);

  // Save theme to localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = () => {
    dispatch(logout());
    navigate(isManager ? '/manager/login' : '/login');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleMobileToggle = useCallback(() => {
    const newState = !isMobileOpen;
    setIsMobileOpen(newState);
    if (onMobileToggle) {
      onMobileToggle(newState);
    }
  }, [isMobileOpen, onMobileToggle]);

  const menuItems = isManager
    ? [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/manager/dashboard' },
        { icon: Calendar, label: 'All Attendance', path: '/manager/attendance' },
        { icon: History, label: 'Calendar', path: '/manager/calendar' },
        { icon: Settings, label: 'Reports', path: '/manager/reports' },
      ]
    : [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/employee/dashboard' },
        { icon: Calendar, label: 'Mark Attendance', path: '/employee/attendance' },
        { icon: History, label: 'History', path: '/employee/history' },
        { icon: User, label: 'Profile', path: '/employee/profile' },
        { icon: Settings, label: 'Settings', path: '/employee/profile' },
      ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={handleMobileToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''} ${
          isMobileOpen ? 'sidebar-mobile-open' : ''
        }`}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">A</div>
            <span className={`logo-text ${isCollapsed ? 'logo-text-hidden' : ''}`}>
              Attendance
            </span>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={handleToggleCollapse}
            onKeyDown={handleToggleKeyDown}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isCollapsed}
            aria-pressed={!isCollapsed}
            tabIndex={0}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* User Info */}
        <div className={`sidebar-user ${isCollapsed ? 'sidebar-user-hidden' : ''}`}>
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-role">{isManager ? 'Manager' : 'Employee'}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <SidebarItem
                key={`${item.path}-${index}`}
                icon={Icon}
                label={item.label}
                path={item.path}
                active={active}
                collapsed={isCollapsed}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth <= 768) {
                    handleMobileToggle();
                  }
                }}
              />
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="sidebar-footer">
          <SidebarItem
            icon={HelpCircle}
            label="Help"
            path="#"
            active={false}
            collapsed={isCollapsed}
            onClick={() => {
              // Handle help action
            }}
          />
          <SidebarItem
            icon={LogOut}
            label="Log out"
            path="#"
            active={false}
            collapsed={isCollapsed}
            onClick={handleLogout}
          />

          {/* Theme Toggle */}
          <div className="theme-toggle-container">
            <button
              type="button"
              className={`theme-toggle ${theme === 'light' ? 'theme-light' : 'theme-dark'}`}
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              <div className="theme-toggle-inner">
                <Sun size={16} className="theme-icon sun-icon" />
                <Moon size={16} className="theme-icon moon-icon" />
              </div>
            </button>
            <span className={`theme-label ${isCollapsed ? 'theme-label-hidden' : ''}`}>
              {theme === 'light' ? 'Light' : 'Dark'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

const SidebarItem = ({ icon: Icon, label, path, active, collapsed, onClick }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      type="button"
      className={`sidebar-item ${active ? 'sidebar-item-active' : 'sidebar-item-inactive'} ${
        collapsed ? 'sidebar-item-collapsed' : ''
      }`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      tabIndex={0}
    >
      <div className="sidebar-item-icon-wrapper">
        <Icon size={20} className="sidebar-item-icon" aria-hidden="true" />
      </div>
      {!collapsed && (
        <span className="sidebar-item-label">
          {label}
        </span>
      )}
    </button>
  );
};

export default Sidebar;

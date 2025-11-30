import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  History,
  User,
  Settings,
  FileText,
} from 'lucide-react';
import './TopBar.css';

// Route to page name and icon mapping
const routeMap = {
  '/employee/dashboard': { name: 'Dashboard', icon: LayoutDashboard },
  '/employee/attendance': { name: 'Mark Attendance', icon: Calendar },
  '/employee/history': { name: 'History', icon: History },
  '/employee/leave': { name: 'Leave Application', icon: FileText },
  '/employee/profile': { name: 'Profile', icon: User },
  '/manager/dashboard': { name: 'Dashboard', icon: LayoutDashboard },
  '/manager/attendance': { name: 'All Attendance', icon: Calendar },
  '/manager/calendar': { name: 'Calendar', icon: History },
  '/manager/leaves': { name: 'Leave Requests', icon: FileText },
  '/manager/reports': { name: 'Reports', icon: FileText },
};

const TopBar = ({ isSidebarCollapsed, isMobile }) => {
  const location = useLocation();
  
  // Get current page info from route
  const currentPage = routeMap[location.pathname] || { 
    name: 'Dashboard', 
    icon: LayoutDashboard 
  };
  const PageIcon = currentPage.icon;

  // Calculate left margin based on sidebar state
  const leftMargin = isMobile ? '0' : (isSidebarCollapsed ? '4rem' : '16rem');

  return (
    <header
      className="topbar"
      style={{
        marginLeft: leftMargin,
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="topbar-content">
        {/* Left side: App Logo + Name */}
        <div className="topbar-left">
          <div className="topbar-logo">
            <div className="topbar-logo-icon">AD</div>
            <span className="topbar-app-name">AttenDo</span>
          </div>
        </div>

        {/* Right side: Current Page Name */}
        <div className="topbar-right">
          <div className="topbar-page-info">
            <PageIcon size={20} className="topbar-page-icon" />
            <span className="topbar-page-name">{currentPage.name}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;


import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Menu } from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile === false) {
        setIsMobileOpen(false);
      }
    };
    
    // Set initial state
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate sidebar width based on collapsed state
  // Expanded: 16rem (256px), Collapsed: 4rem (64px)
  const sidebarWidth = isSidebarCollapsed ? '4rem' : '16rem';

  return (
    <div className="layout">
      <Sidebar 
        onMobileToggle={(state) => setIsMobileOpen(state)}
        isMobileOpen={isMobileOpen}
        onCollapsedChange={setIsSidebarCollapsed}
      />
      
      {/* TopBar */}
      <TopBar 
        isSidebarCollapsed={isSidebarCollapsed}
        isMobile={isMobile}
      />
      
      {/* Mobile Menu Button */}
      <button
        type="button"
        className="mobile-menu-button"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        <Menu size={24} />
      </button>

      <main 
        className="main-content"
        style={{
          marginLeft: isMobile ? '0' : sidebarWidth,
          paddingTop: isMobile ? '80px' : '86px', // TopBar height (60px mobile, 70px desktop) + padding
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding-top 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default Layout;

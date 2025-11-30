import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  BarChart3,
  Users,
  FileText,
  Download,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Zap,
  Shield,
  Database,
  Code,
  Server,
  Lock,
} from 'lucide-react';
import './Landing.css';

const Landing = () => {
  const [activeView, setActiveView] = useState('employee');

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <Calendar className="logo-icon" />
            <span>AttendDo</span>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-btn">Register</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-headline">
              Track Time Smartly.<br />
              Lead Teams Better.
            </h1>
            <p className="hero-subtext">
              Simple attendance tracking for employees and managers — check in, analyze, and export with ease.
            </p>
            <div className="hero-cta">
              <Link to="/login" className="cta-btn primary">
                Employee Access
                <ArrowRight className="btn-icon" />
              </Link>
              <Link to="/manager/login" className="cta-btn secondary">
                Manager Login
                <ArrowRight className="btn-icon" />
              </Link>
            </div>
          </div>
          <div className="hero-visuals">
            <div className="floating-card card-1">
              <div className="card-header">
                <div className="card-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div className="card-content">
                <div className="mock-chart">
                  <div className="chart-bar" style={{ height: '60%' }}></div>
                  <div className="chart-bar" style={{ height: '80%' }}></div>
                  <div className="chart-bar" style={{ height: '45%' }}></div>
                  <div className="chart-bar" style={{ height: '90%' }}></div>
                  <div className="chart-bar" style={{ height: '70%' }}></div>
                </div>
              </div>
            </div>
            <div className="floating-card card-2">
              <div className="card-header">
                <Calendar className="card-icon" />
                <span>Today's Status</span>
              </div>
              <div className="card-content">
                <div className="status-item">
                  <CheckCircle className="status-icon" />
                  <span>Checked In</span>
                </div>
                <div className="time-display">09:15 AM</div>
              </div>
            </div>
            <div className="floating-card card-3">
              <div className="card-header">
                <BarChart3 className="card-icon" />
                <span>Weekly Trends</span>
              </div>
              <div className="card-content">
                <div className="trend-line"></div>
                <div className="trend-stats">
                  <span>+12%</span>
                  <span>vs last week</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Powerful Features for Everyone</h2>
          <div className="features-grid">
            <div className="feature-column">
              <div className="feature-header">
                <Users className="feature-icon" />
                <h3>For Employees</h3>
              </div>
              <ul className="feature-list">
                <li>
                  <CheckCircle className="list-icon" />
                  <span>Quick Check In/Out</span>
                </li>
                <li>
                  <CheckCircle className="list-icon" />
                  <span>Calendar History View</span>
                </li>
                <li>
                  <CheckCircle className="list-icon" />
                  <span>Monthly Summary</span>
                </li>
                <li>
                  <CheckCircle className="list-icon" />
                  <span>Hours Tracking</span>
                </li>
                <li>
                  <CheckCircle className="list-icon" />
                  <span>Profile Management</span>
                </li>
              </ul>
            </div>
            <div className="feature-column">
              <div className="feature-header">
                <Shield className="feature-icon" />
                <h3>For Managers</h3>
              </div>
              <ul className="feature-list">
                <li>
                  <CheckCircle className="list-icon" />
                  <span>Team Dashboard</span>
                </li>
                <li>
                  <CheckCircle className="list-icon" />
                  <span>Advanced Filters</span>
                </li>
                <li>
                  <CheckCircle className="list-icon" />
                  <span>Department Analytics</span>
                </li>
                <li>
                  <CheckCircle className="list-icon" />
                  <span>CSV Export</span>
                </li>
                <li>
                  <CheckCircle className="list-icon" />
                  <span>Detailed Reports</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="dashboard-section">
        <div className="container">
          <h2 className="section-title">See It In Action</h2>
          <div className="view-toggle">
            <button
              className={`toggle-btn ${activeView === 'employee' ? 'active' : ''}`}
              onClick={() => setActiveView('employee')}
            >
              Employee View
            </button>
            <button
              className={`toggle-btn ${activeView === 'manager' ? 'active' : ''}`}
              onClick={() => setActiveView('manager')}
            >
              Manager View
            </button>
          </div>
          <div className="dashboard-preview">
            {activeView === 'employee' ? (
              <div className="dashboard-grid">
                <div className="preview-card">
                  <div className="preview-header">
                    <Clock className="preview-icon" />
                    <span>Today's Status</span>
                  </div>
                  <div className="preview-content">
                    <div className="preview-stat">Checked In</div>
                    <div className="preview-time">09:15 AM</div>
                  </div>
                </div>
                <div className="preview-card">
                  <div className="preview-header">
                    <Calendar className="preview-icon" />
                    <span>This Month</span>
                  </div>
                  <div className="preview-content">
                    <div className="preview-stat">22 Days</div>
                    <div className="preview-sub">Present</div>
                  </div>
                </div>
                <div className="preview-card large">
                  <div className="preview-header">
                    <BarChart3 className="preview-icon" />
                    <span>Weekly Trends</span>
                  </div>
                  <div className="preview-content">
                    <div className="mock-chart-large">
                      {[60, 80, 45, 90, 70, 85, 75].map((height, i) => (
                        <div key={i} className="chart-bar-large" style={{ height: `${height}%` }}></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="dashboard-grid">
                <div className="preview-card large">
                  <div className="preview-header">
                    <Users className="preview-icon" />
                    <span>Team Overview</span>
                  </div>
                  <div className="preview-content">
                    <div className="team-stats">
                      <div className="stat-item">
                        <span className="stat-value">45</span>
                        <span className="stat-label">Total Employees</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">42</span>
                        <span className="stat-label">Present Today</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="preview-card">
                  <div className="preview-header">
                    <TrendingUp className="preview-icon" />
                    <span>Department Stats</span>
                  </div>
                  <div className="preview-content">
                    <div className="dept-list">
                      <div className="dept-item">
                        <span>Engineering</span>
                        <span>95%</span>
                      </div>
                      <div className="dept-item">
                        <span>Sales</span>
                        <span>88%</span>
                      </div>
                      <div className="dept-item">
                        <span>HR</span>
                        <span>92%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="preview-card">
                  <div className="preview-header">
                    <FileText className="preview-icon" />
                    <span>Export Options</span>
                  </div>
                  <div className="preview-content">
                    <div className="export-options">
                      <Download className="export-icon" />
                      <span>CSV Export</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="tech-stack">
        <div className="container">
          <h2 className="section-title">Built With Modern Technology</h2>
          <div className="tech-badges">
            <div className="tech-badge">
              <Code className="tech-icon" />
              <span>React</span>
            </div>
            <div className="tech-badge">
              <Zap className="tech-icon" />
              <span>Redux</span>
            </div>
            <div className="tech-badge">
              <Server className="tech-icon" />
              <span>Node.js</span>
            </div>
            <div className="tech-badge">
              <Server className="tech-icon" />
              <span>Express</span>
            </div>
            <div className="tech-badge">
              <Database className="tech-icon" />
              <span>MongoDB</span>
            </div>
            <div className="tech-badge">
              <Lock className="tech-icon" />
              <span>JWT</span>
            </div>
            <div className="tech-badge">
              <BarChart3 className="tech-icon" />
              <span>Charts</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="footer-cta">
        <div className="container">
          <div className="cta-block">
            <h2>Ready to modernize your attendance tracking?</h2>
            <p>Join thousands of teams already using AttendDo</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <p>&copy; 2024 AttendDo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;


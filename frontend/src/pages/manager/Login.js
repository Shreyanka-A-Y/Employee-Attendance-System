import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../store/slices/authSlice';
import '../employee/Auth.css';

const ManagerLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);
  const hasNavigated = useRef(false);

  // Set up mount tracking
  useEffect(() => {
    // Component mounted
    return () => {
      // Component unmounting - reset navigation flag
      hasNavigated.current = false;
    };
  }, []);

  // Only check for navigation when auth state changes to authenticated
  useEffect(() => {
    // Only navigate if user is authenticated as manager and we haven't navigated yet
    if (isAuthenticated && user?.role === 'manager' && !hasNavigated.current) {
      hasNavigated.current = true;
      navigate('/manager/dashboard', { replace: true });
    }
  }, [isAuthenticated, user?.role, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(login(formData));
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Manager Login</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="auth-link">
          Employee? <Link to="/login">Login as Employee</Link>
        </p>
      </div>
    </div>
  );
};

export default ManagerLogin;


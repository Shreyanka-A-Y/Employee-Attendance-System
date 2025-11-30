import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getMe } from '../../store/slices/authSlice';
import api from '../../utils/api';
import './Profile.css';

const EmployeeProfile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        department: user.department || '',
      });
      if (user.profileImage) {
        setPreviewImage(`http://localhost:5000${user.profileImage}`);
      } else {
        setPreviewImage(null);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.put('/users/profile', formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      // Update user in Redux store
      dispatch(getMe());
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match('image.*')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
        return;
      }
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    const file = fileInputRef.current?.files[0];
    if (!file) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      console.log('Uploading image:', file.name, file.size, file.type);
      console.log('FormData entries:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? `File(${pair[1].name})` : pair[1]));
      }

      // Don't set Content-Type header - let axios/browser set it automatically for FormData
      const response = await api.post('/users/profile/upload-image', formData);
      console.log('Upload response:', response.data);

      setMessage({ type: 'success', text: 'Profile image uploaded successfully!' });
      // Update user in Redux store
      dispatch(getMe());
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload image';
      setMessage({
        type: 'error',
        text: errorMessage,
      });
      // Reset preview to current user image on error
      if (user?.profileImage) {
        setPreviewImage(`http://localhost:5000${user.profileImage}`);
      } else {
        setPreviewImage(null);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!window.confirm('Are you sure you want to delete your profile image?')) {
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.delete('/users/profile/delete-image');
      setMessage({ type: 'success', text: 'Profile image deleted successfully!' });
      setPreviewImage(null);
      // Update user in Redux store
      dispatch(getMe());
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to delete image',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Page Header */}
        <div className="profile-page-header">
          <h1 className="profile-title">My Profile</h1>
          <p className="profile-subtitle">Manage your account information and preferences</p>
        </div>

        {/* Main Profile Card */}
        <div className="profile-main-card">
          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div className="avatar-wrapper">
              <div 
                className="profile-avatar" 
                style={{ 
                  backgroundImage: previewImage ? `url(${previewImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {!previewImage && (
                  <div className="avatar-initial">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="avatar-overlay">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="avatar-file-input"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="avatar-upload-btn"
                    disabled={uploading}
                    title="Change profile picture"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                  </button>
                </div>
              </div>
              {previewImage && fileInputRef.current?.files[0] && (
                <div className="avatar-preview-actions">
                  <button
                    type="button"
                    onClick={handleImageUpload}
                    className="btn-icon btn-icon-success"
                    disabled={uploading}
                    title="Save image"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {uploading ? 'Uploading...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImage(user?.profileImage ? `http://localhost:5000${user.profileImage}` : null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="btn-icon btn-icon-secondary"
                    disabled={uploading}
                    title="Cancel"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Cancel
                  </button>
                </div>
              )}
              {user?.profileImage && !fileInputRef.current?.files[0] && (
                <button
                  type="button"
                  onClick={handleDeleteImage}
                  className="avatar-delete-btn"
                  disabled={uploading}
                  title="Delete image"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              )}
            </div>
            <div className="profile-name-section">
              <h2 className="profile-name">{user?.name || 'User'}</h2>
              <span className="role-badge-modern">{user?.role?.toUpperCase() || 'EMPLOYEE'}</span>
            </div>
          </div>

          {/* Alert Messages */}
          {message.text && (
            <div className={`alert alert-${message.type}`}>
              <div className="alert-content">
                {message.type === 'success' ? (
                  <svg className="alert-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg className="alert-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                )}
                <span>{message.text}</span>
              </div>
            </div>
          )}

          {/* Profile Information Cards */}
          <div className="profile-info-grid">
            <div className="info-card">
              <div className="info-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div className="info-card-content">
                <div className="info-card-label">Email Address</div>
                <div className="info-card-value">{user?.email || 'N/A'}</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
              </div>
              <div className="info-card-content">
                <div className="info-card-label">Employee ID</div>
                <div className="info-card-value">{user?.employeeId || 'Not assigned'}</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div className="info-card-content">
                <div className="info-card-label">Department</div>
                <div className="info-card-value">{user?.department || 'Not assigned'}</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div className="info-card-content">
                <div className="info-card-label">Member Since</div>
                <div className="info-card-value">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Section */}
          <div className="profile-edit-section">
            <div className="section-header">
              <h3 className="section-title">Edit Profile Information</h3>
              <p className="section-description">Update your personal information below</p>
            </div>
            <form className="profile-edit-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">
                    <svg className="form-label-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">
                    <svg className="form-label-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your department"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-primary-modern" 
                  disabled={loading || uploading}
                >
                  {loading ? (
                    <>
                      <svg className="btn-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;


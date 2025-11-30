import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { applyLeave, getMyLeaveRequests, clearError } from '../../store/slices/leaveSlice';
import './LeaveApplication.css';

const LeaveApplication = () => {
  const dispatch = useDispatch();
  const { myLeaves, loading, error } = useSelector((state) => state.leave);
  const [formData, setFormData] = useState({
    leaveType: '',
    reason: '',
    startDate: '',
    endDate: '',
    document: null,
  });
  const [localError, setLocalError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    dispatch(getMyLeaveRequests());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setLocalError(error);
      setTimeout(() => {
        setLocalError(null);
        dispatch(clearError());
      }, 5000);
    }
  }, [error, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setLocalError(null);
    setSuccess(false);
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, document: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setSuccess(false);

    // Validation
    if (!formData.leaveType) {
      setLocalError('Please select a leave type');
      return;
    }
    if (!formData.reason.trim()) {
      setLocalError('Please provide a reason for leave');
      return;
    }
    if (!formData.startDate) {
      setLocalError('Please select a start date');
      return;
    }
    if (!formData.endDate) {
      setLocalError('Please select an end date');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      setLocalError('Start date cannot be in the past');
      return;
    }

    if (end < start) {
      setLocalError('End date must be after start date');
      return;
    }

    try {
      // Prepare leave data (don't send File object directly)
      const leaveData = {
        leaveType: formData.leaveType,
        reason: formData.reason,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };

      // If document is a File, we would need to upload it first
      // For now, we'll skip document upload or handle it separately
      // TODO: Implement document upload endpoint if needed
      
      const result = await dispatch(applyLeave(leaveData));

      if (applyLeave.fulfilled.match(result)) {
        setSuccess(true);
        setFormData({
          leaveType: '',
          reason: '',
          startDate: '',
          endDate: '',
          document: null,
        });
        // Reset file input
        const fileInput = document.getElementById('document');
        if (fileInput) fileInput.value = '';
        
        // Refresh leave requests
        dispatch(getMyLeaveRequests());
        
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      } else {
        setLocalError(result.payload || 'Failed to submit leave application');
      }
    } catch (err) {
      setLocalError('An unexpected error occurred. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b'; // Yellow
      case 'approved':
        return '#10b981'; // Green
      case 'rejected':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end dates
  };

  return (
    <div className="container">
      <div className="leave-application-header">
        <h1>Leave Application</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Hide Form' : 'Apply for Leave'}
        </button>
      </div>

      {showForm && (
        <div className="leave-form-card">
          <h2>Apply for Leave</h2>
          
          {(localError || error) && (
            <div className="error-message">
              {localError || error}
            </div>
          )}

          {success && (
            <div className="success-message">
              Leave application submitted successfully! Your request is pending approval.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="leaveType">Leave Type *</label>
              <select
                id="leaveType"
                name="leaveType"
                value={formData.leaveType}
                onChange={handleChange}
                required
                className="form-control"
              >
                <option value="">Select Leave Type</option>
                <option value="sick leave">Sick Leave</option>
                <option value="casual leave">Casual Leave</option>
                <option value="emergency leave">Emergency Leave</option>
                <option value="annual leave">Annual Leave</option>
                <option value="maternity leave">Maternity Leave</option>
                <option value="paternity leave">Paternity Leave</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="reason">Reason for Leave *</label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows="4"
                required
                className="form-control"
                placeholder="Please provide a detailed reason for your leave request..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">Start Date *</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">End Date *</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  required
                  className="form-control"
                />
              </div>
            </div>

            {formData.startDate && formData.endDate && (
              <div className="days-info">
                Total Days: <strong>{calculateDays(formData.startDate, formData.endDate)}</strong>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="document">Upload Document (Optional)</label>
              <input
                type="file"
                id="document"
                name="document"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="form-control"
              />
              <small className="form-text">Supported formats: PDF, JPG, PNG (Max 5MB)</small>
            </div>

            <button
              type="submit"
              className="btn btn-success btn-submit"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Leave Application'}
            </button>
          </form>
        </div>
      )}

      <div className="leave-requests-section">
        <h2>My Leave Requests</h2>
        
        {myLeaves.length === 0 ? (
          <div className="no-requests">
            <p>You haven't submitted any leave requests yet.</p>
          </div>
        ) : (
          <div className="leave-requests-list">
            {myLeaves.map((leave) => (
              <div key={leave._id} className="leave-request-card">
                <div className="leave-request-header">
                  <div className="leave-type-badge">
                    {leave.leaveType}
                  </div>
                  <div
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(leave.status) }}
                  >
                    {leave.status.toUpperCase()}
                  </div>
                </div>

                <div className="leave-request-body">
                  <div className="leave-details">
                    <div className="detail-item">
                      <strong>Start Date:</strong> {formatDate(leave.startDate)}
                    </div>
                    <div className="detail-item">
                      <strong>End Date:</strong> {formatDate(leave.endDate)}
                    </div>
                    <div className="detail-item">
                      <strong>Duration:</strong> {calculateDays(leave.startDate, leave.endDate)} day(s)
                    </div>
                    <div className="detail-item">
                      <strong>Reason:</strong> {leave.reason}
                    </div>
                    {leave.managerComment && (
                      <div className="detail-item">
                        <strong>Manager Comment:</strong> {leave.managerComment}
                      </div>
                    )}
                    <div className="detail-item">
                      <strong>Applied On:</strong> {formatDate(leave.createdAt)}
                    </div>
                    {leave.approvedAt && (
                      <div className="detail-item">
                        <strong>
                          {leave.status === 'approved' ? 'Approved' : 'Rejected'} On:
                        </strong> {formatDate(leave.approvedAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveApplication;


import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getPendingLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  getLeaveStats,
  clearError,
} from '../../store/slices/leaveSlice';
import './LeaveRequests.css';

const LeaveRequests = () => {
  const dispatch = useDispatch();
  const { pendingLeaves, allLeaves, stats, loading, error } = useSelector((state) => state.leave);
  const [activeTab, setActiveTab] = useState('pending');
  const [filters, setFilters] = useState({
    status: '',
    employeeId: '',
    startDate: '',
    endDate: '',
  });
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionComment, setActionComment] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'

  useEffect(() => {
    dispatch(getPendingLeaves());
    dispatch(getAllLeaves());
    dispatch(getLeaveStats());
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === 'all') {
      dispatch(getAllLeaves(filters));
    }
  }, [activeTab, filters, dispatch]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleApprove = (leave) => {
    setSelectedLeave(leave);
    setActionType('approve');
    setActionComment('');
    setShowModal(true);
  };

  const handleReject = (leave) => {
    setSelectedLeave(leave);
    setActionType('reject');
    setActionComment('');
    setShowModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedLeave) return;

    try {
      if (actionType === 'approve') {
        await dispatch(approveLeave({
          leaveId: selectedLeave._id,
          comment: actionComment,
        }));
      } else {
        await dispatch(rejectLeave({
          leaveId: selectedLeave._id,
          comment: actionComment,
        }));
      }

      // Refresh data
      dispatch(getPendingLeaves());
      dispatch(getAllLeaves(filters));
      dispatch(getLeaveStats());

      setShowModal(false);
      setSelectedLeave(null);
      setActionComment('');
    } catch (err) {
      console.error('Action error:', err);
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
    return diffDays + 1;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const leavesToShow = activeTab === 'pending' ? pendingLeaves : allLeaves;

  return (
    <div className="container">
      <h1>Leave Requests</h1>

      {stats && (
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Requests</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card approved">
            <div className="stat-value">{stats.approved}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card rejected">
            <div className="stat-value">{stats.rejected}</div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({pendingLeaves.length})
        </button>
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Requests
        </button>
      </div>

      {activeTab === 'all' && (
        <div className="filters-section">
          <h3>Filters</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="form-control"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Employee ID</label>
              <input
                type="text"
                name="employeeId"
                value={filters.employeeId}
                onChange={handleFilterChange}
                placeholder="Enter Employee ID"
                className="form-control"
              />
            </div>
            <div className="filter-group">
              <label>Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="form-control"
              />
            </div>
            <div className="filter-group">
              <label>End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="form-control"
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : leavesToShow.length === 0 ? (
        <div className="no-requests">
          <p>No leave requests found.</p>
        </div>
      ) : (
        <div className="leave-requests-list">
          {leavesToShow.map((leave) => (
            <div key={leave._id} className="leave-request-card">
              <div className="leave-request-header">
                <div className="employee-info">
                  <h3>{leave.userId?.name || 'Unknown Employee'}</h3>
                  <p className="employee-details">
                    {leave.userId?.email && `${leave.userId.email} • `}
                    {leave.userId?.employeeId && `ID: ${leave.userId.employeeId}`}
                    {leave.userId?.department && ` • ${leave.userId.department}`}
                  </p>
                </div>
                <div
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(leave.status) }}
                >
                  {leave.status.toUpperCase()}
                </div>
              </div>

              <div className="leave-request-body">
                <div className="leave-details-grid">
                  <div className="detail-item">
                    <strong>Leave Type:</strong>
                    <span className="capitalize">{leave.leaveType}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Start Date:</strong>
                    {formatDate(leave.startDate)}
                  </div>
                  <div className="detail-item">
                    <strong>End Date:</strong>
                    {formatDate(leave.endDate)}
                  </div>
                  <div className="detail-item">
                    <strong>Duration:</strong>
                    {calculateDays(leave.startDate, leave.endDate)} day(s)
                  </div>
                  <div className="detail-item full-width">
                    <strong>Reason:</strong>
                    <p>{leave.reason}</p>
                  </div>
                  {leave.managerComment && (
                    <div className="detail-item full-width">
                      <strong>Manager Comment:</strong>
                      <p>{leave.managerComment}</p>
                    </div>
                  )}
                  <div className="detail-item">
                    <strong>Applied On:</strong>
                    {formatDate(leave.createdAt)}
                  </div>
                  {leave.approvedAt && (
                    <div className="detail-item">
                      <strong>
                        {leave.status === 'approved' ? 'Approved' : 'Rejected'} On:
                      </strong>
                      {formatDate(leave.approvedAt)}
                    </div>
                  )}
                  {leave.approvedBy && (
                    <div className="detail-item">
                      <strong>
                        {leave.status === 'approved' ? 'Approved' : 'Rejected'} By:
                      </strong>
                      {leave.approvedBy?.name || 'Manager'}
                    </div>
                  )}
                </div>

                {leave.status === 'pending' && (
                  <div className="leave-actions">
                    <button
                      className="btn btn-success"
                      onClick={() => handleApprove(leave)}
                      disabled={loading}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleReject(leave)}
                      disabled={loading}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedLeave && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Leave Request
            </h2>
            <div className="modal-body">
              <p>
                <strong>Employee:</strong> {selectedLeave.userId?.name || 'Unknown'}
              </p>
              <p>
                <strong>Leave Type:</strong> {selectedLeave.leaveType}
              </p>
              <p>
                <strong>Duration:</strong> {calculateDays(selectedLeave.startDate, selectedLeave.endDate)} day(s)
              </p>
              <div className="form-group">
                <label htmlFor="comment">Comment (Optional)</label>
                <textarea
                  id="comment"
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  rows="3"
                  className="form-control"
                  placeholder="Add a comment..."
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setSelectedLeave(null);
                  setActionComment('');
                }}
              >
                Cancel
              </button>
              <button
                className={`btn ${actionType === 'approve' ? 'btn-success' : 'btn-danger'}`}
                onClick={handleConfirmAction}
                disabled={loading}
              >
                {loading ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequests;


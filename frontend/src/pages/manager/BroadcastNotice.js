import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { broadcastNotice } from '../../store/slices/notificationSlice';
import { Send, AlertCircle } from 'lucide-react';
import './BroadcastNotice.css';

const BroadcastNotice = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.notifications);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetGroup: 'all',
  });
  const [success, setSuccess] = useState(false);

  const targetGroups = [
    { value: 'all', label: 'All Employees' },
    { value: 'dev', label: 'Development Team' },
    { value: 'test', label: 'Testing Team' },
    { value: 'support', label: 'Support Team' },
    { value: 'design', label: 'Design Team' },
    { value: 'management', label: 'Management' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);

    if (!formData.message.trim()) {
      return;
    }

    try {
      const result = await dispatch(
        broadcastNotice({
          message: formData.message,
          targetGroup: formData.targetGroup,
          title: formData.title || 'Team Notice',
        })
      );

      if (broadcastNotice.fulfilled.match(result)) {
        setSuccess(true);
        setFormData({
          title: '',
          message: '',
          targetGroup: 'all',
        });
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Broadcast error:', err);
    }
  };

  return (
    <div className="container">
      <h1>Send Team Notice</h1>

      <div className="broadcast-notice-card">
        <div className="broadcast-header">
          <h2>Broadcast Message</h2>
          <p className="broadcast-description">
            Send a notice to all employees or a specific team. The message will appear as a notification in their notification panel.
          </p>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="success-message">
            <Send size={18} />
            <span>Notice broadcasted successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="broadcast-form">
          <div className="form-group">
            <label htmlFor="title">Notice Title (Optional)</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Important Meeting"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="targetGroup">Send To</label>
            <select
              id="targetGroup"
              name="targetGroup"
              value={formData.targetGroup}
              onChange={handleChange}
              className="form-control"
            >
              {targetGroups.map((group) => (
                <option key={group.value} value={group.value}>
                  {group.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="message">
              Message <span className="required">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="e.g., Meeting at 3PM today in Conference Room A"
              className="form-control"
              rows="6"
              required
            />
            <div className="char-count">
              {formData.message.length} characters
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-broadcast"
              disabled={loading || !formData.message.trim()}
            >
              {loading ? (
                <>Sending...</>
              ) : (
                <>
                  <Send size={18} />
                  Send Notice
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BroadcastNotice;


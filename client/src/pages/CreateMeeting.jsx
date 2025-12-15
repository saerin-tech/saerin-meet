import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './CreateMeeting.css';

const CreateMeeting = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledTime: '',
    duration: 60,
    muteOnEntry: false,
    allowScreenShare: true,
    allowChat: true
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const meetingData = {
        title: formData.title,
        description: formData.description,
        scheduledTime: formData.scheduledTime || undefined,
        duration: parseInt(formData.duration),
        settings: {
          muteOnEntry: formData.muteOnEntry,
          allowScreenShare: formData.allowScreenShare,
          allowChat: formData.allowChat
        }
      };

      const response = await api.post('/meetings', meetingData);
      toast.success('Meeting created successfully!');
      
      // Ask if user wants to join immediately
      const join = window.confirm('Meeting created! Do you want to join now?');
      if (join) {
        navigate(`/meeting/${response.data.meeting.roomName}`);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container create-meeting">
      <div className="create-meeting-card">
        <h2>Create New Meeting</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Meeting Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter meeting title"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter meeting description (optional)"
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Scheduled Time (optional)</label>
              <input
                type="datetime-local"
                name="scheduledTime"
                value={formData.scheduledTime}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="15"
                step="15"
              />
            </div>
          </div>

          <div className="settings-section">
            <h3>Meeting Settings</h3>
            
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="muteOnEntry"
                name="muteOnEntry"
                checked={formData.muteOnEntry}
                onChange={handleChange}
              />
              <label htmlFor="muteOnEntry">Mute participants on entry</label>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="allowScreenShare"
                name="allowScreenShare"
                checked={formData.allowScreenShare}
                onChange={handleChange}
              />
              <label htmlFor="allowScreenShare">Allow screen sharing</label>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="allowChat"
                name="allowChat"
                checked={formData.allowChat}
                onChange={handleChange}
              />
              <label htmlFor="allowChat">Allow chat</label>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMeeting;

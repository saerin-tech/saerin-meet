import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMeetings();
  }, [filter]);

  const fetchMeetings = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/meetings', { params });
      setMeetings(response.data.meetings);
    } catch (error) {
      toast.error('Failed to fetch meetings');
    } finally {
      setLoading(false);
    }
  };

  const deleteMeeting = async (id) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) {
      return;
    }

    try {
      await api.delete(`/meetings/${id}`);
      toast.success('Meeting deleted successfully');
      fetchMeetings();
    } catch (error) {
      toast.error('Failed to delete meeting');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      scheduled: 'badge-info',
      active: 'badge-success',
      ended: 'badge-secondary',
      cancelled: 'badge-danger'
    };
    return `badge ${statusColors[status] || 'badge-secondary'}`;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container dashboard">
      <div className="dashboard-header">
        <h1>My Meetings</h1>
        <div className="header-actions">
          <Link to="/join-meeting" className="btn btn-outline">
            Join Meeting
          </Link>
          <Link to="/create-meeting" className="btn btn-primary">
            Create New Meeting
          </Link>
        </div>
      </div>

      <div className="filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === 'scheduled' ? 'active' : ''}`}
          onClick={() => setFilter('scheduled')}
        >
          Scheduled
        </button>
        <button
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button
          className={`filter-btn ${filter === 'ended' ? 'active' : ''}`}
          onClick={() => setFilter('ended')}
        >
          Ended
        </button>
      </div>

      {meetings.length === 0 ? (
        <div className="empty-state">
          <p>No meetings found. Create your first meeting!</p>
        </div>
      ) : (
        <div className="meetings-grid">
          {meetings.map((meeting) => (
            <div key={meeting._id} className="meeting-card">
              <div className="meeting-header">
                <h3>{meeting.title}</h3>
                <span className={getStatusBadge(meeting.status)}>
                  {meeting.status}
                </span>
              </div>
              
              {meeting.description && (
                <p className="meeting-description">{meeting.description}</p>
              )}
              
              <div className="meeting-info">
                <p>
                  <strong>Host:</strong> {meeting.hostId?.name}
                </p>
                {meeting.scheduledTime && (
                  <p>
                    <strong>Scheduled:</strong>{' '}
                    {format(new Date(meeting.scheduledTime), 'PPp')}
                  </p>
                )}
                <p>
                  <strong>Participants:</strong> {meeting.participants?.length || 0}
                </p>
                <p>
                  <strong>Room:</strong> {meeting.roomName}
                </p>
              </div>

              <div className="meeting-actions">
                {meeting.status !== 'ended' && meeting.status !== 'cancelled' && (
                  <Link
                    to={`/meeting/${meeting.roomName}`}
                    className="btn btn-primary"
                  >
                    Join Meeting
                  </Link>
                )}
                <Link
                  to={`/recordings?meetingId=${meeting._id}`}
                  className="btn btn-secondary"
                >
                  Recordings
                </Link>
                <button
                  onClick={() => deleteMeeting(meeting._id)}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;

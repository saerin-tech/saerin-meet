import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './JoinMeeting.css';

const JoinMeeting = () => {
  const [meetingLink, setMeetingLink] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const extractRoomName = (link) => {
    try {
      // Handle full URLs like http://localhost:5173/meeting/room-name
      if (link.includes('/meeting/')) {
        const parts = link.split('/meeting/');
        return parts[1].split(/[?#]/)[0]; // Remove query params and hash
      }
      // Handle just room name
      return link.trim();
    } catch (error) {
      return null;
    }
  };

  const handleJoinMeeting = (e) => {
    e.preventDefault();
    
    if (!meetingLink.trim()) {
      toast.error('Please enter a meeting link or room name');
      return;
    }

    const roomName = extractRoomName(meetingLink);
    
    if (!roomName) {
      toast.error('Invalid meeting link');
      return;
    }

    setLoading(true);
    // Navigate to the meeting room
    navigate(`/meeting/${roomName}`);
  };

  return (
    <div className="join-meeting-container">
      <div className="join-meeting-card">
        <h1>Join a Meeting</h1>
        <p className="subtitle">Enter a meeting link or room name to join</p>
        
        <form onSubmit={handleJoinMeeting}>
          <div className="form-group">
            <label htmlFor="meetingLink">Meeting Link or Room Name</label>
            <input
              type="text"
              id="meetingLink"
              className="form-control"
              placeholder="e.g., http://localhost:5173/meeting/room-abc or room-abc"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join Meeting'}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button 
          onClick={() => navigate('/create-meeting')}
          className="btn btn-outline btn-block"
        >
          Create New Meeting
        </button>
      </div>
    </div>
  );
};

export default JoinMeeting;

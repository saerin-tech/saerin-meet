import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './MeetingRoom.css';

const MeetingRoom = () => {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [token, setToken] = useState('');
  const [liveKitUrl, setLiveKitUrl] = useState('');
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingId, setRecordingId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    joinMeeting();
  }, [roomName]);

  const joinMeeting = async () => {
    try {
      // First, get meeting details
      const meetingResponse = await api.get(`/meetings/room/${roomName}`);
      const meetingData = meetingResponse.data.meeting;
      console.log({meetingData, user});
      setMeeting(meetingData);

      // Then get the token to join
      const tokenResponse = await api.post(`/meetings/${meetingData._id}/join`);
      setToken(tokenResponse.data.token);
      setLiveKitUrl(tokenResponse.data.liveKitUrl);
      setIsRecording(meetingData.isRecording);
    } catch (error) {
      toast.error('Failed to join meeting');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      const response = await api.post('/recordings/start', {
        meetingId: meeting._id,
        roomName: meeting.roomName
      });
      setIsRecording(true);
      setRecordingId(response.data.recording.id);
      toast.success('Recording started');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    try {
      const response = await api.post('/recordings/stop', {
        recordingId: recordingId
      });
      setIsRecording(false);
      
      // Check if recording failed due to no tracks
      if (response.data.recording?.status === 'failed') {
        toast.error(response.data.error || 'Recording failed');
      } else {
        toast.success('Recording stopped and processing');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to stop recording';
      toast.error(errorMsg);
    }
  };

  const handleDisconnect = async () => {
    try {
      // Update meeting status if host is leaving
      if (meeting && user && meeting.hostId._id === user._id) {
        await api.put(`/meetings/${meeting._id}`, {
          status: 'ended'
        });
        toast.info('Meeting ended. Active recordings have been stopped.');
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Error ending meeting:', error);
      navigate('/dashboard');
    }
  };

  const copyMeetingLink = () => {
    const meetingLink = `${window.location.origin}/meeting/${roomName}`;
    navigator.clipboard.writeText(meetingLink);
    toast.success('Meeting link copied to clipboard!');
  };

  const shareMeetingLink = () => {
    setShowShareModal(true);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!token || !liveKitUrl) {
    return (
      <div className="container">
        <div className="error-message">
          <h2>Unable to join meeting</h2>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-room">
      <div className="meeting-header-bar">
        <div className="meeting-info-bar">
          <h3>{meeting?.title}</h3>
          {isRecording && (
            <span className="recording-indicator">
              <span className="recording-dot"></span>
              Recording
            </span>
          )}
        </div>
        <div className="meeting-controls">
          <button
            onClick={copyMeetingLink}
            className="btn btn-primary"
            title="Copy meeting link"
          >
            📋 Copy Link
          </button>
          {meeting && user && meeting.hostId._id == user._id && (
            <>
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  className="btn btn-danger"
                  title="Make sure at least one participant has their camera or microphone enabled"
                >
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="btn btn-secondary"
                >
                  Stop Recording
                </button>
              )}
            </>
          )}
          <button onClick={handleDisconnect} className="btn btn-danger">
            {meeting && user && meeting.hostId._id === user._id ? 'End Meeting' : 'Leave Meeting'}
          </button>
        </div>
      </div>

      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Share Meeting Link</h3>
            <div className="share-link-container">
              <input
                type="text"
                value={`${window.location.origin}/meeting/${roomName}`}
                readOnly
                className="share-link-input"
              />
              <button onClick={copyMeetingLink} className="btn btn-primary">
                Copy
              </button>
            </div>
            <p className="share-instructions">
              Share this link with others to invite them to the meeting.
            </p>
            <button onClick={() => setShowShareModal(false)} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      )}

      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={liveKitUrl}
        data-lk-theme="default"
        style={{ height: 'calc(100vh - 140px)' }}
        onDisconnected={handleDisconnect}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
};

export default MeetingRoom;

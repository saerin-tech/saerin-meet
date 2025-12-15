import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './Recordings.css';

const Recordings = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [pollingIntervals, setPollingIntervals] = useState({});

  useEffect(() => {
    fetchRecordings();
    
    // Cleanup polling intervals on unmount
    return () => {
      Object.values(pollingIntervals).forEach(interval => clearInterval(interval));
    };
  }, [searchParams]);

  useEffect(() => {
    // Start polling for processing recordings
    recordings.forEach(recording => {
      if (recording.status === 'processing' && !pollingIntervals[recording._id]) {
        startPolling(recording._id);
      }
    });
  }, [recordings]);

  const startPolling = (recordingId) => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/recordings/${recordingId}/status`);
        const { status, fileSize, fileUrl } = response.data;
        
        // Update the recording in the list
        setRecordings(prev => prev.map(rec => 
          rec._id === recordingId 
            ? { ...rec, status, fileSize, fileUrl }
            : rec
        ));

        // Stop polling if completed or failed
        if (status === 'completed' || status === 'failed') {
          clearInterval(interval);
          setPollingIntervals(prev => {
            const newIntervals = { ...prev };
            delete newIntervals[recordingId];
            return newIntervals;
          });
          
          if (status === 'completed') {
            toast.success('Recording is ready!');
          } else if (status === 'failed') {
            toast.error('Recording processing failed');
          }
        }
      } catch (error) {
        console.error('Error polling recording status:', error);
      }
    }, 5000); // Poll every 5 seconds

    setPollingIntervals(prev => ({ ...prev, [recordingId]: interval }));
  };

  const fetchRecordings = async () => {
    try {
      const meetingId = searchParams.get('meetingId');
      const endpoint = meetingId
        ? `/recordings/meeting/${meetingId}`
        : '/recordings';
      
      const response = await api.get(endpoint);
      setRecordings(response.data.recordings || []);
    } catch (error) {
      toast.error('Failed to fetch recordings');
    } finally {
      setLoading(false);
    }
  };

  const deleteRecording = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recording?')) {
      return;
    }

    try {
      await api.delete(`/recordings/${id}`);
      toast.success('Recording deleted successfully');
      fetchRecordings();
    } catch (error) {
      toast.error('Failed to delete recording');
    }
  };

  const downloadRecording = async (id) => {
    try {
      // Call the download endpoint with auth token in header
      const token = localStorage.getItem('token');
      window.location.href = `${import.meta.env.VITE_API_URL}/recordings/download/${id}?token=${token}`;
    } catch (error) {
      console.error('Error downloading recording:', error);
      toast.error('Failed to download recording');
    }
  };

  const watchRecording = async (id) => {
    try {
      // Get the presigned URL from the API
      const response = await api.get(`/recordings/watch/${id}`);
      const { url } = response.data;
      
      // Open in new tab
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error watching recording:', error);
      toast.error(error.response?.data?.message || 'Failed to load recording');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'badge-info',
      recording: 'badge-danger',
      processing: 'badge-warning',
      completed: 'badge-success',
      failed: 'badge-secondary'
    };
    return `badge ${statusColors[status] || 'badge-secondary'}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container recordings">
      <h1>Recordings</h1>

      {recordings.length === 0 ? (
        <div className="empty-state">
          <p>No recordings found.</p>
        </div>
      ) : (
        <div className="recordings-list">
          {recordings.map((recording) => (
            <div key={recording._id} className="recording-card">
              <div className="recording-header">
                <div>
                  <h3>{recording.title}</h3>
                  <p className="recording-date">
                    {format(new Date(recording.startedAt), 'PPp')}
                  </p>
                </div>
                <span className={getStatusBadge(recording.status)}>
                  {recording.status}
                  {recording.status === 'processing' && (
                    <span className="processing-spinner"> ⟳</span>
                  )}
                </span>
              </div>

              {recording.status === 'processing' && (
                <div className="processing-message">
                  <p>⏳ Processing recording... This may take a few moments.</p>
                </div>
              )}

              {recording.status === 'failed' && recording.error && (
                <div className="error-message">
                  <p>❌ {recording.error}</p>
                </div>
              )}

              <div className="recording-info">
                {recording.meetingId?.roomName && (
                  <p>
                    <strong>Room:</strong> {recording.meetingId.roomName}
                  </p>
                )}
                {recording.createdBy && (
                  <p>
                    <strong>Created by:</strong> {recording.createdBy.name}
                  </p>
                )}
                {recording.duration > 0 && (
                  <p>
                    <strong>Duration:</strong> {formatDuration(recording.duration)}
                  </p>
                )}
                {recording.fileSize > 0 && (
                  <p>
                    <strong>File Size:</strong> {formatFileSize(recording.fileSize)}
                  </p>
                )}
                {recording.completedAt && (
                  <p>
                    <strong>Completed:</strong>{' '}
                    {format(new Date(recording.completedAt), 'PPp')}
                  </p>
                )}
              </div>

              <div className="recording-actions">
                {recording.status === 'completed' && recording.fileUrl && (
                  <button
                    onClick={() => downloadRecording(recording._id)}
                    className="btn btn-primary"
                  >
                    Download
                  </button>
                )}
                {recording.status === 'completed' && recording.fileUrl && (
                  <button
                    onClick={() => watchRecording(recording._id)}
                    className="btn btn-secondary"
                  >
                    Watch
                  </button>
                )}
                <button
                  onClick={() => deleteRecording(recording._id)}
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

export default Recordings;

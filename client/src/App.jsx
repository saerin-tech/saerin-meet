import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '@livekit/components-styles';

import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateMeeting from './pages/CreateMeeting';
import JoinMeeting from './pages/JoinMeeting';
import MeetingRoom from './pages/MeetingRoom';
import Recordings from './pages/Recordings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-meeting"
              element={
                <PrivateRoute>
                  <CreateMeeting />
                </PrivateRoute>
              }
            />
            <Route
              path="/join-meeting"
              element={
                <PrivateRoute>
                  <JoinMeeting />
                </PrivateRoute>
              }
            />
            <Route
              path="/meeting/:roomName"
              element={
                <PrivateRoute>
                  <MeetingRoom />
                </PrivateRoute>
              }
            />
            <Route
              path="/recordings"
              element={
                <PrivateRoute>
                  <Recordings />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

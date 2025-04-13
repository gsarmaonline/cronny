import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider as CustomThemeProvider } from './contexts/ThemeContext';

// Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './components/Dashboard';
import Profile from './components/profile/Profile';

// Schedule Components
import ScheduleList from './components/schedules/ScheduleList';
import ScheduleDetail from './components/schedules/ScheduleDetail';
import ScheduleForm from './components/schedules/ScheduleForm';

// Action Components
import ActionJobManager from './components/actions/ActionJobManager';
import ActionDetail from './components/actions/ActionDetail';
import JobFormPage from './components/actions/JobFormPage';
import ActionForm from './components/actions/ActionForm';

function App() {
  return (
    <CustomThemeProvider>
      <AppContent />
    </CustomThemeProvider>
  );
}

const AppContent = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="schedules" element={<ScheduleList />} />
            <Route path="schedules/new" element={<ScheduleForm />} />
            <Route path="schedules/:id/edit" element={<ScheduleForm />} />
            <Route path="schedules/:id" element={<ScheduleDetail />} />
            <Route path="actions" element={<ActionJobManager />} />
            <Route path="actions/new" element={<ActionForm />} />
            <Route path="actions/:id/edit" element={<ActionForm />} />
            <Route path="actions/:id" element={<ActionDetail />} />
            <Route path="actions/:actionId/jobs/new" element={<JobFormPage />} />
            <Route path="actions/:actionId/jobs/:jobId/edit" element={<JobFormPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;

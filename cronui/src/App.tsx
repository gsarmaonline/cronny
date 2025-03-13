import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';

// Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './components/Dashboard';

// Schedule Components
import ScheduleList from './components/schedules/ScheduleList';
import ScheduleDetail from './components/schedules/ScheduleDetail';
import ScheduleForm from './components/schedules/ScheduleForm';

// Job Components
import JobList from './components/jobs/JobList';
import JobDetail from './components/jobs/JobDetail';
import JobForm from './components/jobs/JobForm';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Schedule Routes */}
                <Route path="/schedules" element={<ScheduleList />} />
                <Route path="/schedules/create" element={<ScheduleForm />} />
                <Route path="/schedules/edit/:id" element={<ScheduleForm />} />
                <Route path="/schedules/:id" element={<ScheduleDetail />} />
                
                {/* Job Routes */}
                <Route path="/jobs" element={<JobList />} />
                <Route path="/jobs/create" element={<JobForm />} />
                <Route path="/jobs/edit/:id" element={<JobForm />} />
                <Route path="/jobs/:id" element={<JobDetail />} />
              </Route>
            </Route>
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

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

// Create a theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffa726', // Vibrant orange
      light: '#ffd95b',
      dark: '#c77800',
    },
    secondary: {
      main: '#ff9800', // Deep orange
      light: '#ffc947',
      dark: '#c66900',
    },
    background: {
      default: '#0a0a0a', // Very dark orange-tinted black
      paper: '#121212', // Slightly lighter orange-tinted black
    },
    text: {
      primary: '#ffa726', // Vibrant orange
      secondary: '#ff9800', // Deep orange
    },
  },
  typography: {
    fontFamily: '"IBM Plex Mono", monospace',
    h1: {
      fontWeight: 600,
      letterSpacing: '0.5px',
      textShadow: '0 0 8px rgba(255, 167, 38, 0.5)',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '0.5px',
      textShadow: '0 0 8px rgba(255, 167, 38, 0.5)',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '0.5px',
      textShadow: '0 0 8px rgba(255, 167, 38, 0.5)',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '0.5px',
      textShadow: '0 0 8px rgba(255, 167, 38, 0.5)',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '0.5px',
      textShadow: '0 0 8px rgba(255, 167, 38, 0.5)',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '0.5px',
      textShadow: '0 0 8px rgba(255, 167, 38, 0.5)',
    },
    body1: {
      letterSpacing: '0.5px',
      textShadow: '0 0 4px rgba(255, 167, 38, 0.3)',
    },
    body2: {
      letterSpacing: '0.5px',
      textShadow: '0 0 4px rgba(255, 167, 38, 0.3)',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#121212',
          boxShadow: '0 0 20px rgba(255, 167, 38, 0.1)',
          border: '1px solid rgba(255, 167, 38, 0.1)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 0 30px rgba(255, 167, 38, 0.15)',
            border: '1px solid rgba(255, 167, 38, 0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#121212',
          boxShadow: '0 0 20px rgba(255, 167, 38, 0.1)',
          border: '1px solid rgba(255, 167, 38, 0.1)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 0 30px rgba(255, 167, 38, 0.15)',
            border: '1px solid rgba(255, 167, 38, 0.2)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#121212',
          boxShadow: '0 0 20px rgba(255, 167, 38, 0.1)',
          borderBottom: '1px solid rgba(255, 167, 38, 0.1)',
          '& .MuiTypography-root': {
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: 300,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontSize: '1.5rem',
            textShadow: '0 0 8px rgba(255, 167, 38, 0.3)',
            '&.MuiTypography-body2': {
              fontSize: '0.875rem',
              textTransform: 'none',
              letterSpacing: 'normal',
              textShadow: 'none',
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: '#121212',
          boxShadow: '0 0 20px rgba(255, 167, 38, 0.1)',
          borderRight: '1px solid rgba(255, 167, 38, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          letterSpacing: '0.5px',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 0 15px rgba(255, 167, 38, 0.3)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            fontFamily: '"IBM Plex Mono", monospace',
            letterSpacing: '0.5px',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: '0 0 15px rgba(255, 167, 38, 0.1)',
            },
            '&.Mui-focused': {
              boxShadow: '0 0 20px rgba(255, 167, 38, 0.2)',
            },
          },
        },
      },
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
    </ThemeProvider>
  );
}

export default App;

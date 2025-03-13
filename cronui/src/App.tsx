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

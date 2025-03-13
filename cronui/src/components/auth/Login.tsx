import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  useTheme,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import TypewriterText from '../common/TypewriterText';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ username, password });
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #121212 100%)',
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          py: 8,
          textAlign: 'center',
          background: 'rgba(255, 167, 38, 0.05)',
          borderBottom: '1px solid rgba(255, 167, 38, 0.1)',
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: 300,
            letterSpacing: '2px',
            color: '#ffa726',
            textShadow: '0 0 8px rgba(255, 167, 38, 0.3)',
            mb: 2,
          }}
        >
          CRONNY
        </Typography>
        <TypewriterText
          text="A modern cron job management system for complex workflows"
          speed={40}
          delay={500}
          prefix="$ "
        />
      </Box>

      <Container maxWidth="lg" sx={{ flex: 1, py: 8 }}>
        <Grid container spacing={6} alignItems="center">
          {/* Features Section */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  color: '#ffa726',
                  mb: 3,
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: 300,
                }}
              >
                Powerful Scheduling
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#ffa726', mb: 2 }}
              >
                • Absolute Date Scheduling
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#ffa726', mb: 2 }}
              >
                • Recurring Intervals
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#ffa726', mb: 2 }}
              >
                • Relative Time Triggers
              </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  color: '#ffa726',
                  mb: 3,
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: 300,
                }}
              >
                Flexible Actions
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#ffa726', mb: 2 }}
              >
                • HTTP Requests
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#ffa726', mb: 2 }}
              >
                • Slack Notifications
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#ffa726', mb: 2 }}
              >
                • Docker Containers
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="h4"
                sx={{
                  color: '#ffa726',
                  mb: 3,
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: 300,
                }}
              >
                Built for Scale
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#ffa726', mb: 2 }}
              >
                • Efficient Trigger Management
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#ffa726', mb: 2 }}
              >
                • Resource-Aware Execution
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#ffa726', mb: 2 }}
              >
                • Infrastructure Optimization
              </Typography>
            </Box>
          </Grid>

          {/* Login Form */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                background: 'rgba(18, 18, 18, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 167, 38, 0.1)',
                boxShadow: '0 0 20px rgba(255, 167, 38, 0.1)',
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  color: '#ffa726',
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: 300,
                }}
              >
                Welcome Back
              </Typography>
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  margin="normal"
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                  sx={{ mb: 3 }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    py: 1.5,
                    background: '#ffa726',
                    '&:hover': {
                      background: '#ff9800',
                    },
                  }}
                >
                  Sign In
                </Button>
              </form>
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Link
                  href="/register"
                  sx={{
                    color: '#ffa726',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Don't have an account? Sign up
                </Link>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Login;
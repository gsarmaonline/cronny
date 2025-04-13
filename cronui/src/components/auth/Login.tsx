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
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Check as CheckIcon,
  Star as StarIcon,
  Bolt as BoltIcon,
  Business as BusinessIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import TypewriterText from '../common/TypewriterText';

const plans = [
  {
    name: 'Starter',
    icon: <StarIcon sx={{ fontSize: 40 }} />,
    price: '$0',
    description: 'Perfect for small projects',
    features: [
      'Up to 10 jobs',
      'Basic scheduling',
      'Email notifications',
      'Community support',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    icon: <BoltIcon sx={{ fontSize: 40 }} />,
    price: '$29',
    description: 'For growing teams',
    features: [
      'Unlimited jobs',
      'Advanced scheduling',
      'Slack notifications',
      'Priority support',
      'Custom webhooks',
      'API access',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    icon: <BusinessIcon sx={{ fontSize: 40 }} />,
    price: 'Custom',
    description: 'For large organizations',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantees',
      'Advanced security',
      'Team management',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useTheme();
  const isDark = mode === 'dark';
  
  // Theme based colors
  const primaryColor = isDark ? '#ffa726' : '#ff9800';
  const bgColor = isDark ? '#0a0a0a' : '#f5f5f5';
  const headerBg = isDark ? '#0c0c0c' : '#f8f8f8';
  const headerBorder = isDark 
    ? '1px solid rgba(255, 167, 38, 0.1)' 
    : '1px solid rgba(255, 152, 0, 0.1)';
  const formBg = isDark ? '#121212' : '#ffffff';
  const formBorder = isDark 
    ? '1px solid rgba(255, 167, 38, 0.1)' 
    : '1px solid rgba(255, 152, 0, 0.1)';
  const formShadow = isDark 
    ? '0 0 20px rgba(255, 167, 38, 0.1)' 
    : '0 0 20px rgba(0, 0, 0, 0.1)';
  const highlightedCardBg = isDark ? '#161616' : '#fffaf0';
  const regularCardBg = isDark ? '#121212' : '#ffffff';
  const inputFocusShadow = isDark
    ? '0 0 0 2px rgba(255, 167, 38, 0.2)'
    : '0 0 0 2px rgba(255, 152, 0, 0.2)';

  // Custom styles to completely override focus styles
  const customTextFieldStyle = {
    mb: 2,
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: primaryColor,
        boxShadow: inputFocusShadow,
      },
      '&.Mui-focused': {
        outline: 'none',
        backgroundColor: 'transparent !important',
      },
      '&:focus': {
        outline: 'none',
        backgroundColor: 'transparent !important',
      },
      '& input': {
        '&:focus': {
          backgroundColor: 'transparent !important',
          outline: 'none',
        }
      }
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: primaryColor,
    },
    '& .MuiInputBase-input:focus': {
      outline: 'none',
      backgroundColor: 'transparent !important',
    },
    // Global overrides
    '& *:focus': {
      backgroundColor: 'transparent !important',
      outline: 'none',
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    try {
      await login({ username, password });
      navigate('/');
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.response?.data?.error || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: bgColor,
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          py: 8,
          textAlign: 'center',
          background: headerBg,
          borderBottom: headerBorder,
          position: 'relative',
        }}
      >
        {/* Theme toggle button */}
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <Tooltip title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
            <IconButton
              onClick={toggleTheme}
              sx={{
                color: primaryColor,
                border: `1px solid ${primaryColor}`,
                '&:hover': {
                  backgroundColor: isDark 
                    ? 'rgba(255, 167, 38, 0.1)' 
                    : 'rgba(255, 152, 0, 0.1)',
                },
              }}
              aria-label="toggle theme"
            >
              {isDark ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Box>
        
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: 300,
            letterSpacing: '2px',
            color: primaryColor,
            textShadow: isDark ? '0 0 8px rgba(255, 167, 38, 0.3)' : 'none',
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
                  color: primaryColor,
                  mb: 3,
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: 300,
                }}
              >
                Powerful Scheduling
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: primaryColor, mb: 2 }}
              >
                • Absolute Date Scheduling
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: primaryColor, mb: 2 }}
              >
                • Recurring Intervals
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: primaryColor, mb: 2 }}
              >
                • Relative Time Triggers
              </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  color: primaryColor,
                  mb: 3,
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: 300,
                }}
              >
                Flexible Actions
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: primaryColor, mb: 2 }}
              >
                • HTTP Requests
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: primaryColor, mb: 2 }}
              >
                • Slack Notifications
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: primaryColor, mb: 2 }}
              >
                • Docker Containers
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="h4"
                sx={{
                  color: primaryColor,
                  mb: 3,
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: 300,
                }}
              >
                Built for Scale
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: primaryColor, mb: 2 }}
              >
                • Efficient Trigger Management
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: primaryColor, mb: 2 }}
              >
                • Resource-Aware Execution
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: primaryColor, mb: 2 }}
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
                background: formBg,
                border: formBorder,
                boxShadow: formShadow,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  color: primaryColor,
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: 300,
                }}
              >
                Login to Your Account
              </Typography>

              {error && (
                <Typography
                  variant="body2"
                  sx={{
                    mb: 2,
                    color: 'error.main',
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                    padding: 2,
                    borderRadius: 1,
                  }}
                >
                  {error}
                </Typography>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  margin="normal"
                  required
                  sx={customTextFieldStyle}
                  InputProps={{
                    classes: {
                      focused: 'custom-focused'
                    },
                    sx: {
                      '&.Mui-focused': {
                        backgroundColor: 'transparent !important',
                      },
                      '&.custom-focused': {
                        backgroundColor: 'transparent !important',
                      },
                      '&:focus': {
                        backgroundColor: 'transparent !important',
                      },
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                  sx={{
                    ...customTextFieldStyle, 
                    mb: 3
                  }}
                  InputProps={{
                    classes: {
                      focused: 'custom-focused'
                    },
                    sx: {
                      '&.Mui-focused': {
                        backgroundColor: 'transparent !important',
                      },
                      '&.custom-focused': {
                        backgroundColor: 'transparent !important',
                      },
                      '&:focus': {
                        backgroundColor: 'transparent !important',
                      },
                    }
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    py: 1.5,
                    background: primaryColor,
                    '&:hover': {
                      background: isDark ? '#ff9800' : '#f57c00',
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
                    color: primaryColor,
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

        {/* Plans Section */}
        <Box sx={{ mt: 12, mb: 8 }}>
          <Typography
            variant="h4"
            align="center"
            sx={{
              color: primaryColor,
              mb: 6,
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 300,
            }}
          >
            Choose Your Plan
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            {plans.map((plan) => (
              <Grid item xs={12} md={4} key={plan.name}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: plan.highlighted
                      ? highlightedCardBg
                      : regularCardBg,
                    border: plan.highlighted
                      ? (isDark ? '2px solid #ffa726' : '2px solid #ff9800')
                      : (isDark ? '1px solid rgba(255, 167, 38, 0.1)' : '1px solid rgba(255, 152, 0, 0.1)'),
                    boxShadow: plan.highlighted
                      ? (isDark ? '0 0 30px rgba(255, 167, 38, 0.2)' : '0 0 30px rgba(0, 0, 0, 0.15)')
                      : (isDark ? '0 0 20px rgba(255, 167, 38, 0.1)' : '0 0 20px rgba(0, 0, 0, 0.1)'),
                    '&:hover': {
                      boxShadow: isDark 
                        ? '0 0 40px rgba(255, 167, 38, 0.3)'
                        : '0 0 40px rgba(0, 0, 0, 0.2)',
                    },
                  }}
                >
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {React.cloneElement(plan.icon, { 
                          sx: { ...plan.icon.props.sx, color: primaryColor } 
                        })}
                        <Typography
                          variant="h5"
                          sx={{
                            color: primaryColor,
                            fontFamily: '"Montserrat", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {plan.name}
                        </Typography>
                      </Box>
                    }
                    subheader={
                      <Typography
                        variant="h4"
                        sx={{
                          color: primaryColor,
                          mt: 2,
                        }}
                      >
                        {plan.price}
                      </Typography>
                    }
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="body1"
                      sx={{ color: primaryColor, mb: 3 }}
                    >
                      {plan.description}
                    </Typography>
                    <List>
                      {plan.features.map((feature) => (
                        <ListItem key={feature} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <CheckIcon sx={{ color: primaryColor }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature}
                            sx={{ color: primaryColor }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
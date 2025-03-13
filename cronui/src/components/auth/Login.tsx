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
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Check as CheckIcon,
  Star as StarIcon,
  Bolt as BoltIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import TypewriterText from '../common/TypewriterText';

const plans = [
  {
    name: 'Starter',
    icon: <StarIcon sx={{ fontSize: 40, color: '#ffa726' }} />,
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
    icon: <BoltIcon sx={{ fontSize: 40, color: '#ffa726' }} />,
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
    icon: <BusinessIcon sx={{ fontSize: 40, color: '#ffa726' }} />,
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

        {/* Plans Section */}
        <Box sx={{ mt: 12, mb: 8 }}>
          <Typography
            variant="h4"
            align="center"
            sx={{
              color: '#ffa726',
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
                      ? 'rgba(255, 167, 38, 0.1)'
                      : 'rgba(18, 18, 18, 0.8)',
                    border: plan.highlighted
                      ? '2px solid #ffa726'
                      : '1px solid rgba(255, 167, 38, 0.1)',
                    boxShadow: plan.highlighted
                      ? '0 0 30px rgba(255, 167, 38, 0.2)'
                      : '0 0 20px rgba(255, 167, 38, 0.1)',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 0 40px rgba(255, 167, 38, 0.3)',
                    },
                  }}
                >
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {plan.icon}
                        <Typography
                          variant="h5"
                          sx={{
                            color: '#ffa726',
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
                          color: '#ffa726',
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
                      sx={{ color: '#ffa726', mb: 3 }}
                    >
                      {plan.description}
                    </Typography>
                    <List>
                      {plan.features.map((feature) => (
                        <ListItem key={feature} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <CheckIcon sx={{ color: '#ffa726' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature}
                            sx={{ color: '#ffa726' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                  <Box sx={{ p: 3, pt: 0 }}>
                    <Button
                      fullWidth
                      variant={plan.highlighted ? 'contained' : 'outlined'}
                      sx={{
                        py: 1.5,
                        background: plan.highlighted ? '#ffa726' : 'transparent',
                        borderColor: '#ffa726',
                        color: '#ffa726',
                        '&:hover': {
                          background: plan.highlighted ? '#ff9800' : 'rgba(255, 167, 38, 0.1)',
                          borderColor: '#ff9800',
                        },
                      }}
                    >
                      {plan.cta}
                    </Button>
                  </Box>
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
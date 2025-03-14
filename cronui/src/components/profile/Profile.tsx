import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import userService, { User, Plan, UserProfileUpdate } from '../../services/user.service';

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserProfileUpdate>({
    FirstName: '',
    LastName: '',
    Address: '',
    City: '',
    State: '',
    Country: '',
    ZipCode: '',
    Phone: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, plansData] = await Promise.all([
          userService.getProfile(),
          userService.getAvailablePlans(),
        ]);
        setUser(userData);
        setPlans(plansData);
        setFormData({
          FirstName: userData.FirstName,
          LastName: userData.LastName,
          Address: userData.Address,
          City: userData.City,
          State: userData.State,
          Country: userData.Country,
          ZipCode: userData.ZipCode,
          Phone: userData.Phone,
        });
      } catch (err: any) {
        console.error('Profile data fetch error:', err);
        setError(err.response?.data?.message || 'Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedUser = await userService.updateProfile(formData);
      setUser(updatedUser);
      setSuccess('Profile updated successfully');
      setError(null);
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
      setSuccess(null);
    }
  };

  const handlePlanUpdate = async (planId: number) => {
    try {
      const updatedUser = await userService.updatePlan({ PlanID: planId });
      setUser(updatedUser);
      setSuccess('Plan updated successfully');
      setError(null);
    } catch (err: any) {
      console.error('Plan update error:', err);
      setError(err.response?.data?.message || 'Failed to update plan. Please try again.');
      setSuccess(null);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Profile Information
            </Typography>
            <form onSubmit={handleProfileUpdate}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="FirstName"
                    value={formData.FirstName}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="LastName"
                    value={formData.LastName}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="Address"
                    value={formData.Address}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    name="City"
                    value={formData.City}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="State"
                    name="State"
                    value={formData.State}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    name="Country"
                    value={formData.Country}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="ZIP Code"
                    name="ZipCode"
                    value={formData.ZipCode}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="Phone"
                    value={formData.Phone}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                  >
                    Update Profile
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>

        {/* Billing & Plans */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Current Plan
            </Typography>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6">{user?.Plan?.Name || 'No Plan Selected'}</Typography>
                <Typography color="textSecondary" gutterBottom>
                  {user?.Plan?.Description || 'Please select a plan to get started'}
                </Typography>
                <Typography variant="h4" color="primary">
                  ${user?.Plan?.Price || 0}/month
                </Typography>
              </CardContent>
            </Card>

            <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
              Available Plans
            </Typography>
            <Grid container spacing={2}>
              {plans.map((plan) => (
                <Grid item xs={12} key={plan.ID}>
                  <Card
                    sx={{
                      border: user?.PlanID === plan.ID ? '2px solid #1976d2' : 'none',
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6">{plan.Name}</Typography>
                      <Typography color="textSecondary" gutterBottom>
                        {plan.Description}
                      </Typography>
                      <Typography variant="h5" color="primary" gutterBottom>
                        ${plan.Price}/month
                      </Typography>
                      <List>
                        {plan.Features?.map((feature) => (
                          <ListItem key={feature.ID}>
                            <ListItemIcon>
                              <CheckIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={feature.Name}
                              secondary={feature.Description}
                            />
                          </ListItem>
                        )) || (
                          <ListItem>
                            <ListItemText
                              primary="No features available"
                              secondary="This plan currently has no features listed"
                            />
                          </ListItem>
                        )}
                      </List>
                      {user?.PlanID !== plan.ID && (
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          onClick={() => handlePlanUpdate(plan.ID)}
                        >
                          Switch to {plan.Name}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile; 
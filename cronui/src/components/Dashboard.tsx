import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  CardActionArea,
  Button,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import jobService from '../services/job.service';
import scheduleService from '../services/schedule.service';
import actionService from '../services/action.service';
import TypewriterText from './common/TypewriterText';
import api from '../services/api';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalSchedules: 0,
    totalActions: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        if (response.data.stats) {
          setStats({
            totalJobs: response.data.stats.total_jobs,
            totalSchedules: response.data.stats.total_schedules,
            totalActions: response.data.stats.total_actions,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <TypewriterText
          text="Welcome to your Cronny dashboard"
          speed={40}
          delay={0}
          prefix="$ "
        />
        <TypewriterText
          text="System status: Online"
          speed={40}
          delay={1500}
          prefix="$ "
        />
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardActionArea component={Link} to="/jobs">
              <CardHeader title="Jobs" />
              <CardContent>
                <Typography variant="h3" align="center">
                  {stats.totalJobs}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Total Jobs
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button 
                    endIcon={<ArrowForwardIcon />}
                    component={Link} 
                    to="/jobs"
                    color="primary"
                  >
                    Manage Jobs
                  </Button>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardActionArea component={Link} to="/schedules">
              <CardHeader title="Schedules" />
              <CardContent>
                <Typography variant="h3" align="center">
                  {stats.totalSchedules}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Total Schedules
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button 
                    endIcon={<ArrowForwardIcon />}
                    component={Link} 
                    to="/schedules"
                    color="primary"
                  >
                    Manage Schedules
                  </Button>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardActionArea component={Link} to="/actions">
              <CardHeader title="Actions" />
              <CardContent>
                <Typography variant="h3" align="center">
                  {stats.totalActions}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Total Actions
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button 
                    endIcon={<ArrowForwardIcon />}
                    component={Link} 
                    to="/actions"
                    color="primary"
                  >
                    Manage Actions
                  </Button>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      <Paper 
        sx={{ 
          p: 3, 
          mt: 3,
          background: 'rgba(18, 18, 18, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 167, 38, 0.1)',
          boxShadow: '0 0 20px rgba(255, 167, 38, 0.1)',
        }}
      >
        <TypewriterText
          text="Available commands:"
          speed={40}
          delay={2500}
          prefix="$ "
        />
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button 
            variant="contained" 
            component={Link} 
            to="/jobs/create"
            color="primary"
            sx={{
              background: '#ffa726',
              '&:hover': {
                background: '#ff9800',
              },
            }}
          >
            Create New Job
          </Button>
          <Button 
            variant="contained" 
            component={Link} 
            to="/schedules/create"
            color="secondary"
            sx={{
              background: '#ff9800',
              '&:hover': {
                background: '#c66900',
              },
            }}
          >
            Create New Schedule
          </Button>
          <Button 
            variant="contained" 
            component={Link} 
            to="/actions"
            color="info"
            sx={{
              background: '#29b6f6',
              '&:hover': {
                background: '#0288d1',
              },
            }}
          >
            Create New Action
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard;
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

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalSchedules: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobs, schedules] = await Promise.all([
          jobService.getJobs(),
          scheduleService.getSchedules(),
        ]);

        setStats({
          totalJobs: jobs.length,
          totalSchedules: schedules.length,
        });
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
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
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
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Welcome to Cronny
        </Typography>
        <Typography variant="body1" paragraph>
          This is the dashboard for the Cronny job scheduling and management system. You can manage your jobs and schedules by clicking on the cards above or using the navigation menu.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button 
            variant="contained" 
            component={Link} 
            to="/jobs/create"
            color="primary"
          >
            Create New Job
          </Button>
          <Button 
            variant="contained" 
            component={Link} 
            to="/schedules/create"
            color="secondary"
          >
            Create New Schedule
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard;
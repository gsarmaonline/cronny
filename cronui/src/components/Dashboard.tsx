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
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import TypewriterText from './common/TypewriterText';
import api from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface DashboardStats {
  total_jobs: number;
  total_schedules: number;
  total_actions: number;
  job_types: {
    http_jobs: number;
    slack_jobs: number;
    other_jobs: number;
  };
  schedule_status: {
    active: number;
    inactive: number;
  };
  recent_activity: Array<{
    id: number;
    type: string;
    name: string;
    execution_time: string;
    status: string;
  }>;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        if (response.data.stats) {
          setStats(response.data.stats);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const jobTypeData = [
    { name: 'HTTP Jobs', value: stats.job_types.http_jobs },
    { name: 'Slack Jobs', value: stats.job_types.slack_jobs },
    { name: 'Other Jobs', value: stats.job_types.other_jobs },
  ];

  const scheduleStatusData = [
    { name: 'Active', value: stats.schedule_status.active },
    { name: 'Inactive', value: stats.schedule_status.inactive },
  ];

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
        <Grid item xs={12} md={6} lg={6}>
          <Card>
            <CardActionArea component={Link} to="/schedules">
              <CardHeader title="Schedules" />
              <CardContent>
                <Typography variant="h3" align="center">
                  {stats.total_schedules}
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
        <Grid item xs={12} md={6} lg={6}>
          <Card>
            <CardActionArea component={Link} to="/actions">
              <CardHeader title="Actions" />
              <CardContent>
                <Typography variant="h3" align="center">
                  {stats.total_actions}
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

        {/* Job Types Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Job Types Distribution" />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={jobTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {jobTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Schedule Status Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Schedule Status" />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scheduleStatusData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Recent Activity" />
            <CardContent>
              <List>
                {stats?.recent_activity?.map((activity) => (
                  <ListItem key={activity.id}>
                    <ListItemText
                      primary={activity.name}
                      secondary={new Date(activity.execution_time).toLocaleString()}
                    />
                    <Chip 
                      label={activity.type === 'job' ? 'Job' : 'Schedule'} 
                      color={activity.type === 'job' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </ListItem>
                ))}
                {(!stats?.recent_activity || stats.recent_activity.length === 0) && (
                  <ListItem>
                    <ListItemText primary="No recent activity" />
                  </ListItem>
                )}
              </List>
            </CardContent>
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
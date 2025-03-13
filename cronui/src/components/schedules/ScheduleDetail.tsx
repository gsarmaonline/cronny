import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import scheduleService, { Schedule } from '../../services/schedule.service';
import jobService, { Job } from '../../services/job.service';

const ScheduleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobsError, setJobsError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchSchedule(parseInt(id));
  }, [id]);

  useEffect(() => {
    if (schedule?.action_id) {
      fetchJobs(schedule.action_id);
    }
  }, [schedule?.action_id]);

  const fetchSchedule = async (scheduleId: number) => {
    setLoading(true);
    setError('');
    try {
      const fetchedSchedule = await scheduleService.getSchedule(scheduleId);
      setSchedule(fetchedSchedule);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch schedule details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async (actionId: number) => {
    setJobsLoading(true);
    setJobsError('');
    try {
      const fetchedJobs = await jobService.getJobs(actionId);
      setJobs(fetchedJobs);
    } catch (err: any) {
      setJobsError(err.response?.data?.message || 'Failed to fetch jobs');
      console.error(err);
    } finally {
      setJobsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!schedule) return;
    
    if (window.confirm(`Are you sure you want to delete "${schedule.name}"?`)) {
      try {
        await scheduleService.deleteSchedule(schedule.ID);
        navigate('/schedules');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete schedule');
        console.error(err);
      }
    }
  };

  const handleActivateSchedule = async () => {
    if (!schedule) return;
    
    try {
      await scheduleService.updateSchedule(schedule.ID, { schedule_status: 1 }); // 1 = PendingScheduleStatus
      fetchSchedule(schedule.ID); // Refresh the schedule details
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to activate schedule');
      console.error(err);
    }
  };

  const handleDeactivateSchedule = async () => {
    if (!schedule) return;
    
    try {
      await scheduleService.updateSchedule(schedule.ID, { schedule_status: 4 }); // 4 = InactiveScheduleStatus
      fetchSchedule(schedule.ID); // Refresh the schedule details
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deactivate schedule');
      console.error(err);
    }
  };

  const getStatusChip = (status: number) => {
    switch (status) {
      case 1: // PendingScheduleStatus
        return <Chip label="Pending" color="primary" />;
      case 2: // ProcessingScheduleStatus
        return <Chip label="Processing" color="warning" />;
      case 3: // ProcessedScheduleStatus
        return <Chip label="Processed" color="success" />;
      case 4: // InactiveScheduleStatus
        return <Chip label="Inactive" color="default" />;
      default:
        return <Chip label="Unknown" color="error" />;
    }
  };

  const getScheduleTypeText = (type: number) => {
    switch (type) {
      case 1:
        return "Absolute";
      case 2:
        return "Recurring";
      case 3:
        return "Relative";
      default:
        return "Unknown";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          component={Link}
          to="/schedules"
          sx={{ mb: 2 }}
        >
          Back to Schedules
        </Button>
        <Paper sx={{ p: 3 }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      </Box>
    );
  }

  if (!schedule) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          component={Link}
          to="/schedules"
          sx={{ mb: 2 }}
        >
          Back to Schedules
        </Button>
        <Paper sx={{ p: 3 }}>
          <Typography>Schedule not found</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowBackIcon />}
            component={Link}
            to="/schedules"
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h5">{schedule.name}</Typography>
        </Box>
        <Box>
          {schedule.schedule_status === 4 ? (
            <Tooltip title="Activate Schedule">
              <IconButton
                color="success"
                onClick={handleActivateSchedule}
                sx={{ mr: 1 }}
              >
                <PlayArrowIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Deactivate Schedule">
              <IconButton
                color="warning"
                onClick={handleDeactivateSchedule}
                sx={{ mr: 1 }}
              >
                <PauseIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Edit Schedule">
            <IconButton
              color="primary"
              component={Link}
              to={`/schedules/edit/${schedule.ID}`}
              sx={{ mr: 1 }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Schedule">
            <IconButton
              color="error"
              onClick={handleDelete}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Schedule Details</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">ID</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">{schedule.ID}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                </Grid>
                <Grid item xs={8}>
                  {getStatusChip(schedule.schedule_status)}
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Type</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">{getScheduleTypeText(schedule.schedule_type)}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Value</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">{schedule.schedule_value}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Unit</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">{schedule.schedule_unit}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Action ID</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1 }}>{schedule.action_id}</Typography>
                    <Button 
                      component={Link} 
                      to={`/jobs?action_id=${schedule.action_id}`}
                      size="small"
                      variant="outlined"
                    >
                      View Jobs
                    </Button>
                  </Box>
                </Grid>
                
                {schedule.ends_at && (
                  <>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Ends At</Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography variant="body1">{formatDate(schedule.ends_at)}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Metadata</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Created At</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">{formatDate(schedule.CreatedAt)}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Updated At</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">{formatDate(schedule.UpdatedAt)}</Typography>
                </Grid>
                
                {schedule.DeletedAt && (
                  <>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Deleted At</Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography variant="body1">{formatDate(schedule.DeletedAt)}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Jobs related to this schedule */}
      <Box sx={{ mt: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Related Jobs</Typography>
              <Button 
                component={Link} 
                to={`/jobs?action_id=${schedule.action_id}`}
                variant="outlined"
                size="small"
              >
                View All Jobs
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {jobsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : jobsError ? (
              <Typography color="error">{jobsError}</Typography>
            ) : jobs.length === 0 ? (
              <Typography>No jobs found for this schedule.</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Root Job</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.ID}>
                        <TableCell>{job.name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={job.job_type} 
                            color={
                              job.job_type === 'http' ? 'primary' :
                              job.job_type === 'logger' ? 'info' :
                              job.job_type === 'slack' ? 'secondary' :
                              job.job_type === 'docker' ? 'warning' : 'default'
                            } 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          {job.is_root_job ? 
                            <CheckCircleIcon color="success" fontSize="small" /> : 
                            <CancelIcon color="error" fontSize="small" />}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            component={Link}
                            to={`/jobs/${job.ID}`}
                            size="small"
                            color="primary"
                            title="View details"
                          >
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ScheduleDetail;
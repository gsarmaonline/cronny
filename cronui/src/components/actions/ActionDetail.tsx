import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Divider,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import actionService from '../../services/action.service';
import jobService from '../../services/job.service';
import { Action } from '../../services/action.service';
import { Job } from '../../services/job.service';

const ActionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [action, setAction] = useState<Action | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActionData = async () => {
      setLoading(true);
      try {
        if (!id) {
          setError('Invalid action ID');
          setLoading(false);
          return;
        }

        // Fetch action details using actionService
        try {
          const actionData = await actionService.getAction(parseInt(id));
          setAction(actionData);
          
          // Fetch jobs for this action
          const jobsResponse = await jobService.getJobs(parseInt(id));
          setJobs(jobsResponse);
        } catch (err) {
          setError('Action not found');
        }
      } catch (err) {
        console.error('Error fetching action details:', err);
        setError('Failed to load action details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchActionData();
  }, [id]);

  const handleDeleteJob = async (jobId: number) => {
    try {
      await jobService.deleteJob(jobId);
      setJobs(jobs.filter(job => job.ID !== jobId));
    } catch (err) {
      console.error('Error deleting job:', err);
      setError('Failed to delete job. Please try again.');
    }
  };

  const handleAddJob = () => {
    if (id) {
      navigate(`/actions/${id}/jobs/new`);
    }
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
          onClick={() => navigate('/actions')}
          sx={{ mb: 2 }}
        >
          Back to Actions
        </Button>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Box>
    );
  }

  if (!action) {
    return (
      <Box>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/actions')}
          sx={{ mb: 2 }}
        >
          Back to Actions
        </Button>
        <Alert severity="warning">Action not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/actions')}
        sx={{ mb: 3 }}
      >
        Back to Actions
      </Button>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">{action.name}</Typography>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/actions/${id}/edit`)}
              >
                Edit Action
              </Button>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {action.description || "No description provided"}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2">Created: {new Date(action.CreatedAt).toLocaleString()}</Typography>
            <Typography variant="subtitle2">Last Updated: {new Date(action.UpdatedAt).toLocaleString()}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Jobs</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddJob}
        >
          Add Job
        </Button>
      </Box>

      {jobs.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>No jobs found for this action.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Job Name</TableCell>
                <TableCell>Input Type</TableCell>
                <TableCell>Template ID</TableCell>
                <TableCell>Root Job</TableCell>
                <TableCell>Timeout (s)</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.ID}>
                  <TableCell>
                    <Typography
                      component="span"
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                      onClick={() => navigate(`/actions/${id}/jobs/${job.ID}/edit`)}
                      data-testid={`job-name-${job.ID}`}
                    >
                      {job.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{job.job_input_type}</TableCell>
                  <TableCell>{job.job_template_id}</TableCell>
                  <TableCell>{job.is_root_job ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{job.job_timeout_in_secs}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => navigate(`/actions/${id}/jobs/${job.ID}/edit`)}
                      size="small"
                      color="primary"
                      title="Edit job"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteJob(job.ID)}
                      size="small"
                      color="error"
                      title="Delete job"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ActionDetail; 
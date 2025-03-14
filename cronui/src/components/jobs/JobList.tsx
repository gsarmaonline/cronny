import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import jobService, { Job } from '../../services/job.service';

// Helper function to parse query parameters
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const JobList: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const query = useQuery();
  const actionId = query.get('action_id') ? parseInt(query.get('action_id')!) : undefined;

  useEffect(() => {
    fetchJobs();
  }, [actionId]); // Re-fetch jobs when actionId changes

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedJobs = await jobService.getJobs(actionId);
      setJobs(fetchedJobs);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch jobs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (job: Job) => {
    setJobToDelete(job);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;

    try {
      await jobService.deleteJob(jobToDelete.ID);
      setJobs(jobs.filter(j => j.ID !== jobToDelete.ID));
      setDeleteDialogOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete job');
      console.error(err);
    }
  };

  const getJobTypeChip = (type: string) => {
    let color: 'primary' | 'secondary' | 'default' | 'error' | 'info' | 'success' | 'warning';
    
    switch (type) {
      case 'http':
        color = 'primary';
        break;
      case 'logger':
        color = 'info';
        break;
      case 'slack':
        color = 'secondary';
        break;
      case 'docker':
        color = 'warning';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={type} color={color} size="small" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">
            {actionId ? `Jobs for Action ID: ${actionId}` : 'All Jobs'}
          </Typography>
          {actionId && (
            <Button
              component={Link}
              to="/jobs"
              size="small"
              sx={{ mt: 1 }}
            >
              Back to All Jobs
            </Button>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to="/jobs/create"
        >
          Create Job
        </Button>
      </Box>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {jobs.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>No jobs found. Create your first job!</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Input Type</TableCell>
                <TableCell>Root Job</TableCell>
                <TableCell>Action ID</TableCell>
                <TableCell>Template ID</TableCell>
                <TableCell>Executions</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.ID}>
                  <TableCell>
                    <Typography 
                      component={Link} 
                      to={`/jobs/${job.ID}`}
                      sx={{ 
                        textDecoration: 'none',
                        color: 'inherit',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {job.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{getJobTypeChip(job.job_type)}</TableCell>
                  <TableCell>{job.job_input_type}</TableCell>
                  <TableCell>
                    {job.is_root_job ? 
                      <CheckCircleIcon color="success" fontSize="small" /> : 
                      <CancelIcon color="error" fontSize="small" />}
                  </TableCell>
                  <TableCell>{job.action_id}</TableCell>
                  <TableCell>{job.job_template_id}</TableCell>
                  <TableCell>{job.job_executions?.length || 0}</TableCell>
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
                    
                    <IconButton
                      component={Link}
                      to={`/jobs/edit/${job.ID}`}
                      size="small"
                      color="primary"
                      title="Edit job"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(job)}
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

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the job "{jobToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobList;
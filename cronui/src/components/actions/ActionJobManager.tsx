import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Info as InfoIcon 
} from '@mui/icons-material';
import { actionsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Action } from '../../services/action.service';
import { Job, JobTemplate } from '../../services/job.service';
import jobService from '../../services/job.service';

const ActionJobManager: React.FC = () => {
  const { user } = useAuth();
  const [actions, setActions] = useState<Action[]>([]);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openJobDialog, setOpenJobDialog] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [jobFormData, setJobFormData] = useState({
    name: '',
    inputType: 'static_input',
    inputValue: '{}',
    actionId: 0,
    jobTemplateId: 0,
    isRootJob: false,
    condition: '{}',
    proceedCondition: '',
    jobTimeoutInSecs: 300
  });
  const [jobTemplateOptions, setJobTemplateOptions] = useState<Array<{
    id: number;
    name: string;
    type?: string;
    inputType?: string;
    inputValue?: string;
  }>>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchActions();
      fetchJobTemplates();
    }
  }, [user]);

  const fetchActions = async () => {
    try {
      const response = await actionsApi.getActions();
      if (response?.data?.actions) {
        console.log("Fetched actions:", response.data.actions);
        setActions(response.data.actions);
      } else {
        setActions([]);
        setError('No actions data received');
      }
    } catch (err) {
      setError('Failed to fetch actions');
      setActions([]);
    }
  };

  const fetchJobsForAction = async (actionId: number) => {
    try {
      const response = await jobService.getJobs(actionId);
      setJobs(response);
    } catch (err) {
      setError('Failed to fetch jobs');
    }
  };

  const fetchJobTemplates = async () => {
    try {
      const templates = await jobService.getJobTemplates();
      
      const options = templates.map(template => {
        return {
          id: template.ID,
          name: template.name,
        };
      });

      setJobTemplateOptions(options);
      
      // Set the first template as default if available
      if (options.length > 0) {
        setJobFormData(prev => ({
          ...prev,
          jobTemplateId: options[0].id
        }));
      }
    } catch (err) {
      setError('Failed to fetch job templates');
    }
  };

  const handleSelectAction = async (action: Action) => {
    setSelectedAction(action);
    await fetchJobsForAction(action.ID);
  };

  const handleDeleteAction = async (actionId: number) => {
    try {
      const response = await actionsApi.deleteAction(actionId);
      const data = response?.data as { message?: string };
      
      if (data?.message === "success") {
        setActions(actions.filter(a => a.ID !== actionId));
        if (selectedAction?.ID === actionId) {
          setSelectedAction(null);
          setJobs([]);
        }
        setError(null);
      } else if (data?.message) {
        setError(data.message);
      }
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || 'Failed to delete action');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete action');
      }
    }
  };

  const handleOpenCreateJobPage = () => {
    if (!selectedAction) {
      setError('No action selected');
      return;
    }
    navigate(`/actions/${selectedAction.ID}/jobs/new`);
  };

  const handleOpenEditJobPage = (job: Job) => {
    navigate(`/actions/${job.action_id}/jobs/${job.ID}/edit`);
  };

  const handleDeleteJob = async (jobId: number) => {
    try {
      await jobService.deleteJob(jobId);
      setJobs(jobs.filter(j => j.ID !== jobId));
      setError(null);
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || 'Failed to delete job');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete job');
      }
    }
  };

  const handleSaveJob = async () => {
    if (!selectedAction) {
      setError('No action selected');
      return;
    }

    const newJob = {
      name: jobFormData.name,
      job_input_type: jobFormData.inputType,
      job_input_value: jobFormData.inputValue,
      action_id: selectedAction.ID,
      job_template_id: jobFormData.jobTemplateId,
      is_root_job: jobFormData.isRootJob,
      condition: jobFormData.condition,
      proceed_condition: jobFormData.proceedCondition,
      job_timeout_in_secs: jobFormData.jobTimeoutInSecs,
      job_executions: []
    };

    try {
      if (editingJob) {
        const updatedJob = await jobService.updateJob(editingJob.ID, newJob);
        if (typeof updatedJob === 'object' && 'message' in updatedJob && updatedJob.message !== "success") {
          setError(updatedJob.message as string);
          return;
        }
        setJobs(jobs.map(j => (j.ID === editingJob.ID ? updatedJob : j)));
      } else {
        const createdJob = await jobService.createJob(newJob);
        if (typeof createdJob === 'object' && 'message' in createdJob && createdJob.message !== "success") {
          setError(createdJob.message as string);
          return;
        }
        setJobs([...jobs, createdJob]);
      }
      setError(null);
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || 'Failed to save job');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save job');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Actions</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to="/actions/new"
          data-testid="add-action-button"
        >
          Create New Action
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" data-testid="error-message" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {actions.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>No actions found. Create your first action!</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {actions.map((action) => (
                <TableRow 
                  key={action.ID}
                  sx={{ 
                    bgcolor: selectedAction?.ID === action.ID ? 'action.selected' : 'background.paper',
                    '&:hover': { bgcolor: 'action.hover' },
                    cursor: 'pointer'
                  }}
                  data-testid={`action-item-${action.ID}`}
                  onClick={() => navigate(`/actions/${action.ID}/edit`)}
                >
                  <TableCell>
                    <Typography 
                      component={Link} 
                      to={`/actions/${action.ID}`}
                      sx={{ 
                        fontWeight: selectedAction?.ID === action.ID ? 'bold' : 'normal',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        color: 'inherit',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {action.name || 'Unnamed Action'}
                    </Typography>
                  </TableCell>
                  <TableCell>{action.description || 'No description'}</TableCell>
                  <TableCell>{new Date(action.CreatedAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <IconButton
                      component={Link}
                      to={`/actions/${action.ID}`}
                      size="small"
                      color="primary"
                      title="View details"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAction(action.ID);
                      }}
                      data-testid={`delete-action-${action.ID}`}
                      size="small"
                      color="error"
                      title="Delete action"
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

      {selectedAction && (
        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Jobs for {selectedAction.name}</Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateJobPage}
              data-testid="add-job-button"
            >
              Add Job
            </Button>
          </Box>

          {jobs.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography>No jobs found for this action. Add your first job!</Typography>
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
                          onClick={() => handleOpenEditJobPage(job)}
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
                          onClick={() => handleOpenEditJobPage(job)}
                          data-testid={`edit-job-${job.ID}`}
                          size="small"
                          color="primary"
                          title="Edit job"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteJob(job.ID);
                          }}
                          data-testid={`delete-job-${job.ID}`}
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
      )}
    </Box>
  );
};

export default ActionJobManager; 
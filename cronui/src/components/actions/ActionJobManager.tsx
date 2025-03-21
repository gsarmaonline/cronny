import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ButtonBase,
  Paper,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
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
  const [openActionDialog, setOpenActionDialog] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [newAction, setNewAction] = useState<Action>({ name: '', description: '', user_id: 0, ID: 0, CreatedAt: '', UpdatedAt: '', DeletedAt: null });
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

  const handleOpenJobDialog = (job?: Job) => {
    if (job) {
      setEditingJob(job);
      setJobFormData({
        name: job.name,
        inputType: job.job_input_type,
        inputValue: job.job_input_value,
        actionId: job.action_id,
        jobTemplateId: job.job_template_id,
        isRootJob: job.is_root_job,
        condition: job.condition,
        proceedCondition: job.proceed_condition,
        jobTimeoutInSecs: job.job_timeout_in_secs
      });
    } else {
      setEditingJob(null);
      // Set default values with the first template if available
      setJobFormData({
        name: '',
        inputType: 'static_input',
        inputValue: '{}',
        actionId: selectedAction?.ID || 0,
        jobTemplateId: jobTemplateOptions.length > 0 ? jobTemplateOptions[0].id : 0,
        isRootJob: false,
        condition: '{}',
        proceedCondition: '',
        jobTimeoutInSecs: 300
      });
    }
    setOpenJobDialog(true);
  };

  const handleCloseJobDialog = () => {
    setOpenJobDialog(false);
    setEditingJob(null);
    setJobFormData({
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
  };

  const handleSaveAction = async () => {
    setLoading(true);
    try {
      if (newAction.user_id === 0 && user) {
        newAction.user_id = user.id;
      }
      
      // Add current timestamp in RFC3339 format
      const now = new Date().toISOString();
      const actionToSave = {
        ...newAction,
        CreatedAt: now,
        UpdatedAt: now
      };
      
      const response = await actionsApi.createAction(actionToSave);

      if (response?.data) {
        const responseData = response.data as { action?: Action; actions?: Action; message?: string };
        
        if (responseData.message && responseData.message !== "success") {
          setError(responseData.message);
          return;
        }
        
        const savedAction = responseData.action || responseData.actions;
        if (savedAction) {
          setActions(prevActions => [...prevActions, savedAction]);
          setOpenActionDialog(false);
          setNewAction({ name: '', description: '', user_id: 0, ID: 0, CreatedAt: '', UpdatedAt: '', DeletedAt: null });
          setError(null);
          return;
        }
      }

      throw new Error('Invalid response format from server');
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || 'Failed to save action');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save action');
      }
    } finally {
      setLoading(false);
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
      handleCloseJobDialog();
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
      <Typography variant="h4" gutterBottom>Actions</Typography>
      {error && (
        <Alert severity="error" data-testid="error-message" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpenActionDialog(true)}
        sx={{ mb: 3 }}
        data-testid="add-action-button"
      >
        Create New Action
      </Button>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom>Action List</Typography>
          <List>
            {Array.isArray(actions) && actions.map((action) => (
              action && action.ID ? (
                <Paper
                  key={action.ID}
                  elevation={selectedAction?.ID === action.ID ? 3 : 1}
                  sx={{ mb: 1 }}
                >
                  <ButtonBase
                    onClick={() => handleSelectAction(action)}
                    sx={{
                      width: '100%',
                      textAlign: 'left',
                      p: 2,
                      bgcolor: selectedAction?.ID === action.ID ? 'action.selected' : 'background.paper'
                    }}
                    data-testid={`action-item-${action.ID}`}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1">{action.name || 'Unnamed Action'}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {action.description || 'No description'}
                      </Typography>
                    </Box>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAction(action.ID);
                      }}
                      data-testid={`delete-action-${action.ID}`}
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ButtonBase>
                </Paper>
              ) : null
            ))}
            {(!Array.isArray(actions) || actions.length === 0) && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                No actions available
              </Typography>
            )}
          </List>
        </Grid>

        <Grid item xs={12} md={8}>
          {selectedAction ? (
            <>
              <Typography variant="h6" gutterBottom>
                Jobs for {selectedAction.name}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleOpenJobDialog()}
                sx={{ mb: 2 }}
                data-testid="add-job-button"
              >
                Add Job
              </Button>
              {jobs.map(job => (
                <Card key={job.ID} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6">{job.name}</Typography>
                    <Typography>Input Type: {job.job_input_type}</Typography>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenJobDialog(job);
                      }}
                      data-testid={`edit-job-${job.ID}`}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setJobs(jobs.filter(j => j.ID !== job.ID));
                      }}
                      data-testid={`delete-job-${job.ID}`}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <Typography variant="body1" color="textSecondary">
              Select an action to view and manage its jobs
            </Typography>
          )}
        </Grid>
      </Grid>

      {/* Action Creation Dialog */}
      <Dialog
        open={openActionDialog}
        onClose={() => setOpenActionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Action</DialogTitle>
        <DialogContent>
          <TextField
            label="Action Name"
            value={newAction.name}
            onChange={e => setNewAction({ ...newAction, name: e.target.value })}
            fullWidth
            margin="normal"
            inputProps={{ "data-testid": "new-action-name-input" }}
          />
          <TextField
            label="Description"
            value={newAction.description}
            onChange={e => setNewAction({ ...newAction, description: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={3}
            inputProps={{ "data-testid": "new-action-description-input" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenActionDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveAction}
            variant="contained"
            color="primary"
            disabled={loading}
            data-testid="save-new-action-button"
          >
            {loading ? <CircularProgress size={24} /> : 'Create Action'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Existing Job Dialog */}
      <Dialog open={openJobDialog} onClose={handleCloseJobDialog} maxWidth="md" fullWidth>
        <DialogTitle data-testid="job-dialog-title">{editingJob ? 'Edit Job' : 'Add Job'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                id="job-name"
                label="Job Name"
                value={jobFormData.name}
                onChange={e => setJobFormData({ ...jobFormData, name: e.target.value })}
                fullWidth
                margin="normal"
                inputProps={{ "data-testid": "job-name-input" }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="job-template-label">Job Template</InputLabel>
                <Select
                  labelId="job-template-label"
                  id="job-template"
                  value={jobFormData.jobTemplateId}
                  label="Job Template"
                  onChange={e => {
                    const templateId = Number(e.target.value);
                    setJobFormData({ ...jobFormData, jobTemplateId: templateId });
                    // Find the selected template
                    const selectedTemplate = jobTemplateOptions.find(template => template.id === templateId);
                    if (selectedTemplate) {
                      // Update relevant fields based on the template
                      setJobFormData(prev => ({
                        ...prev,
                        jobTemplateId: templateId,
                        inputValue: selectedTemplate.inputValue || prev.inputValue
                      }));
                    }
                  }}
                  inputProps={{ "data-testid": "job-template-select" }}
                >
                  {jobTemplateOptions.map(template => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="input-value"
                label="Input Value"
                value={jobFormData.inputValue}
                onChange={e => setJobFormData({ ...jobFormData, inputValue: e.target.value })}
                fullWidth
                margin="normal"
                multiline
                rows={4}
                inputProps={{ "data-testid": "input-value-input" }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="timeout"
                label="Timeout (seconds)"
                type="number"
                value={jobFormData.jobTimeoutInSecs}
                onChange={e => setJobFormData({ ...jobFormData, jobTimeoutInSecs: Number(e.target.value) })}
                fullWidth
                margin="normal"
                inputProps={{ "data-testid": "timeout-input" }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseJobDialog}>Cancel</Button>
          <Button onClick={handleSaveJob} variant="contained" color="primary" data-testid="save-job-button">
            Save Job
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActionJobManager; 
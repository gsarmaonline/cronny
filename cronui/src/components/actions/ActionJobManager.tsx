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
    type: 'http',
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
      console.error('Error fetching actions:', err);
      setActions([]);
    }
  };

  const fetchJobsForAction = async (actionId: number) => {
    try {
      const response = await jobService.getJobs(actionId);
      setJobs(response);
    } catch (err) {
      setError('Failed to fetch jobs');
      console.error('Error fetching jobs:', err);
    }
  };

  const fetchJobTemplates = async () => {
    try {
      const templates = await jobService.getJobTemplates();
      console.log('Raw templates from API:', templates);
      
      const options = templates.map(template => {
        console.log('Processing template:', {
          id: template.ID,
          name: template.name,
        });
        
        return {
          id: template.ID,
          name: template.name,  // Remove the fallback since name is required in the JobTemplate interface
        };
      });

      console.log('Final template options:', options);
      setJobTemplateOptions(options);
    } catch (err) {
      console.error('Failed to fetch job templates:', err);
      setError('Failed to fetch job templates');
    }
  };

  const handleSelectAction = async (action: Action) => {
    setSelectedAction(action);
    await fetchJobsForAction(action.ID);
  };

  const handleDeleteAction = async (actionId: number) => {
    try {
      await actionsApi.deleteAction(actionId);
      setActions(actions.filter(a => a.ID !== actionId));
      if (selectedAction?.ID === actionId) {
        setSelectedAction(null);
        setJobs([]);
      }
    } catch (err) {
      setError('Failed to delete action');
      console.error('Error deleting action:', err);
    }
  };

  const handleOpenJobDialog = (job?: Job) => {
    if (job) {
      setEditingJob(job);
      setJobFormData({
        name: job.name,
        type: job.job_type,
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
      setJobFormData({
        name: '',
        type: 'http',
        inputType: 'static_input',
        inputValue: '{}',
        actionId: 0,
        jobTemplateId: 0,
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
      type: 'http',
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
      console.log('Action creation response:', response); // Debug log
      console.log('Response data:', response?.data); // Additional debug log

      if (response?.data) {
        // Use type assertion since we know the structure from the API
        const responseData = response.data as { action?: Action; actions?: Action };
        const savedAction = responseData.action || responseData.actions;
        
        if (savedAction) {
          setActions(prevActions => [...prevActions, savedAction]);
          setOpenActionDialog(false);
          setNewAction({ name: '', description: '', user_id: 0, ID: 0, CreatedAt: '', UpdatedAt: '', DeletedAt: null });
          setError(null);
          return;
        }
      }

      console.error('Response data structure:', {
        hasData: !!response?.data,
        dataKeys: response?.data ? Object.keys(response.data) : [],
        fullResponse: response
      });
      throw new Error('Invalid response format from server');
    } catch (err) {
      console.error('Full error details:', err); // Debug log
      if (err instanceof Error) {
        setError(`Failed to save action: ${err.message}`);
      } else {
        setError('Failed to save action');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveJob = async () => {
    const newJob = {
      name: jobFormData.name,
      job_type: jobFormData.type,
      job_input_type: jobFormData.inputType,
      job_input_value: jobFormData.inputValue,
      action_id: jobFormData.actionId,
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
        setJobs(jobs.map(j => (j.ID === editingJob.ID ? updatedJob : j)));
      } else {
        const createdJob = await jobService.createJob(newJob);
        setJobs([...jobs, createdJob]);
      }
      handleCloseJobDialog();
      setError(null);
    } catch (err) {
      setError('Failed to save job');
      console.error('Error saving job:', err);
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
                    <Typography>Type: {job.job_type}</Typography>
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
                <InputLabel id="job-type-label">Job Type</InputLabel>
                <Select
                  labelId="job-type-label"
                  id="job-type"
                  value={jobFormData.type}
                  label="Job Type"
                  onChange={e => setJobFormData({ ...jobFormData, type: e.target.value })}
                  inputProps={{ "data-testid": "job-type-select" }}
                >
                  <MenuItem value="http">HTTP</MenuItem>
                  <MenuItem value="slack">Slack</MenuItem>
                  <MenuItem value="logger">Logger</MenuItem>
                  <MenuItem value="docker">Docker</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="input-type-label">Input Type</InputLabel>
                <Select
                  labelId="input-type-label"
                  id="input-type"
                  value={jobFormData.inputType}
                  label="Input Type"
                  onChange={e => setJobFormData({ ...jobFormData, inputType: e.target.value })}
                  inputProps={{ "data-testid": "input-type-select" }}
                >
                  <MenuItem value="static_input">Static Input</MenuItem>
                  <MenuItem value="dynamic_input">Dynamic Input</MenuItem>
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
                      // Update the job type and other relevant fields based on the template
                      // You may want to fetch the full template details here if needed
                      setJobFormData(prev => ({
                        ...prev,
                        jobTemplateId: templateId,
                        type: selectedTemplate.type || prev.type,
                        inputType: selectedTemplate.inputType || prev.inputType,
                        inputValue: selectedTemplate.inputValue || prev.inputValue
                      }));
                    }
                  }}
                  inputProps={{ "data-testid": "job-template-select" }}
                >
                  <MenuItem value={0}>No Template</MenuItem>
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
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    id="root-job"
                    checked={jobFormData.isRootJob}
                    onChange={e => setJobFormData({ ...jobFormData, isRootJob: e.target.checked })}
                    data-testid="root-job-switch"
                  />
                }
                label="Root Job"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="condition"
                label="Condition"
                value={jobFormData.condition}
                onChange={e => setJobFormData({ ...jobFormData, condition: e.target.value })}
                fullWidth
                margin="normal"
                multiline
                rows={4}
                inputProps={{ "data-testid": "condition-input" }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="proceed-condition"
                label="Proceed Condition"
                value={jobFormData.proceedCondition}
                onChange={e => setJobFormData({ ...jobFormData, proceedCondition: e.target.value })}
                fullWidth
                margin="normal"
                inputProps={{ "data-testid": "proceed-condition-input" }}
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
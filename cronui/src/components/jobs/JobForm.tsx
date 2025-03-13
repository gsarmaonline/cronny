import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Switch,
  FormControlLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import jobService, { Job } from '../../services/job.service';
import actionService from '../../services/action.service';
import { useEffect as useReactEffect } from 'react';

interface ActionOption {
  id: number;
  name: string;
}

interface JobTemplateOption {
  id: number;
  name: string;
}

const JobForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  // Form state
  const [name, setName] = useState('');
  const [jobType, setJobType] = useState('http');
  const [jobInputType, setJobInputType] = useState('static_input');
  const [jobInputValue, setJobInputValue] = useState('{}');
  const [actionId, setActionId] = useState<number | ''>('');
  const [jobTemplateId, setJobTemplateId] = useState<number | ''>('');
  const [isRootJob, setIsRootJob] = useState(false);
  const [condition, setCondition] = useState('{}');
  const [proceedCondition, setProceedCondition] = useState('');
  const [jobTimeoutInSecs, setJobTimeoutInSecs] = useState(300); // Default 5 minutes
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [actionOptions, setActionOptions] = useState<ActionOption[]>([]);
  const [jobTemplateOptions, setJobTemplateOptions] = useState<JobTemplateOption[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Validation state
  const [nameError, setNameError] = useState('');
  const [jobInputValueError, setJobInputValueError] = useState('');
  const [actionIdError, setActionIdError] = useState('');
  const [jobTemplateIdError, setJobTemplateIdError] = useState('');

  useEffect(() => {
    // Load actions for the dropdown
    fetchActions();
    
    // Load job templates for the dropdown
    fetchJobTemplates();
    
    // If we're in edit mode, load the job
    if (isEditMode) {
      fetchJob();
    }
  }, [id]);

  const fetchActions = async () => {
    try {
      const actions = await actionService.getActions();
      setActionOptions(actions.map(action => ({
        id: action.ID,
        name: action.name
      })));
    } catch (err: any) {
      console.error('Failed to fetch actions:', err);
    }
  };

  const fetchJobTemplates = async () => {
    try {
      // Replace with actual job template service when available
      // For now, we'll use a mock list
      setJobTemplateOptions([
        { id: 1, name: 'HTTP Template' },
        { id: 2, name: 'Slack Template' }
      ]);
    } catch (err: any) {
      console.error('Failed to fetch job templates:', err);
    }
  };

  const fetchJob = async () => {
    if (!id) return;
    
    setLoading(true);
    setError('');
    
    try {
      const jobId = parseInt(id);
      const job = await jobService.getJob(jobId);
      
      // Populate form with job data
      setName(job.name);
      setJobType(job.job_type);
      setJobInputType(job.job_input_type);
      setJobInputValue(job.job_input_value);
      setActionId(job.action_id);
      setJobTemplateId(job.job_template_id);
      setIsRootJob(job.is_root_job);
      setCondition(job.condition || '{}');
      setProceedCondition(job.proceed_condition || '');
      setJobTimeoutInSecs(job.job_timeout_in_secs);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch job');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    
    // Validate name
    if (!name.trim()) {
      setNameError('Name is required');
      isValid = false;
    } else {
      setNameError('');
    }
    
    // Validate job input value
    if (!jobInputValue.trim()) {
      setJobInputValueError('Input value is required');
      isValid = false;
    } else {
      try {
        // Check if the input value is valid JSON
        if (jobInputType === 'static_input') {
          JSON.parse(jobInputValue);
        }
        setJobInputValueError('');
      } catch (err) {
        setJobInputValueError('Invalid JSON format');
        isValid = false;
      }
    }
    
    // Validate action ID
    if (!actionId) {
      setActionIdError('Action is required');
      isValid = false;
    } else {
      setActionIdError('');
    }
    
    // Validate job template ID
    if (!jobTemplateId) {
      setJobTemplateIdError('Job template is required');
      isValid = false;
    } else {
      setJobTemplateIdError('');
    }
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const jobData: Partial<Job> = {
        name,
        job_type: jobType,
        job_input_type: jobInputType,
        job_input_value: jobInputValue,
        action_id: actionId as number,
        job_template_id: jobTemplateId as number,
        is_root_job: isRootJob,
        job_timeout_in_secs: jobTimeoutInSecs
      };
      
      if (condition && condition.trim() !== '{}') {
        jobData.condition = condition;
      }
      
      if (proceedCondition && proceedCondition.trim() !== '') {
        jobData.proceed_condition = proceedCondition;
      }
      
      if (isEditMode && id) {
        await jobService.updateJob(parseInt(id), jobData);
      } else {
        await jobService.createJob(jobData);
      }
      
      // Navigate back to the jobs list
      navigate('/jobs');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save job');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      await jobService.deleteJob(parseInt(id));
      navigate('/jobs');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete job');
      console.error(err);
    } finally {
      setSubmitting(false);
      setDeleteDialogOpen(false);
    }
  };

  const formatJsonInput = () => {
    try {
      const formattedJson = JSON.stringify(JSON.parse(jobInputValue), null, 2);
      setJobInputValue(formattedJson);
    } catch (err) {
      // If not valid JSON, don't format
    }
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
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowBackIcon />}
            component={Link}
            to="/jobs"
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h5">
            {isEditMode ? 'Edit Job' : 'Create Job'}
          </Typography>
        </Box>
        {isEditMode && (
          <IconButton 
            color="error" 
            onClick={() => setDeleteDialogOpen(true)}
          >
            <DeleteIcon />
          </IconButton>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Name"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!nameError}
                helperText={nameError}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Job Type</InputLabel>
                <Select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  label="Job Type"
                >
                  <MenuItem value="http">HTTP</MenuItem>
                  <MenuItem value="logger">Logger</MenuItem>
                  <MenuItem value="slack">Slack</MenuItem>
                  <MenuItem value="docker">Docker</MenuItem>
                </Select>
                <FormHelperText>Select the type of job</FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Input Type</InputLabel>
                <Select
                  value={jobInputType}
                  onChange={(e) => setJobInputType(e.target.value as string)}
                  label="Input Type"
                >
                  <MenuItem value="static_input">Static Input</MenuItem>
                  <MenuItem value="job_output_as_input">Job Output as Input</MenuItem>
                  <MenuItem value="job_input_as_template">Job Input as Template</MenuItem>
                </Select>
                <FormHelperText>Select the type of input</FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Input Value"
                fullWidth
                multiline
                rows={6}
                value={jobInputValue}
                onChange={(e) => setJobInputValue(e.target.value)}
                error={!!jobInputValueError}
                helperText={jobInputValueError || (jobInputType === 'static_input' ? 'Enter a JSON object' : 'Enter the input value')}
                required
                sx={{ fontFamily: 'monospace' }}
              />
              {jobInputType === 'static_input' && (
                <Button 
                  variant="text" 
                  size="small" 
                  onClick={formatJsonInput} 
                  sx={{ mt: 1 }}
                >
                  Format JSON
                </Button>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!actionIdError}>
                <InputLabel>Action</InputLabel>
                <Select
                  value={actionId}
                  onChange={(e) => setActionId(e.target.value as number)}
                  label="Action"
                >
                  {actionOptions.map((action) => (
                    <MenuItem key={action.id} value={action.id}>
                      {action.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{actionIdError || 'Select the action to execute'}</FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!jobTemplateIdError}>
                <InputLabel>Job Template</InputLabel>
                <Select
                  value={jobTemplateId}
                  onChange={(e) => setJobTemplateId(e.target.value as number)}
                  label="Job Template"
                >
                  {jobTemplateOptions.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{jobTemplateIdError || 'Select the job template'}</FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Timeout (seconds)"
                type="number"
                fullWidth
                value={jobTimeoutInSecs}
                onChange={(e) => setJobTimeoutInSecs(parseInt(e.target.value))}
                inputProps={{ min: 1 }}
                helperText="Maximum execution time for the job"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isRootJob}
                    onChange={(e) => setIsRootJob(e.target.checked)}
                    color="primary"
                  />
                }
                label="Root Job"
              />
              <FormHelperText>
                Is this a root job that can be triggered directly?
              </FormHelperText>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Condition (Optional)"
                fullWidth
                multiline
                rows={3}
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                helperText="Condition for job execution (JSON format)"
                sx={{ fontFamily: 'monospace' }}
              />
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  component={Link}
                  to="/jobs"
                  sx={{ mr: 2 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                >
                  {submitting ? <CircularProgress size={24} /> : (isEditMode ? 'Update' : 'Create')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this job? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDelete} 
            color="error"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobForm;
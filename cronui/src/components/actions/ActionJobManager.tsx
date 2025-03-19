import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Alert,
} from '@mui/material';
import { actionsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import jobService from '../../services/job.service';
import ActionList from './ActionList';
import ActionForm from './ActionForm';
import JobList from './JobList';
import JobForm from './JobForm';
import { Action, Job, JobFormData, ActionFormData, JobTemplateOption } from './types';

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
  const [jobTemplateOptions, setJobTemplateOptions] = useState<JobTemplateOption[]>([]);

  const [actionFormData, setActionFormData] = useState<ActionFormData>({
    name: '',
    description: '',
    user_id: 0,
    ID: 0,
    CreatedAt: '',
    UpdatedAt: '',
    DeletedAt: null
  });

  const [jobFormData, setJobFormData] = useState<JobFormData>({
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
      const options = templates.map(template => ({
        id: template.ID,
        name: template.name
      }));
      setJobTemplateOptions(options);
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
      await actionsApi.deleteAction(actionId);
      setActions(actions.filter(a => a.ID !== actionId));
      if (selectedAction?.ID === actionId) {
        setSelectedAction(null);
        setJobs([]);
      }
    } catch (err) {
      setError('Failed to delete action');
    }
  };

  const handleSaveAction = async () => {
    setLoading(true);
    try {
      if (actionFormData.user_id === 0 && user) {
        actionFormData.user_id = user.id;
      }
      
      const now = new Date().toISOString();
      const actionToSave = {
        ...actionFormData,
        CreatedAt: now,
        UpdatedAt: now
      };
      
      const response = await actionsApi.createAction(actionToSave);

      if (response?.data) {
        const responseData = response.data as { action?: Action; actions?: Action };
        const savedAction = responseData.action || responseData.actions;
        
        if (savedAction) {
          setActions(prevActions => [...prevActions, savedAction]);
          setOpenActionDialog(false);
          setActionFormData({
            name: '',
            description: '',
            user_id: 0,
            ID: 0,
            CreatedAt: '',
            UpdatedAt: '',
            DeletedAt: null
          });
          setError(null);
          return;
        }
      }

      throw new Error('Invalid response format from server');
    } catch (err) {
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
      action_id: selectedAction?.ID || 0,
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
        actionId: selectedAction?.ID || 0,
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
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Actions</Typography>
      {error && (
        <Alert severity="error" data-testid="error-message" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <ActionList
            actions={actions}
            selectedAction={selectedAction}
            onSelectAction={handleSelectAction}
            onDeleteAction={handleDeleteAction}
          />
        </Grid>

        <Grid item xs={12} md={8}>
          {selectedAction && (
            <JobList
              jobs={jobs}
              onAddJob={() => handleOpenJobDialog()}
              onEditJob={(job) => handleOpenJobDialog(job)}
              onDeleteJob={(jobId) => setJobs(jobs.filter(j => j.ID !== jobId))}
            />
          )}
        </Grid>
      </Grid>

      <ActionForm
        open={openActionDialog}
        onClose={() => setOpenActionDialog(false)}
        onSave={handleSaveAction}
        loading={loading}
        actionData={actionFormData}
        setActionData={setActionFormData}
      />

      <JobForm
        open={openJobDialog}
        onClose={handleCloseJobDialog}
        onSave={handleSaveJob}
        jobFormData={jobFormData}
        setJobFormData={setJobFormData}
        jobTemplateOptions={jobTemplateOptions}
        isEditing={!!editingJob}
      />
    </Box>
  );
};

export default ActionJobManager; 
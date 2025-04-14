import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import JobForm from './JobForm';
import jobService from '../../services/job.service';
import actionService from '../../services/action.service';
import { JobFormData, JobTemplateOption } from './types';
import { Action } from '../../services/action.service';
import { Condition } from './ConditionsManager';
import { Job } from '../../services/job.service';

const JobFormPage: React.FC = () => {
  const { actionId, jobId } = useParams<{ actionId: string; jobId: string }>();
  const navigate = useNavigate();
  const [action, setAction] = useState<Action | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobTemplateOptions, setJobTemplateOptions] = useState<JobTemplateOption[]>([]);
  const [availableJobIds, setAvailableJobIds] = useState<number[]>([]);
  const [jobFormData, setJobFormData] = useState<JobFormData>({
    name: '',
    type: 'http', // Default to http
    inputType: 'static_input',
    inputValue: '{}',
    actionId: 0,
    jobTemplateId: 0,
    isRootJob: false,
    condition: {
      version: 1,
      rules: []
    },
    jobTimeoutInSecs: 300
  });

  const isEditing = !!jobId;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!actionId) {
          setError('Action ID is required');
          return;
        }

        // Convert actionId to a number
        const actId = parseInt(actionId);

        // Fetch the action to validate it exists
        const fetchedAction = await actionService.getAction(actId);
        setAction(fetchedAction);

        // Fetch job templates
        const templates = await jobService.getJobTemplates();
        const options = templates.map(template => ({
          id: template.ID,
          name: template.name
        }));
        setJobTemplateOptions(options);

        // Fetch all jobs for this action to get available job IDs
        const jobs = await jobService.getJobs(actId);
        const jobIds = jobs
          .map((job: Job) => job.ID)
          .filter((id: number) => !jobId || id !== parseInt(jobId)); // Exclude current job if editing
        setAvailableJobIds(jobIds);

        // If editing, fetch job details
        if (jobId) {
          try {
            const job = await jobService.getJob(parseInt(jobId));
            // Parse the condition string into a Condition object
            let condition: Condition;
            try {
              condition = JSON.parse(job.condition);
            } catch (e) {
              // If parsing fails, use default condition
              condition = {
                version: 1,
                rules: []
              };
            }
            setJobFormData({
              name: job.name,
              type: job.job_type || 'http',
              inputType: job.job_input_type,
              inputValue: job.job_input_value,
              actionId: actId,
              jobTemplateId: job.job_template_id,
              isRootJob: job.is_root_job,
              condition,
              jobTimeoutInSecs: job.job_timeout_in_secs
            });
          } catch (error) {
            setError('Failed to load job details');
          }
        } else {
          // For new jobs, just set the action ID
          setJobFormData(prev => ({ ...prev, actionId: actId }));
        }
      } catch (error) {
        setError('Failed to load required data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [actionId, jobId]);

  const handleSaveJob = async () => {
    setSaving(true);
    try {
      const jobData = {
        name: jobFormData.name,
        job_type: jobFormData.type,
        job_input_type: jobFormData.inputType,
        job_input_value: jobFormData.inputValue,
        action_id: jobFormData.actionId,
        job_template_id: jobFormData.jobTemplateId,
        is_root_job: jobFormData.isRootJob,
        condition: JSON.stringify(jobFormData.condition),
        job_timeout_in_secs: jobFormData.jobTimeoutInSecs
      };

      if (isEditing && jobId) {
        await jobService.updateJob(parseInt(jobId), jobData);
      } else {
        await jobService.createJob(jobData);
      }

      // Navigate back to the action detail page
      navigate(`/actions/${actionId}`);
    } catch (error) {
      if (error instanceof Error) {
        setError(`Failed to save job: ${error.message}`);
      } else {
        setError('Failed to save job');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/actions/${actionId}`);
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
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleCancel}
        sx={{ mb: 3 }}
      >
        Back to Action
      </Button>

      <Typography variant="h5" sx={{ mb: 3 }}>
        {isEditing ? 'Edit Job' : 'Create New Job'}
        {action && ` for ${action.name}`}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <JobForm
          onSave={handleSaveJob}
          onCancel={handleCancel}
          jobFormData={jobFormData}
          setJobFormData={setJobFormData}
          jobTemplateOptions={jobTemplateOptions}
          isEditing={isEditing}
          actionId={parseInt(actionId || '0')}
          availableJobIds={availableJobIds}
        />
      </Paper>
      
      {saving && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default JobFormPage; 
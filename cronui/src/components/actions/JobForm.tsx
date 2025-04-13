import React from 'react';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Box,
  Paper
} from '@mui/material';
import { JobFormData, JobTemplateOption } from './types';

interface JobFormProps {
  onSave: () => void;
  onCancel: () => void;
  jobFormData: JobFormData;
  setJobFormData: (data: JobFormData | ((prev: JobFormData) => JobFormData)) => void;
  jobTemplateOptions: JobTemplateOption[];
  isEditing: boolean;
  actionId: number;
}

const JobForm: React.FC<JobFormProps> = ({
  onSave,
  onCancel,
  jobFormData,
  setJobFormData,
  jobTemplateOptions,
  isEditing,
  actionId
}) => {
  const updateFormData = (updates: Partial<JobFormData>) => {
    setJobFormData(prev => ({
      ...prev,
      ...updates,
      actionId // Always include the current actionId
    }));
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              id="job-name"
              label="Job Name"
              value={jobFormData.name}
              onChange={e => updateFormData({ name: e.target.value })}
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
                onChange={e => updateFormData({ type: e.target.value })}
                inputProps={{ "data-testid": "job-type-select" }}
              >
                <MenuItem value="http">HTTP</MenuItem>
                <MenuItem value="slack">Slack</MenuItem>
                <MenuItem value="logger">Logger</MenuItem>
                <MenuItem value="docker-registry">Docker Registry</MenuItem>
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
                onChange={e => updateFormData({ inputType: e.target.value })}
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
              onChange={e => updateFormData({ inputValue: e.target.value })}
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
                  const selectedTemplate = jobTemplateOptions.find(template => template.id === templateId);
                  if (selectedTemplate) {
                    updateFormData({
                      jobTemplateId: templateId,
                      type: selectedTemplate.type || jobFormData.type,
                      inputType: selectedTemplate.inputType || jobFormData.inputType,
                      inputValue: selectedTemplate.inputValue || jobFormData.inputValue
                    });
                  } else {
                    updateFormData({ jobTemplateId: templateId });
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
              onChange={e => updateFormData({ jobTimeoutInSecs: Number(e.target.value) })}
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
                  onChange={e => updateFormData({ isRootJob: e.target.checked })}
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
              onChange={e => updateFormData({ condition: e.target.value })}
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
              onChange={e => updateFormData({ proceedCondition: e.target.value })}
              fullWidth
              margin="normal"
              inputProps={{ "data-testid": "proceed-condition-input" }}
            />
          </Grid>
        </Grid>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button onClick={onCancel} sx={{ mr: 1 }}>Cancel</Button>
        <Button onClick={onSave} variant="contained" color="primary" data-testid="save-job-button">
          Save Job
        </Button>
      </Box>
    </Box>
  );
};

export default JobForm; 
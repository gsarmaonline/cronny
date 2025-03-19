import React from 'react';
import {
  Button,
  Card,
  CardContent,
  IconButton,
  Typography
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Job } from './types';

interface JobListProps {
  jobs: Job[];
  onAddJob: () => void;
  onEditJob: (job: Job) => void;
  onDeleteJob: (jobId: number) => void;
}

const JobList: React.FC<JobListProps> = ({
  jobs,
  onAddJob,
  onEditJob,
  onDeleteJob
}) => {
  return (
    <>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={onAddJob}
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
              onClick={() => onEditJob(job)}
              data-testid={`edit-job-${job.ID}`}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              onClick={() => onDeleteJob(job.ID)}
              data-testid={`delete-job-${job.ID}`}
            >
              <DeleteIcon />
            </IconButton>
          </CardContent>
        </Card>
      ))}
      {jobs.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No jobs available for this action
        </Typography>
      )}
    </>
  );
};

export default JobList; 
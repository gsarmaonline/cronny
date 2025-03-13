import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import jobService, { Job, JobExecution } from '../../services/job.service';

const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchJob(parseInt(id));
  }, [id]);

  const fetchJob = async (jobId: number) => {
    setLoading(true);
    setError('');
    try {
      const fetchedJob = await jobService.getJob(jobId);
      setJob(fetchedJob);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch job details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!job) return;
    
    if (window.confirm(`Are you sure you want to delete "${job.name}"?`)) {
      try {
        await jobService.deleteJob(job.ID);
        navigate('/jobs');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete job');
        console.error(err);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const prettyPrintJson = (jsonString: string) => {
    try {
      const obj = JSON.parse(jsonString);
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return jsonString;
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
    
    return <Chip label={type} color={color} />;
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
          component={Link}
          to="/jobs"
          sx={{ mb: 2 }}
        >
          Back to Jobs
        </Button>
        <Paper sx={{ p: 3 }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      </Box>
    );
  }

  if (!job) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          component={Link}
          to="/jobs"
          sx={{ mb: 2 }}
        >
          Back to Jobs
        </Button>
        <Paper sx={{ p: 3 }}>
          <Typography>Job not found</Typography>
        </Paper>
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
          <Typography variant="h5">{job.name}</Typography>
        </Box>
        <Box>
          <Tooltip title="Edit Job">
            <IconButton
              color="primary"
              component={Link}
              to={`/jobs/edit/${job.ID}`}
              sx={{ mr: 1 }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Job">
            <IconButton
              color="error"
              onClick={handleDelete}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Job Details</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">ID</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">{job.ID}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Type</Typography>
                </Grid>
                <Grid item xs={8}>
                  {getJobTypeChip(job.job_type)}
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Input Type</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">{job.job_input_type}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Root Job</Typography>
                </Grid>
                <Grid item xs={8}>
                  {job.is_root_job ? 
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                      <Typography>Yes</Typography>
                    </Box> : 
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CancelIcon color="error" sx={{ mr: 1 }} />
                      <Typography>No</Typography>
                    </Box>
                  }
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Action ID</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">{job.action_id}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Template ID</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">{job.job_template_id}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Timeout (seconds)</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">{job.job_timeout_in_secs}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Metadata</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Created At</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">{formatDate(job.CreatedAt)}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Updated At</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">{formatDate(job.UpdatedAt)}</Typography>
                </Grid>
                
                {job.DeletedAt && (
                  <>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Deleted At</Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography variant="body1">{formatDate(job.DeletedAt)}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Input Value</Typography>
              <Divider sx={{ mb: 2 }} />
              <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {prettyPrintJson(job.job_input_value)}
                </pre>
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        {job.condition && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Condition</Typography>
                <Divider sx={{ mb: 2 }} />
                <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {prettyPrintJson(job.condition)}
                  </pre>
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        )}

        {job.job_executions && job.job_executions.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Executions</Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Start Time</TableCell>
                        <TableCell>Stop Time</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Output</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {job.job_executions.map((execution: JobExecution) => {
                        const startTime = new Date(execution.execution_start_time);
                        const stopTime = new Date(execution.execution_stop_time);
                        const durationMs = stopTime.getTime() - startTime.getTime();
                        const durationSec = Math.round(durationMs / 1000);
                        
                        return (
                          <TableRow key={execution.ID}>
                            <TableCell>{execution.ID}</TableCell>
                            <TableCell>{formatDate(execution.execution_start_time)}</TableCell>
                            <TableCell>{formatDate(execution.execution_stop_time)}</TableCell>
                            <TableCell>{durationSec} seconds</TableCell>
                            <TableCell>
                              <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                  <Typography variant="body2">View Output</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                      {prettyPrintJson(execution.output)}
                                    </pre>
                                  </Paper>
                                </AccordionDetails>
                              </Accordion>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default JobDetail;
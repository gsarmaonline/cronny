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
  DialogTitle
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import scheduleService, { Schedule } from '../../services/schedule.service';

// This will also require the action service to get action options
import actionService from '../../services/action.service';

interface ActionOption {
  id: number;
  name: string;
}

const ScheduleForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Check if we're in create mode (path is /schedules/new) or edit mode (path is /schedules/:id)
  const isCreateMode = id === "new";
  const isEditMode = !!id && !isCreateMode;
  
  // Form state
  const [name, setName] = useState('');
  const [scheduleType, setScheduleType] = useState<number>(3); // Default to Relative (3)
  const [scheduleValue, setScheduleValue] = useState('');
  const [scheduleUnit, setScheduleUnit] = useState('second');
  const [actionId, setActionId] = useState<number | ''>('');
  const [endsAt, setEndsAt] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [actionOptions, setActionOptions] = useState<ActionOption[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Validation state
  const [nameError, setNameError] = useState('');
  const [scheduleValueError, setScheduleValueError] = useState('');
  const [actionIdError, setActionIdError] = useState('');

  useEffect(() => {
    // Load actions for the dropdown
    fetchActions();
    
    // If we're in edit mode, load the schedule
    if (isEditMode) {
      fetchSchedule();
    }
  }, [id, isEditMode]);

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

  const fetchSchedule = async () => {
    if (!id) return;
    
    setLoading(true);
    setError('');
    
    try {
      const scheduleId = parseInt(id);
      const schedule = await scheduleService.getSchedule(scheduleId);
      
      // Populate form with schedule data
      setName(schedule.name);
      setScheduleType(schedule.schedule_type);
      setScheduleValue(schedule.schedule_value);
      setScheduleUnit(schedule.schedule_unit);
      setActionId(schedule.action_id);
      setEndsAt(schedule.ends_at || '');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch schedule');
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
    
    // Validate schedule value
    if (!scheduleValue.trim()) {
      setScheduleValueError('Value is required');
      isValid = false;
    } else if (scheduleType === 1) { // Absolute - validate date format
      try {
        const date = new Date(scheduleValue);
        if (isNaN(date.getTime())) {
          setScheduleValueError('Invalid date format. Use ISO format (e.g., 2023-12-31T12:00:00Z)');
          isValid = false;
        } else {
          setScheduleValueError('');
        }
      } catch (err) {
        setScheduleValueError('Invalid date format');
        isValid = false;
      }
    } else if (scheduleType === 3) { // Relative - validate number
      if (isNaN(Number(scheduleValue))) {
        setScheduleValueError('Value must be a number');
        isValid = false;
      } else {
        setScheduleValueError('');
      }
    } else {
      setScheduleValueError('');
    }
    
    // Validate action ID
    if (!actionId) {
      setActionIdError('Action is required');
      isValid = false;
    } else {
      setActionIdError('');
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
      const scheduleData: Partial<Schedule> = {
        name,
        schedule_type: scheduleType,
        schedule_value: scheduleValue,
        schedule_unit: scheduleUnit,
        action_id: actionId as number,
        schedule_status: 4, // Default to Inactive
      };
      
      if (endsAt) {
        scheduleData.ends_at = endsAt;
      }
      
      if (isEditMode) {
        // Make sure we have a valid ID before attempting to update
        const scheduleId = parseInt(id!);
        if (isNaN(scheduleId)) {
          setError('Invalid schedule ID');
          return;
        }
        await scheduleService.updateSchedule(scheduleId, scheduleData);
      } else {
        // Create new schedule
        await scheduleService.createSchedule(scheduleData);
      }
      
      // Navigate back to the schedules list
      navigate('/schedules');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save schedule');
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
      await scheduleService.deleteSchedule(parseInt(id));
      navigate('/schedules');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete schedule');
      console.error(err);
    } finally {
      setSubmitting(false);
      setDeleteDialogOpen(false);
    }
  };

  const getScheduleTypeLabel = (type: number): string => {
    switch (type) {
      case 1: return 'Absolute';
      case 2: return 'Recurring';
      case 3: return 'Relative';
      default: return 'Unknown';
    }
  };

  const getScheduleValueHelperText = (): string => {
    switch (scheduleType) {
      case 1: // Absolute
        return 'Enter a date in ISO format (e.g., 2023-12-31T12:00:00Z)';
      case 2: // Recurring
        return 'Enter a cron expression (not fully implemented)';
      case 3: // Relative
        return 'Enter a number';
      default:
        return '';
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
            to="/schedules"
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h5">
            {isEditMode ? 'Edit Schedule' : 'Create Schedule'}
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
                <InputLabel>Schedule Type</InputLabel>
                <Select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value as number)}
                  label="Schedule Type"
                >
                  <MenuItem value={1}>{getScheduleTypeLabel(1)}</MenuItem>
                  <MenuItem value={2}>{getScheduleTypeLabel(2)}</MenuItem>
                  <MenuItem value={3}>{getScheduleTypeLabel(3)}</MenuItem>
                </Select>
                <FormHelperText>Select the type of schedule</FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Schedule Value"
                fullWidth
                value={scheduleValue}
                onChange={(e) => setScheduleValue(e.target.value)}
                error={!!scheduleValueError}
                helperText={scheduleValueError || getScheduleValueHelperText()}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Schedule Unit</InputLabel>
                <Select
                  value={scheduleUnit}
                  onChange={(e) => setScheduleUnit(e.target.value)}
                  label="Schedule Unit"
                >
                  <MenuItem value="second">Second</MenuItem>
                  <MenuItem value="minute">Minute</MenuItem>
                  <MenuItem value="hour">Hour</MenuItem>
                  <MenuItem value="day">Day</MenuItem>
                </Select>
                <FormHelperText>The time unit for the schedule</FormHelperText>
              </FormControl>
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
                <FormHelperText>{actionIdError || 'The action to execute'}</FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Ends At (Optional)"
                fullWidth
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                helperText="Leave empty for no end date"
              />
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  component={Link}
                  to="/schedules"
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
            Are you sure you want to delete this schedule? This action cannot be undone.
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

export default ScheduleForm;
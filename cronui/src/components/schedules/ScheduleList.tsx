import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import AddIcon from '@mui/icons-material/Add';
import scheduleService, { Schedule } from '../../services/schedule.service';

const ScheduleList: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedSchedules = await scheduleService.getSchedules();
      setSchedules(fetchedSchedules);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch schedules');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (schedule: Schedule) => {
    setScheduleToDelete(schedule);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!scheduleToDelete) return;

    try {
      await scheduleService.deleteSchedule(scheduleToDelete.ID);
      setSchedules(schedules.filter(s => s.ID !== scheduleToDelete.ID));
      setDeleteDialogOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete schedule');
      console.error(err);
    }
  };

  const handleActivateSchedule = async (id: number) => {
    try {
      await scheduleService.updateSchedule(id, { schedule_status: 1 }); // 1 = PendingScheduleStatus
      fetchSchedules(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to activate schedule');
      console.error(err);
    }
  };

  const handleDeactivateSchedule = async (id: number) => {
    try {
      await scheduleService.updateSchedule(id, { schedule_status: 4 }); // 4 = InactiveScheduleStatus
      fetchSchedules(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deactivate schedule');
      console.error(err);
    }
  };

  const getStatusChip = (status: number) => {
    switch (status) {
      case 1: // PendingScheduleStatus
        return <Chip label="Pending" color="primary" size="small" />;
      case 2: // ProcessingScheduleStatus
        return <Chip label="Processing" color="warning" size="small" />;
      case 3: // ProcessedScheduleStatus
        return <Chip label="Processed" color="success" size="small" />;
      case 4: // InactiveScheduleStatus
        return <Chip label="Inactive" color="default" size="small" />;
      default:
        return <Chip label="Unknown" color="error" size="small" />;
    }
  };

  const getScheduleTypeText = (type: number) => {
    switch (type) {
      case 1:
        return "Absolute";
      case 2:
        return "Recurring";
      case 3:
        return "Relative";
      default:
        return "Unknown";
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
        <Typography variant="h5">Schedules</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to="/schedules/create"
        >
          Create Schedule
        </Button>
      </Box>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {schedules.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>No schedules found. Create your first schedule!</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action ID</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.ID}>
                  <TableCell>{schedule.name}</TableCell>
                  <TableCell>{getScheduleTypeText(schedule.schedule_type)}</TableCell>
                  <TableCell>{schedule.schedule_value}</TableCell>
                  <TableCell>{schedule.schedule_unit}</TableCell>
                  <TableCell>{getStatusChip(schedule.schedule_status)}</TableCell>
                  <TableCell>{schedule.action_id}</TableCell>
                  <TableCell>
                    <IconButton
                      component={Link}
                      to={`/schedules/${schedule.ID}`}
                      size="small"
                      color="primary"
                      title="View details"
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                    
                    <IconButton
                      component={Link}
                      to={`/schedules/edit/${schedule.ID}`}
                      size="small"
                      color="primary"
                      title="Edit schedule"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    
                    {schedule.schedule_status === 4 ? (
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleActivateSchedule(schedule.ID)}
                        title="Activate schedule"
                      >
                        <PlayArrowIcon fontSize="small" />
                      </IconButton>
                    ) : (
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => handleDeactivateSchedule(schedule.ID)}
                        title="Deactivate schedule"
                      >
                        <PauseIcon fontSize="small" />
                      </IconButton>
                    )}
                    
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(schedule)}
                      title="Delete schedule"
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

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the schedule "{scheduleToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScheduleList;
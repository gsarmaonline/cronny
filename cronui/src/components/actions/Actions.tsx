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
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { actionsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Action } from '../../services/action.service';
import { Link } from 'react-router-dom';

interface ApiResponse<T> {
  actions: T;
  message: string;
}

interface AxiosResponse<T> {
  data: T;
}

export const Actions: React.FC = () => {
  const { user } = useAuth();
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    user_id: 0,
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, user_id: user.id }));
      fetchActions();
    }
  }, [user]);

  const fetchActions = async () => {
    try {
      const response = await actionsApi.getActions();
      if (response && response.data && response.data.actions) {
        setActions(response.data.actions);
      } else {
        setError('Invalid response format from server');
        setActions([]);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch actions');
      setActions([]);
      setLoading(false);
    }
  };

  const handleOpenDialog = (action?: Action) => {
    if (action) {
      setEditingAction(action);
      setFormData({
        name: action.name,
        description: action.description || '',
        user_id: user?.id || 0,
      });
    } else {
      setEditingAction(null);
      setFormData({
        name: '',
        description: '',
        user_id: user?.id || 0,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAction(null);
    setFormData({
      name: '',
      description: '',
      user_id: user?.id || 0,
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      if (editingAction) {
        await actionsApi.updateAction(editingAction.ID, formData);
      } else {
        await actionsApi.createAction(formData);
      }
      fetchActions();
      handleCloseDialog();
    } catch (err) {
      console.error('Error submitting action:', err);
      setError(editingAction ? 'Failed to update action' : 'Failed to create action');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this action?')) {
      try {
        await actionsApi.deleteAction(id);
        fetchActions();
      } catch (err) {
        setError('Failed to delete action');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Actions</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Action
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {actions.map((action) => (
          <Grid item xs={12} sm={6} md={4} key={action.ID}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography 
                      variant="h6" 
                      component={Link} 
                      to={`/actions/${action.ID}`}
                      sx={{ 
                        textDecoration: 'none',
                        color: 'inherit',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {action.name}
                    </Typography>
                    {action.description && (
                      <Typography color="textSecondary" variant="body2">
                        {action.description}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <IconButton onClick={() => handleOpenDialog(action)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(action.ID)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editingAction ? 'Edit Action' : 'New Action'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={4}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingAction ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 
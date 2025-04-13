import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Container,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import actionService from '../../services/action.service';
import { useAuth } from '../../contexts/AuthContext';
import { Action } from '../../services/action.service';

const ActionForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Action>>({
    name: '',
    description: '',
    user_id: user?.id || 0,
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      fetchActionData();
    }
  }, [id]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, user_id: user.id }));
    }
  }, [user]);

  const fetchActionData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const action = await actionService.getAction(parseInt(id));
      setFormData({
        name: action.name,
        description: action.description || '',
        user_id: action.user_id,
      });
    } catch (err) {
      console.error('Error fetching action:', err);
      setError('Failed to load action data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('User not authenticated');
      return;
    }

    // Validation
    if (!formData.name) {
      setError('Action name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditMode && id) {
        await actionService.updateAction(parseInt(id), formData);
      } else {
        await actionService.createAction(formData);
      }
      navigate('/actions');
    } catch (err) {
      console.error('Error saving action:', err);
      setError('Failed to save action');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/actions')}
          sx={{ mb: 2 }}
        >
          Back to Actions
        </Button>
        <Typography variant="h5" component="h1" gutterBottom>
          {isEditMode ? 'Edit Action' : 'Create New Action'}
        </Typography>
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
                fullWidth
                required
                label="Action Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                variant="outlined"
                inputProps={{ "data-testid": "action-name-input" }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                variant="outlined"
                multiline
                rows={4}
                inputProps={{ "data-testid": "action-description-input" }}
              />
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/actions')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                data-testid="save-action-button"
              >
                {isSubmitting ? <CircularProgress size={24} /> : isEditMode ? 'Update Action' : 'Create Action'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default ActionForm; 
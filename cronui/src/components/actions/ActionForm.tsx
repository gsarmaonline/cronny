import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  CircularProgress
} from '@mui/material';
import { ActionFormData } from './types';

interface ActionFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  loading: boolean;
  actionData: ActionFormData;
  setActionData: (data: ActionFormData) => void;
}

const ActionForm: React.FC<ActionFormProps> = ({
  open,
  onClose,
  onSave,
  loading,
  actionData,
  setActionData
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Create New Action</DialogTitle>
      <DialogContent>
        <TextField
          label="Action Name"
          value={actionData.name}
          onChange={e => setActionData({ ...actionData, name: e.target.value })}
          fullWidth
          margin="normal"
          inputProps={{ "data-testid": "new-action-name-input" }}
        />
        <TextField
          label="Description"
          value={actionData.description}
          onChange={e => setActionData({ ...actionData, description: e.target.value })}
          fullWidth
          margin="normal"
          multiline
          rows={3}
          inputProps={{ "data-testid": "new-action-description-input" }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onSave}
          variant="contained"
          color="primary"
          disabled={loading}
          data-testid="save-new-action-button"
        >
          {loading ? <CircularProgress size={24} /> : 'Create Action'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActionForm; 
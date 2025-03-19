import React from 'react';
import {
  Box,
  ButtonBase,
  IconButton,
  List,
  Paper,
  Typography
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Action } from './types';

interface ActionListProps {
  actions: Action[];
  selectedAction: Action | null;
  onSelectAction: (action: Action) => void;
  onDeleteAction: (actionId: number) => void;
}

const ActionList: React.FC<ActionListProps> = ({
  actions,
  selectedAction,
  onSelectAction,
  onDeleteAction
}) => {
  return (
    <List>
      {Array.isArray(actions) && actions.map((action) => (
        action && action.ID ? (
          <Paper
            key={action.ID}
            elevation={selectedAction?.ID === action.ID ? 3 : 1}
            sx={{ mb: 1 }}
          >
            <ButtonBase
              onClick={() => onSelectAction(action)}
              sx={{
                width: '100%',
                textAlign: 'left',
                p: 2,
                bgcolor: selectedAction?.ID === action.ID ? 'action.selected' : 'background.paper'
              }}
              data-testid={`action-item-${action.ID}`}
            >
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1">{action.name || 'Unnamed Action'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description || 'No description'}
                </Typography>
              </Box>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteAction(action.ID);
                }}
                data-testid={`delete-action-${action.ID}`}
                sx={{ ml: 1 }}
              >
                <DeleteIcon />
              </IconButton>
            </ButtonBase>
          </Paper>
        ) : null
      ))}
      {(!Array.isArray(actions) || actions.length === 0) && (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          No actions available
        </Typography>
      )}
    </List>
  );
};

export default ActionList; 
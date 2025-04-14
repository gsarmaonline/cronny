import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export type ComparisonType = 'equality' | 'greater_than' | 'lesser_than';

export interface Filter {
  name: string;
  shouldMatch: boolean;
  comparisonType: ComparisonType;
  value: string;
}

export interface ConditionRule {
  filters: Filter[];
  jobId: number;
}

export interface Condition {
  version: number;
  rules: ConditionRule[];
}

interface ConditionsManagerProps {
  value: Condition;
  onChange: (condition: Condition) => void;
  availableJobIds: number[];
}

const defaultCondition: Condition = {
  version: 1,
  rules: []
};

const ConditionsManager: React.FC<ConditionsManagerProps> = ({
  value,
  onChange,
  availableJobIds,
}) => {
  const [selectedRuleIndex, setSelectedRuleIndex] = useState<number>(0);
  const [condition, setCondition] = useState<Condition>(defaultCondition);

  useEffect(() => {
    // Ensure value is a valid Condition object
    if (!value || !Array.isArray(value.rules)) {
      setCondition(defaultCondition);
      onChange(defaultCondition);
    } else {
      setCondition(value);
    }
  }, [value, onChange]);

  const handleAddRule = () => {
    const newRule: ConditionRule = {
      filters: [],
      jobId: availableJobIds[0] || 0,
    };
    const newCondition = {
      ...condition,
      rules: [...condition.rules, newRule],
    };
    setCondition(newCondition);
    onChange(newCondition);
    setSelectedRuleIndex(condition.rules.length);
  };

  const handleDeleteRule = (index: number) => {
    const newRules = condition.rules.filter((_, i) => i !== index);
    const newCondition = {
      ...condition,
      rules: newRules,
    };
    setCondition(newCondition);
    onChange(newCondition);
    if (selectedRuleIndex >= newRules.length) {
      setSelectedRuleIndex(Math.max(0, newRules.length - 1));
    }
  };

  const handleAddFilter = (ruleIndex: number) => {
    const newFilter: Filter = {
      name: '',
      shouldMatch: true,
      comparisonType: 'equality',
      value: '',
    };
    const newRules = [...condition.rules];
    newRules[ruleIndex].filters = [...newRules[ruleIndex].filters, newFilter];
    const newCondition = {
      ...condition,
      rules: newRules,
    };
    setCondition(newCondition);
    onChange(newCondition);
  };

  const handleDeleteFilter = (ruleIndex: number, filterIndex: number) => {
    const newRules = [...condition.rules];
    newRules[ruleIndex].filters = newRules[ruleIndex].filters.filter((_, i) => i !== filterIndex);
    const newCondition = {
      ...condition,
      rules: newRules,
    };
    setCondition(newCondition);
    onChange(newCondition);
  };

  const handleUpdateFilter = (
    ruleIndex: number,
    filterIndex: number,
    field: keyof Filter,
    value: any
  ) => {
    const newRules = [...condition.rules];
    newRules[ruleIndex].filters[filterIndex] = {
      ...newRules[ruleIndex].filters[filterIndex],
      [field]: value,
    };
    const newCondition = {
      ...condition,
      rules: newRules,
    };
    setCondition(newCondition);
    onChange(newCondition);
  };

  const handleUpdateJobId = (ruleIndex: number, jobId: number) => {
    const newRules = [...condition.rules];
    newRules[ruleIndex].jobId = jobId;
    const newCondition = {
      ...condition,
      rules: newRules,
    };
    setCondition(newCondition);
    onChange(newCondition);
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Condition Rules</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddRule}
          data-testid="add-rule-button"
        >
          Add Rule
        </Button>
      </Box>

      {condition.rules.map((rule, ruleIndex) => (
        <Card key={ruleIndex} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">Rule {ruleIndex + 1}</Typography>
              <IconButton
                onClick={() => handleDeleteRule(ruleIndex)}
                data-testid={`delete-rule-${ruleIndex}-button`}
              >
                <DeleteIcon />
              </IconButton>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Next Job</InputLabel>
                  <Select
                    value={rule.jobId}
                    label="Next Job"
                    onChange={(e) => handleUpdateJobId(ruleIndex, Number(e.target.value))}
                    data-testid={`rule-${ruleIndex}-job-select`}
                  >
                    {availableJobIds.map((id) => (
                      <MenuItem key={id} value={id}>
                        Job {id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">Filters</Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => handleAddFilter(ruleIndex)}
                    data-testid={`add-filter-${ruleIndex}-button`}
                  >
                    Add Filter
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {rule.filters.map((filter, filterIndex) => (
                  <Box key={filterIndex} sx={{ mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={3}>
                        <TextField
                          fullWidth
                          label="Field Name"
                          value={filter.name}
                          onChange={(e) => handleUpdateFilter(ruleIndex, filterIndex, 'name', e.target.value)}
                          data-testid={`filter-${ruleIndex}-${filterIndex}-name`}
                        />
                      </Grid>
                      <Grid item xs={2}>
                        <FormControl fullWidth>
                          <InputLabel>Comparison</InputLabel>
                          <Select
                            value={filter.comparisonType}
                            label="Comparison"
                            onChange={(e) => handleUpdateFilter(ruleIndex, filterIndex, 'comparisonType', e.target.value)}
                            data-testid={`filter-${ruleIndex}-${filterIndex}-comparison`}
                          >
                            <MenuItem value="equality">Equals</MenuItem>
                            <MenuItem value="greater_than">Greater Than</MenuItem>
                            <MenuItem value="lesser_than">Less Than</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={3}>
                        <TextField
                          fullWidth
                          label="Value"
                          value={filter.value}
                          onChange={(e) => handleUpdateFilter(ruleIndex, filterIndex, 'value', e.target.value)}
                          data-testid={`filter-${ruleIndex}-${filterIndex}-value`}
                        />
                      </Grid>
                      <Grid item xs={2}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={filter.shouldMatch}
                              onChange={(e) => handleUpdateFilter(ruleIndex, filterIndex, 'shouldMatch', e.target.checked)}
                              data-testid={`filter-${ruleIndex}-${filterIndex}-should-match`}
                            />
                          }
                          label="Should Match"
                        />
                      </Grid>
                      <Grid item xs={2}>
                        <IconButton
                          onClick={() => handleDeleteFilter(ruleIndex, filterIndex)}
                          data-testid={`delete-filter-${ruleIndex}-${filterIndex}-button`}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default ConditionsManager; 
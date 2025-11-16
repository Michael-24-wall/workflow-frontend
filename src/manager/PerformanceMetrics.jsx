// src/components/dashboard/PerformanceMetrics.jsx
import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  LinearProgress,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const PerformanceMetrics = ({ overview, teamManagement, isLoading }) => {
  // Use real data from backend
  const performanceData = [
    { 
      label: 'Team Performance', 
      value: overview.team_performance || 0, 
      color: 'primary',
      icon: <TrendingUpIcon />
    },
    { 
      label: 'Budget Utilization', 
      value: overview.budget_utilization || 0, 
      color: 'secondary',
      icon: <AssessmentIcon />
    },
    { 
      label: 'Operational Efficiency', 
      value: overview.operational_efficiency || 0, 
      color: 'success',
      icon: <CheckCircleIcon />
    },
    { 
      label: 'Team Capacity', 
      value: overview.team_capacity || 0, 
      color: 'info',
      icon: <GroupIcon />
    }
  ];

  if (isLoading) {
    return (
      <Paper className="section-paper">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper className="section-paper">
          <Typography variant="h6" gutterBottom className="section-title">
            Performance Metrics
          </Typography>
          
          <Grid container spacing={3}>
            {performanceData.map((metric, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card variant="outlined" className="metric-card">
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Box color={`${metric.color}.main`} mr={1}>
                        {metric.icon}
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        {metric.label}
                      </Typography>
                    </Box>
                    <Typography variant="h4" className="metric-value" color={`${metric.color}.main`}>
                      {metric.value}%
                    </Typography>
                    <Box mt={2}>
                      <LinearProgress 
                        variant="determinate" 
                        value={metric.value} 
                        color={metric.color}
                        className="metric-progress"
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>

      {/* Daily Operations - REAL DATA */}
      {overview.daily_operations && (
        <Grid item xs={12} md={6}>
          <Paper className="section-paper">
            <Typography variant="h6" gutterBottom className="section-title">
              Daily Operations
            </Typography>
            <Box className="operations-metrics">
              <div className="operation-item">
                <span className="operation-label">Tasks Assigned:</span>
                <span className="operation-value">{overview.daily_operations.tasks_assigned || 0}</span>
              </div>
              <div className="operation-item">
                <span className="operation-label">Tasks Completed:</span>
                <span className="operation-value">{overview.daily_operations.tasks_completed || 0}</span>
              </div>
              <div className="operation-item">
                <span className="operation-label">Completion Rate:</span>
                <span className="operation-value">
                  {overview.daily_operations.tasks_assigned ? 
                    Math.round((overview.daily_operations.tasks_completed / overview.daily_operations.tasks_assigned) * 100) : 0
                  }%
                </span>
              </div>
              <div className="operation-item">
                <span className="operation-label">Pending Approvals:</span>
                <span className="operation-value">{overview.daily_operations.pending_approvals || 0}</span>
              </div>
            </Box>
          </Paper>
        </Grid>
      )}

      {/* Management Tasks - REAL DATA */}
      <Grid item xs={12} md={6}>
        <Paper className="section-paper">
          <Typography variant="h6" gutterBottom className="section-title">
            Management Tasks
          </Typography>
          <Box className="task-list">
            {teamManagement.pending_approvals > 0 && (
              <div className="task-item urgent">
                <AssessmentIcon color="warning" />
                <Box>
                  <Typography variant="body2">
                    {teamManagement.pending_approvals} pending approvals
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Requires immediate attention
                  </Typography>
                </Box>
              </div>
            )}
            {teamManagement.performance_reviews > 0 && (
              <div className="task-item">
                <TrendingUpIcon color="info" />
                <Box>
                  <Typography variant="body2">
                    {teamManagement.performance_reviews} performance reviews due
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Schedule with team members
                  </Typography>
                </Box>
              </div>
            )}
            {teamManagement.training_requirements > 0 && (
              <div className="task-item">
                <GroupIcon color="success" />
                <Box>
                  <Typography variant="body2">
                    {teamManagement.training_requirements} training requirements
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Plan training sessions
                  </Typography>
                </Box>
              </div>
            )}
            {!teamManagement.pending_approvals && !teamManagement.performance_reviews && !teamManagement.training_requirements && (
              <Typography variant="body2" color="textSecondary" align="center">
                No pending management tasks
              </Typography>
            )}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default PerformanceMetrics;
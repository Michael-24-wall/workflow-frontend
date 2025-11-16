// src/components/dashboard/TeamManagement.jsx
import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Box,
  Avatar,
  Button
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

const TeamManagement = ({ teamMembers, teamManagement, isLoading }) => {
  if (isLoading) {
    return (
      <Paper className="section-paper">
        <Typography>Loading team data...</Typography>
      </Paper>
    );
  }

  const getRoleColor = (role) => {
    const roleColors = {
      'owner': 'error',
      'admin': 'warning',
      'manager': 'primary',
      'assistant_manager': 'secondary',
      'member': 'default',
      'senior': 'success',
      'junior': 'info',
      'executive': 'error',
      'finance': 'success',
      'hr': 'info',
      'social_worker': 'secondary'
    };
    return roleColors[role?.toLowerCase()] || 'default';
  };

  const formatUserName = (member) => {
    if (member.name) return member.name;
    if (member.user?.first_name || member.user?.last_name) {
      return `${member.user.first_name || ''} ${member.user.last_name || ''}`.trim();
    }
    return member.user?.username || member.user?.email || 'Unknown User';
  };

  const formatUserEmail = (member) => {
    return member.user?.email || member.email || 'No email';
  };

  const formatUserRole = (member) => {
    return member.role || member.user?.role || 'member';
  };

  const formatDepartment = (member) => {
    return member.department || member.user?.department || 'General';
  };

  return (
    <Paper className="section-paper">
      <Box className="section-header">
        <Typography variant="h6" className="section-title">
          Team Members ({teamMembers.length})
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Direct reports and team composition
        </Typography>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Team Member</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teamMembers.length > 0 ? (
              teamMembers.map((member, index) => (
                <TableRow key={member.id || member.user?.id || index} className="team-member-row">
                  <TableCell>
                    <Box className="member-info">
                      <Avatar className="member-avatar">
                        {formatUserName(member).charAt(0).toUpperCase()}
                      </Avatar>
                      <Box className="member-details">
                        <Typography variant="subtitle2">
                          {formatUserName(member)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {member.position || formatUserRole(member)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={formatUserRole(member)} 
                      size="small"
                      color={getRoleColor(formatUserRole(member))}
                    />
                  </TableCell>
                  <TableCell>
                    {formatDepartment(member)}
                  </TableCell>
                  <TableCell>
                    <Box className="email-cell">
                      <EmailIcon fontSize="small" />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {formatUserEmail(member)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={member.is_active === false ? "Inactive" : "Active"} 
                      size="small"
                      color={member.is_active === false ? "default" : "success"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" title="View Details">
                      <ViewIcon />
                    </IconButton>
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" className="empty-state">
                  <Typography variant="body2" color="textSecondary">
                    No team members found in your organization
                  </Typography>
                  <Button variant="outlined" sx={{ mt: 1 }}>
                    Invite Team Members
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Team Management Summary - REAL DATA */}
      {teamManagement && Object.keys(teamManagement).length > 0 && (
        <Box className="management-summary" mt={3}>
          <Typography variant="h6" gutterBottom>
            Management Summary
          </Typography>
          <Box className="summary-stats">
            {teamManagement.pending_approvals > 0 && (
              <div className="summary-item">
                <span className="summary-label">Pending Approvals:</span>
                <span className="summary-value">{teamManagement.pending_approvals}</span>
              </div>
            )}
            {teamManagement.performance_reviews > 0 && (
              <div className="summary-item">
                <span className="summary-label">Performance Reviews:</span>
                <span className="summary-value">{teamManagement.performance_reviews}</span>
              </div>
            )}
            {teamManagement.training_requirements > 0 && (
              <div className="summary-item">
                <span className="summary-label">Training Requirements:</span>
                <span className="summary-value">{teamManagement.training_requirements}</span>
              </div>
            )}
            {teamManagement.daily_operations && (
              <div className="summary-item">
                <span className="summary-label">Daily Tasks Completed:</span>
                <span className="summary-value">
                  {teamManagement.daily_operations.tasks_completed || 0}/
                  {teamManagement.daily_operations.tasks_assigned || 0}
                </span>
              </div>
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default TeamManagement;
// src/components/dashboard/QuickActions.jsx
import React, { useState } from "react";
import {
  Paper,
  Typography,
  Grid,
  Button,
  Box,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Chip,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Email as EmailIcon,
  PersonAdd as PersonAddIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Rocket as RocketIcon,
} from "@mui/icons-material";
import useAuthStore from "../../../stores/authStore";

const QuickActions = ({ teamManagement, onActionComplete, isLoading }) => {
  const {
    user,
    organization,
    calculateLoan,
    calculateInvestment,
    getDashboard,
  } = useAuthStore();

  const [activeAction, setActiveAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [trainingDialog, setTrainingDialog] = useState(false);

  // Action handlers
  const handleQuickAction = async (actionType, data = {}) => {
    setActionLoading(true);
    setActionResult(null);

    try {
      let result;

      switch (actionType) {
        case "approve_requests":
          result = await handleApproveRequests(data);
          break;
        case "schedule_reviews":
          result = await handleScheduleReviews(data);
          break;
        case "assign_training":
          result = await handleAssignTraining(data);
          break;
        case "send_announcement":
          result = await handleSendAnnouncement(data);
          break;
        case "generate_report":
          result = await handleGenerateReport(data);
          break;
        case "team_meeting":
          result = await handleScheduleTeamMeeting(data);
          break;
        default:
          result = { success: false, error: "Unknown action" };
      }

      setActionResult(result);

      if (result.success) {
        // Refresh dashboard data
        setTimeout(() => {
          onActionComplete?.();
        }, 1000);
      }
    } catch (error) {
      setActionResult({ success: false, error: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Mock action implementations - Replace with your actual API calls
  const handleApproveRequests = async (data) => {
    // Replace with actual API call to your backend
    console.log("Approving requests:", data);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      success: true,
      message: `Successfully approved ${data.count || 0} requests`,
      data: { approved: data.count || 0 },
    };
  };

  const handleScheduleReviews = async (data) => {
    console.log("Scheduling reviews:", data);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      success: true,
      message: `Performance reviews scheduled for ${
        data.teamMembers || 0
      } team members`,
      data: { scheduled: data.teamMembers || 0 },
    };
  };

  const handleAssignTraining = async (data) => {
    console.log("Assigning training:", data);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      success: true,
      message: `Training "${data.trainingType}" assigned to team`,
      data: { assigned: true },
    };
  };

  const handleSendAnnouncement = async (data) => {
    console.log("Sending announcement:", data);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      message: "Announcement sent to all team members",
      data: { sent: true },
    };
  };

  const handleGenerateReport = async (data) => {
    console.log("Generating report:", data);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      success: true,
      message: `${data.reportType} report generated successfully`,
      data: { reportUrl: "/reports/team-performance.pdf" },
    };
  };

  const handleScheduleTeamMeeting = async (data) => {
    console.log("Scheduling team meeting:", data);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      message: "Team meeting scheduled and invitations sent",
      data: { scheduled: true },
    };
  };

  // Quick Actions based on real team management data
  const getQuickActions = () => {
    const actions = [
      {
        id: "approve_requests",
        title: "Approve Pending Requests",
        description: "Review and approve team requests",
        icon: <CheckCircleIcon />,
        color: "#2e7d32",
        disabled: !teamManagement?.pending_approvals,
        badge: teamManagement?.pending_approvals || 0,
        dialog: "approve",
      },
      {
        id: "schedule_reviews",
        title: "Schedule Performance Reviews",
        description: "Set up performance evaluation sessions",
        icon: <AssessmentIcon />,
        color: "#ed6c02",
        disabled: !teamManagement?.performance_reviews,
        badge: teamManagement?.performance_reviews || 0,
        dialog: "review",
      },
      {
        id: "assign_training",
        title: "Assign Training",
        description: "Assign required training to team members",
        icon: <GroupIcon />,
        color: "#9c27b0",
        disabled: !teamManagement?.training_requirements,
        badge: teamManagement?.training_requirements || 0,
        dialog: "training",
      },
      {
        id: "send_announcement",
        title: "Send Team Announcement",
        description: "Broadcast important updates to the team",
        icon: <EmailIcon />,
        color: "#1976d2",
        disabled: false,
      },
      {
        id: "generate_report",
        title: "Generate Team Report",
        description: "Create performance and activity reports",
        icon: <TrendingUpIcon />,
        color: "#d32f2f",
        disabled: false,
      },
      {
        id: "team_meeting",
        title: "Schedule Team Meeting",
        description: "Organize team sync and planning session",
        icon: <ScheduleIcon />,
        color: "#00796b",
        disabled: false,
      },
    ];

    return actions;
  };

  const handleActionClick = (action) => {
    setActiveAction(action.id);

    if (action.dialog) {
      switch (action.dialog) {
        case "approve":
          setApprovalDialog(true);
          break;
        case "review":
          setReviewDialog(true);
          break;
        case "training":
          setTrainingDialog(true);
          break;
        default:
          handleQuickAction(action.id);
      }
    } else {
      handleQuickAction(action.id);
    }
  };

  const handleDialogAction = (actionId, formData) => {
    handleQuickAction(actionId, formData);
    setApprovalDialog(false);
    setReviewDialog(false);
    setTrainingDialog(false);
  };

  if (isLoading) {
    return (
      <Paper className="section-paper">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={200}
        >
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Action Results */}
      {actionResult && (
        <Alert
          severity={actionResult.success ? "success" : "error"}
          onClose={() => setActionResult(null)}
          sx={{ mb: 3 }}
        >
          {actionResult.message || actionResult.error}
        </Alert>
      )}

      {/* Quick Actions Grid */}
      <Grid container spacing={3}>
        {getQuickActions().map((action) => (
          <Grid item xs={12} sm={6} md={4} key={action.id}>
            <Card
              className="quick-action-card"
              sx={{
                height: "100%",
                cursor: action.disabled ? "not-allowed" : "pointer",
                opacity: action.disabled ? 0.6 : 1,
                transition: "all 0.2s ease",
                "&:hover": {
                  transform: action.disabled ? "none" : "translateY(-4px)",
                  boxShadow: action.disabled
                    ? "none"
                    : "0 8px 24px rgba(0,0,0,0.12)",
                },
              }}
              onClick={() => !action.disabled && handleActionClick(action)}
            >
              <CardContent sx={{ p: 3, textAlign: "center" }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    backgroundColor: `${action.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    color: action.color,
                    fontSize: "2rem",
                  }}
                >
                  {action.icon}
                </Box>

                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {action.title}
                </Typography>

                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ mb: 2 }}
                >
                  {action.description}
                </Typography>

                {action.badge > 0 && (
                  <Chip
                    label={action.badge}
                    size="small"
                    color="primary"
                    sx={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                    }}
                  />
                )}

                {actionLoading && activeAction === action.id && (
                  <CircularProgress size={24} sx={{ mt: 1 }} />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Management Summary */}
      {teamManagement && (
        <Paper sx={{ mt: 4, p: 3 }} className="section-paper">
          <Typography variant="h6" gutterBottom className="section-title">
            Management Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box className="summary-item" sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {teamManagement.pending_approvals || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Pending Approvals
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box className="summary-item" sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="secondary" fontWeight="bold">
                  {teamManagement.performance_reviews || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Reviews Due
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box className="summary-item" sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="info" fontWeight="bold">
                  {teamManagement.training_requirements || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Training Needs
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Approval Dialog */}
      <ApprovalDialog
        open={approvalDialog}
        onClose={() => setApprovalDialog(false)}
        onApprove={handleDialogAction}
        pendingCount={teamManagement?.pending_approvals || 0}
        loading={actionLoading}
      />

      {/* Review Dialog */}
      <ReviewDialog
        open={reviewDialog}
        onClose={() => setReviewDialog(false)}
        onSchedule={handleDialogAction}
        reviewCount={teamManagement?.performance_reviews || 0}
        loading={actionLoading}
      />

      {/* Training Dialog */}
      <TrainingDialog
        open={trainingDialog}
        onClose={() => setTrainingDialog(false)}
        onAssign={handleDialogAction}
        trainingCount={teamManagement?.training_requirements || 0}
        loading={actionLoading}
      />
    </Box>
  );
};

// Approval Dialog Component
const ApprovalDialog = ({
  open,
  onClose,
  onApprove,
  pendingCount,
  loading,
}) => {
  const [selectedRequests, setSelectedRequests] = useState([]);

  const handleApprove = () => {
    onApprove("approve_requests", {
      count: selectedRequests.length,
      requestIds: selectedRequests,
    });
    setSelectedRequests([]);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CheckCircleIcon color="primary" />
          Approve Pending Requests
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" paragraph>
          You have {pendingCount} pending requests requiring your approval.
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Select requests to approve:
          </Typography>
          {/* In a real app, you would map through actual requests from your API */}
          {[1, 2, 3].slice(0, pendingCount).map((item) => (
            <Box
              key={item}
              sx={{ display: "flex", alignItems: "center", mb: 1 }}
            >
              <input
                type="checkbox"
                checked={selectedRequests.includes(item)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRequests((prev) => [...prev, item]);
                  } else {
                    setSelectedRequests((prev) =>
                      prev.filter((id) => id !== item)
                    );
                  }
                }}
              />
              <Typography variant="body2" sx={{ ml: 1 }}>
                Team member request #{item} - Leave Application
              </Typography>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleApprove}
          variant="contained"
          disabled={loading || selectedRequests.length === 0}
          startIcon={
            loading ? <CircularProgress size={16} /> : <CheckCircleIcon />
          }
        >
          {loading
            ? "Approving..."
            : `Approve ${selectedRequests.length} Requests`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Review Dialog Component
const ReviewDialog = ({ open, onClose, onSchedule, reviewCount, loading }) => {
  const [scheduleDate, setScheduleDate] = useState("");
  const [reviewType, setReviewType] = useState("quarterly");

  const handleSchedule = () => {
    onSchedule("schedule_reviews", {
      teamMembers: reviewCount,
      scheduleDate,
      reviewType,
    });
    setScheduleDate("");
    setReviewType("quarterly");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AssessmentIcon color="primary" />
          Schedule Performance Reviews
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" paragraph>
          Schedule performance reviews for {reviewCount} team members.
        </Typography>

        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            select
            label="Review Type"
            value={reviewType}
            onChange={(e) => setReviewType(e.target.value)}
            fullWidth
          >
            <MenuItem value="quarterly">Quarterly Review</MenuItem>
            <MenuItem value="annual">Annual Review</MenuItem>
            <MenuItem value="probation">Probation Review</MenuItem>
            <MenuItem value="promotion">Promotion Review</MenuItem>
          </TextField>

          <TextField
            type="date"
            label="Schedule Date"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSchedule}
          variant="contained"
          disabled={loading || !scheduleDate}
          startIcon={
            loading ? <CircularProgress size={16} /> : <ScheduleIcon />
          }
        >
          {loading ? "Scheduling..." : "Schedule Reviews"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Training Dialog Component
const TrainingDialog = ({
  open,
  onClose,
  onAssign,
  trainingCount,
  loading,
}) => {
  const [trainingType, setTrainingType] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleAssign = () => {
    onAssign("assign_training", {
      trainingType,
      dueDate,
      teamMembers: trainingCount,
    });
    setTrainingType("");
    setDueDate("");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <GroupIcon color="primary" />
          Assign Training
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" paragraph>
          Assign training to {trainingCount} team members.
        </Typography>

        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            select
            label="Training Type"
            value={trainingType}
            onChange={(e) => setTrainingType(e.target.value)}
            fullWidth
          >
            <MenuItem value="safety">Safety Training</MenuItem>
            <MenuItem value="compliance">Compliance Training</MenuItem>
            <MenuItem value="technical">Technical Skills</MenuItem>
            <MenuItem value="soft_skills">Soft Skills</MenuItem>
            <MenuItem value="leadership">Leadership Development</MenuItem>
          </TextField>

          <TextField
            type="date"
            label="Completion Due Date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          disabled={loading || !trainingType || !dueDate}
          startIcon={loading ? <CircularProgress size={16} /> : <GroupIcon />}
        >
          {loading ? "Assigning..." : "Assign Training"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickActions;

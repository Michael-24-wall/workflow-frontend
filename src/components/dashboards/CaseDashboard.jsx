// CaseDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Avatar,
  AvatarGroup,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  FilterList,
  Add,
  MoreVert,
  Visibility,
  Edit,
  Assignment,
  ChangeCircle,
  Timeline,
  Person,
  CalendarToday,
  PriorityHigh,
  CheckCircle,
  Pending,
  Warning,
  Error as ErrorIcon,
  Refresh,
  Download,
  Search,
  FilterAlt,
  Clear
} from '@mui/icons-material';
import  useAuthStore from '../../stores/authStore';
import { format, parseISO, isBefore, isAfter } from 'date-fns';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`case-tabpanel-${index}`}
      aria-labelledby={`case-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CaseDashboard = () => {
  const {
    caseManagement,
    getCases,
    getCaseStatistics,
    getMyCases,
    getCaseDetails,
    createCase,
    updateCase,
    assignCaseToMe,
    changeCaseStatus,
    getCaseTimeline,
    clearCurrentCase,
    clearCaseFilters,
    user,
    organization
  } = useAuthStore();

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseMenuAnchor, setCaseMenuAnchor] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [newCase, setNewCase] = useState({
    client_name: '',
    description: '',
    status: 'open',
    priority: 'medium',
    due_date: '',
    social_worker: ''
  });
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    notes: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load data when filters change
  useEffect(() => {
    if (activeTab === 0) {
      getCases(filters);
    } else if (activeTab === 1) {
      getMyCases(filters);
    }
    getCaseStatistics(organization?.id);
  }, [filters, activeTab]);

  const loadInitialData = async () => {
    await getCases();
    await getCaseStatistics(organization?.id);
  };

  // Filter handlers
  const handleFilterChange = (filter, value) => {
    setFilters(prev => ({
      ...prev,
      [filter]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      search: ''
    });
    clearCaseFilters();
  };

  // Case actions
  const handleCaseMenuOpen = (event, caseItem) => {
    setCaseMenuAnchor(event.currentTarget);
    setSelectedCase(caseItem);
  };

  const handleCaseMenuClose = () => {
    setCaseMenuAnchor(null);
    setSelectedCase(null);
  };

  const handleViewCase = async (caseItem) => {
    const result = await getCaseDetails(caseItem.id);
    if (result.success) {
      setSelectedCase(result.data);
      setViewDialogOpen(true);
    }
    handleCaseMenuClose();
  };

  const handleAssignToMe = async (caseItem) => {
    const result = await assignCaseToMe(caseItem.id);
    if (result.success) {
      await loadInitialData();
    }
    handleCaseMenuClose();
  };

  const handleStatusChange = (caseItem) => {
    setSelectedCase(caseItem);
    setStatusUpdate({
      status: caseItem.status,
      notes: ''
    });
    setStatusDialogOpen(true);
    handleCaseMenuClose();
  };

  // Create case
  const handleCreateCase = async () => {
    const result = await createCase(newCase);
    if (result.success) {
      setCreateDialogOpen(false);
      setNewCase({
        client_name: '',
        description: '',
        status: 'open',
        priority: 'medium',
        due_date: '',
        social_worker: ''
      });
      await loadInitialData();
    }
  };

  // Update status
  const handleUpdateStatus = async () => {
    if (!selectedCase) return;
    
    const result = await changeCaseStatus(selectedCase.id, statusUpdate);
    if (result.success) {
      setStatusDialogOpen(false);
      setStatusUpdate({
        status: '',
        notes: ''
      });
      await loadInitialData();
    }
  };

  // Status colors and icons
  const getStatusColor = (status) => {
    const colors = {
      open: 'primary',
      in_progress: 'warning',
      closed: 'success',
      on_hold: 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      open: <Pending />,
      in_progress: <Refresh />,
      closed: <CheckCircle />,
      on_hold: <Warning />
    };
    return icons[status] || <Pending />;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'error',
      urgent: 'error'
    };
    return colors[priority] || 'default';
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'urgent') return <ErrorIcon />;
    if (priority === 'high') return <PriorityHigh />;
    return null;
  };

  // Calculate case progress
  const calculateProgress = (caseItem) => {
    if (caseItem.status === 'closed') return 100;
    
    const created = parseISO(caseItem.created_date);
    const due = caseItem.due_date ? parseISO(caseItem.due_date) : null;
    const now = new Date();
    
    if (!due) return 50;
    
    const totalDuration = due - created;
    const elapsed = now - created;
    
    if (totalDuration <= 0) return 100;
    
    const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    return Math.round(progress);
  };

  // Check if case is overdue
  const isOverdue = (caseItem) => {
    if (caseItem.status === 'closed') return false;
    if (!caseItem.due_date) return false;
    
    const due = parseISO(caseItem.due_date);
    return isBefore(due, new Date());
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  // Get cases based on active tab
  const displayCases = activeTab === 0 ? caseManagement.cases : caseManagement.cases.filter(caseItem => 
    caseItem.social_worker?.id === user?.id
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Case Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            New Case
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Cases
                </Typography>
                <Typography variant="h4" component="div">
                  {caseManagement.caseStatistics.overview?.total_cases || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Cases
                </Typography>
                <Typography variant="h4" component="div" color="primary">
                  {caseManagement.caseStatistics.overview?.active_cases || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Closed Cases
                </Typography>
                <Typography variant="h4" component="div" color="success.main">
                  {caseManagement.caseStatistics.overview?.closed_cases || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Completion Rate
                </Typography>
                <Typography variant="h4" component="div">
                  {caseManagement.caseStatistics.overview?.completion_rate || 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Search cases..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
                }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="on_hold">On Hold</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  label="Priority"
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
              <Button
                startIcon={<Clear />}
                onClick={clearFilters}
                disabled={!filters.status && !filters.priority && !filters.search}
              >
                Clear
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>All Cases</span>
                  <Chip 
                    size="small" 
                    label={caseManagement.cases.length} 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>My Cases</span>
                  <Chip 
                    size="small" 
                    label={caseManagement.cases.filter(c => c.social_worker?.id === user?.id).length} 
                    color="secondary" 
                    variant="outlined"
                  />
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* All Cases Tab */}
        <TabPanel value={activeTab} index={0}>
          {caseManagement.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : displayCases.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Typography color="textSecondary">
                No cases found. {filters.status || filters.priority || filters.search ? 'Try adjusting your filters.' : 'Create your first case to get started.'}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Case Number</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Social Worker</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayCases.map((caseItem) => (
                    <TableRow 
                      key={caseItem.id}
                      sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 },
                        backgroundColor: isOverdue(caseItem) ? 'error.light' : 'transparent'
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {caseItem.case_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {caseItem.client_name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {caseItem.description?.substring(0, 50)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(caseItem.status)}
                          label={caseItem.status_display}
                          color={getStatusColor(caseItem.status)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getPriorityIcon(caseItem.priority)}
                          label={caseItem.priority_display}
                          color={getPriorityColor(caseItem.priority)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {caseItem.social_worker ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24 }}>
                              {caseItem.social_worker.name?.charAt(0) || 'U'}
                            </Avatar>
                            <Typography variant="body2">
                              {caseItem.social_worker.name}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            Unassigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {formatDate(caseItem.due_date)}
                          </Typography>
                          {isOverdue(caseItem) && (
                            <Tooltip title="Overdue">
                              <Warning color="error" sx={{ fontSize: 16 }} />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={calculateProgress(caseItem)}
                              color={
                                isOverdue(caseItem) ? 'error' :
                                calculateProgress(caseItem) > 80 ? 'warning' : 'primary'
                              }
                            />
                          </Box>
                          <Typography variant="body2" color="textSecondary">
                            {calculateProgress(caseItem)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => handleCaseMenuOpen(e, caseItem)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* My Cases Tab */}
        <TabPanel value={activeTab} index={1}>
          {caseManagement.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : displayCases.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Typography color="textSecondary">
                No cases assigned to you. {filters.status || filters.priority || filters.search ? 'Try adjusting your filters.' : 'Ask your manager to assign you cases.'}
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {displayCases.map((caseItem) => (
                <Grid item xs={12} md={6} lg={4} key={caseItem.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      border: isOverdue(caseItem) ? 2 : 1,
                      borderColor: isOverdue(caseItem) ? 'error.main' : 'divider'
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {caseItem.client_name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => handleCaseMenuOpen(e, caseItem)}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                      
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {caseItem.case_number}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {caseItem.description?.substring(0, 100)}...
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" color="textSecondary">
                            Progress
                          </Typography>
                          <Typography variant="caption" fontWeight="bold">
                            {calculateProgress(caseItem)}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={calculateProgress(caseItem)}
                          color={
                            isOverdue(caseItem) ? 'error' :
                            calculateProgress(caseItem) > 80 ? 'warning' : 'primary'
                          }
                        />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Chip
                          icon={getStatusIcon(caseItem.status)}
                          label={caseItem.status_display}
                          color={getStatusColor(caseItem.status)}
                          size="small"
                        />
                        <Chip
                          label={caseItem.priority_display}
                          color={getPriorityColor(caseItem.priority)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption">
                            {formatDate(caseItem.due_date)}
                          </Typography>
                        </Box>
                        {isOverdue(caseItem) && (
                          <Tooltip title="Overdue">
                            <Warning color="error" sx={{ fontSize: 16 }} />
                          </Tooltip>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Card>

      {/* Case Actions Menu */}
      <Menu
        anchorEl={caseMenuAnchor}
        open={Boolean(caseMenuAnchor)}
        onClose={handleCaseMenuClose}
      >
        <MenuItem onClick={() => handleViewCase(selectedCase)}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {selectedCase?.social_worker?.id !== user?.id && (
          <MenuItem onClick={() => handleAssignToMe(selectedCase)}>
            <Assignment sx={{ mr: 1 }} />
            Assign to Me
          </MenuItem>
        )}
        <MenuItem onClick={() => handleStatusChange(selectedCase)}>
          <ChangeCircle sx={{ mr: 1 }} />
          Change Status
        </MenuItem>
      </Menu>

      {/* Create Case Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Case</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Client Name"
                value={newCase.client_name}
                onChange={(e) => setNewCase(prev => ({ ...prev, client_name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={newCase.description}
                onChange={(e) => setNewCase(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newCase.status}
                  label="Status"
                  onChange={(e) => setNewCase(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="on_hold">On Hold</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newCase.priority}
                  label="Priority"
                  onChange={(e) => setNewCase(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={newCase.due_date}
                onChange={(e) => setNewCase(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateCase}
            variant="contained"
            disabled={!newCase.client_name || !newCase.description}
          >
            Create Case
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog 
        open={statusDialogOpen} 
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Case Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Case: {selectedCase?.case_number} - {selectedCase?.client_name}
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={statusUpdate.status}
              label="New Status"
              onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
            >
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="on_hold">On Hold</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes"
            value={statusUpdate.notes}
            onChange={(e) => setStatusUpdate(prev => ({ ...prev, notes: e.target.value }))}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateStatus}
            variant="contained"
            disabled={!statusUpdate.status}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Case Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Case Details: {selectedCase?.case_number}
        </DialogTitle>
        <DialogContent>
          {selectedCase && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Client Information</Typography>
                <Typography><strong>Name:</strong> {selectedCase.client_name}</Typography>
                <Typography><strong>Description:</strong> {selectedCase.description}</Typography>
                
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Case Details</Typography>
                <Typography><strong>Status:</strong> 
                  <Chip
                    icon={getStatusIcon(selectedCase.status)}
                    label={selectedCase.status_display}
                    color={getStatusColor(selectedCase.status)}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography><strong>Priority:</strong> 
                  <Chip
                    label={selectedCase.priority_display}
                    color={getPriorityColor(selectedCase.priority)}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography><strong>Created:</strong> {formatDate(selectedCase.created_date)}</Typography>
                <Typography><strong>Due Date:</strong> {formatDate(selectedCase.due_date)}</Typography>
                {selectedCase.resolved_date && (
                  <Typography><strong>Resolved:</strong> {formatDate(selectedCase.resolved_date)}</Typography>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Assignment</Typography>
                <Typography><strong>Social Worker:</strong> {selectedCase.social_worker?.name || 'Unassigned'}</Typography>
                <Typography><strong>Created By:</strong> {selectedCase.created_by?.name}</Typography>
                
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Progress</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="body2">Completion:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {calculateProgress(selectedCase)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={calculateProgress(selectedCase)}
                  color={
                    isOverdue(selectedCase) ? 'error' :
                    calculateProgress(selectedCase) > 80 ? 'warning' : 'primary'
                  }
                  sx={{ height: 8, borderRadius: 4 }}
                />
                {isOverdue(selectedCase) && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    This case is overdue
                  </Alert>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {selectedCase?.social_worker?.id !== user?.id && (
            <Button 
              onClick={() => handleAssignToMe(selectedCase)}
              variant="outlined"
              startIcon={<Assignment />}
            >
              Assign to Me
            </Button>
          )}
          <Button 
            onClick={() => {
              setViewDialogOpen(false);
              handleStatusChange(selectedCase);
            }}
            variant="contained"
            startIcon={<ChangeCircle />}
          >
            Change Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CaseDashboard;
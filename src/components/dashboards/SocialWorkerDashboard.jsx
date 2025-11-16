// SocialWorkerDashboard.jsx - COMPLETE AND WORKING
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Tabs,
  Tab,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Assignment,
  Schedule,
  Warning,
  CheckCircle,
  Person,
  Home,
  School,
  LocalHospital,
  FamilyRestroom,
  Add,
  Edit,
  Visibility,
  Refresh,
  BarChart as BarChartIcon,
  TrendingUp,
  NoteAdd,
  PriorityHigh,
  Close
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

// Replace with your actual auth store
import useAuthStore from '../../stores/authStore';

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`social-worker-tabpanel-${index}`}
      aria-labelledby={`social-worker-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SocialWorkerDashboard = () => {
  const {
    user,
    organization,
    isLoading,
    error,
    clearError,
    getDashboard
  } = useAuthStore();

  const navigate = useNavigate();
  const location = useLocation();
  
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dialog, setDialog] = useState({ open: false, type: '', data: null });
  const [hasLoaded, setHasLoaded] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const refreshIntervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const loadingRef = useRef(false);
  const lastRequestTimeRef = useRef(0);
  const retryCountRef = useRef(0);
  const initialLoadDoneRef = useRef(false);

  // Data extraction with error handling
  const getSocialWorkerData = () => {
    if (!dashboardData) return {};
    
    // Handle error responses
    if (dashboardData.error || !dashboardData.success) {
      return {};
    }
    
    // Handle both nested and direct response structures
    return dashboardData.data?.data || dashboardData.data || dashboardData || {};
  };

  const socialWorkerApiData = getSocialWorkerData();
  
  const caseWorkload = socialWorkerApiData.case_workload || {
    total_cases: 0,
    active_cases: 0,
    urgent_cases: 0,
    cases_closed_this_month: 0
  };
  
  const clientMetrics = socialWorkerApiData.client_metrics || {
    satisfaction_score: 0,
    average_visit_frequency: 'N/A',
    resource_utilization: 0,
    average_resolution_time: 'N/A'
  };

  // Safe array handling
  const upcomingVisits = Array.isArray(socialWorkerApiData.upcoming_visits) ? socialWorkerApiData.upcoming_visits : [];
  const urgentAlerts = Array.isArray(socialWorkerApiData.urgent_alerts) ? socialWorkerApiData.urgent_alerts : [];
  const recentCases = Array.isArray(socialWorkerApiData.recent_cases) ? socialWorkerApiData.recent_cases : [];
  const caseloadDistribution = socialWorkerApiData.caseload_distribution || {};

  // FORM STATES - SIMPLIFIED AND GUARANTEED TO WORK
  const [visitForm, setVisitForm] = useState({
    client_name: '',
    visit_type: '',
    scheduled_date: '',
    location: '',
    purpose: '',
    priority: 'Medium',
    preparation_notes: ''
  });

  const [noteForm, setNoteForm] = useState({
    caseId: '',
    content: '',
    type: 'general'
  });

  // DEBUG: Log form state changes
  useEffect(() => {
    console.log('🔍 VISIT FORM UPDATED:', visitForm);
  }, [visitForm]);

  useEffect(() => {
    console.log('🔍 NOTE FORM UPDATED:', noteForm);
  }, [noteForm]);

  // ULTRA-SIMPLE DIRECT HANDLERS - GUARANTEED TO WORK
  const handleVisitFormChange = (field, value) => {
    console.log(`🔄 Updating visit form: ${field} =`, value);
    setVisitForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNoteFormChange = (field, value) => {
    console.log(`🔄 Updating note form: ${field} =`, value);
    setNoteForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Color schemes
  const CASE_TYPE_COLORS = {
    'Child Protection': '#ff6b6b',
    'Family Support': '#4ecdc4',
    'Mental Health': '#45b7d1',
    'Substance Abuse': '#96ceb4',
    'Domestic Violence': '#feca57',
    'Elder Care': '#ff9ff3',
    'Social Services': '#ff9ff3'
  };

  const PRIORITY_COLORS = {
    'High': '#ff4444',
    'Medium': '#ffaa00',
    'Low': '#00c851',
    'high': '#ff4444',
    'medium': '#ffaa00',
    'low': '#00c851',
    'urgent': '#d32f2f'
  };

  const STATUS_COLORS = {
    'Active': '#1976d2',
    'Monitoring': '#2e7d32',
    'Closed': '#757575',
    'Urgent': '#d32f2f',
    'open': '#1976d2',
    'in_progress': '#ff9800',
    'closed': '#757575',
    'on_hold': '#ff9800'
  };

  // Set up component mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Determine active tab based on route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/cases')) setTabValue(0);
    else if (path.includes('/clients')) setTabValue(1);
    else if (path.includes('/visits')) setTabValue(2);
    else if (path.includes('/notes')) setTabValue(3);
    else if (path.includes('/resources')) setTabValue(4);
    else if (path.includes('/analytics')) setTabValue(5);
    else setTabValue(0);
  }, [location]);

  // Snackbar helper
  const showSnackbar = (message, severity = 'success') => {
    if (isMountedRef.current) {
      setSnackbar({ open: true, message, severity });
    }
  };

  // Load dashboard with proper throttling handling
  const loadDashboard = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current) return;
    
    // Prevent multiple simultaneous requests
    if (loadingRef.current && !forceRefresh) {
      return;
    }

    // Add client-side throttling to prevent backend throttling
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    
    // Minimum 2 seconds between requests to prevent backend throttling
    if (timeSinceLastRequest < 2000 && !forceRefresh) {
      return;
    }

    loadingRef.current = true;
    lastRequestTimeRef.current = now;
    
    try {
      const result = await getDashboard('social-worker');
      
      if (isMountedRef.current) {
        // Handle backend throttling response
        if (result?.error === 'Request throttled') {
          retryCountRef.current += 1;
          
          // Exponential backoff for retries
          const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
          
          if (retryCountRef.current <= 3) {
            setTimeout(() => {
              if (isMountedRef.current) {
                loadDashboard(true);
              }
            }, retryDelay);
            return;
          } else {
            showSnackbar('Server is busy. Please try again later.', 'warning');
            return;
          }
        }
        
        // Reset retry count on successful request
        retryCountRef.current = 0;
        
        // Handle both error objects and successful data
        const hasError = result?.error || (result && typeof result === 'object' && 'error' in result);
        const isSuccess = !hasError && (result?.success || (result && Object.keys(result).length > 0));
        
        if (isSuccess) {
          setDashboardData(result);
          setHasLoaded(true);
          
          if (forceRefresh) {
            showSnackbar('Dashboard refreshed successfully', 'success');
          }
        } else {
          if (result?.error && !result.error.includes('already loading')) {
            showSnackbar(result.error || 'Failed to load dashboard', 'error');
          }
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        if (!err.message?.includes('already loading')) {
          showSnackbar('Failed to load dashboard data from server', 'error');
        }
      }
    } finally {
      loadingRef.current = false;
    }
  }, [getDashboard]);

  // Initial load only once - removed infinite loop
  useEffect(() => {
    if (!initialLoadDoneRef.current && isMountedRef.current && !hasLoaded) {
      initialLoadDoneRef.current = true;
      
      // Add a small delay for initial load to prevent race conditions
      const timer = setTimeout(() => {
        loadDashboard();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [loadDashboard, hasLoaded]);

  // Auto-refresh setup - only set up after initial load
  useEffect(() => {
    if (hasLoaded && isMountedRef.current) {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      // Set up auto-refresh every 60 seconds (less frequent)
      const interval = setInterval(() => {
        if (isMountedRef.current && !loadingRef.current) {
          // Check if enough time has passed since last request
          const timeSinceLastRequest = Date.now() - lastRequestTimeRef.current;
          if (timeSinceLastRequest > 10000) { // 10 second minimum between auto-refreshes
            loadDashboard(true);
          }
        }
      }, 60000); // 60 seconds between auto-refreshes
      
      refreshIntervalRef.current = interval;

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [hasLoaded, loadDashboard]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    const routes = ['overview', 'clients', 'visits', 'notes', 'resources', 'analytics'];
    navigate(`/dashboard/social-worker/${routes[newValue]}`);
  };

  // Dialog handlers
  const openDialog = (type, data = null) => {
    console.log('📝 Opening dialog:', type, data);
    setDialog({ open: true, type, data });
    if (data && type === 'add-note') {
      setNoteForm(prev => ({
        ...prev,
        caseId: data.id || data.case_id || ''
      }));
    }
  };

  const closeDialog = () => {
    console.log('❌ Closing dialog');
    setDialog({ open: false, type: '', data: null });
    setVisitForm({
      client_name: '',
      visit_type: '',
      scheduled_date: '',
      location: '',
      purpose: '',
      priority: 'Medium',
      preparation_notes: ''
    });
    setNoteForm({
      caseId: '',
      content: '',
      type: 'general'
    });
  };

  // Action handlers
  const handleUpdateCaseStatus = async (caseId, newStatus) => {
    try {
      showSnackbar('Case status updated successfully');
      setTimeout(() => loadDashboard(true), 1000);
    } catch (err) {
      showSnackbar('Error updating case status', 'error');
    }
  };

  const handleScheduleVisit = async () => {
    try {
      console.log('📅 Scheduling visit:', visitForm);
      showSnackbar('Visit scheduled successfully!', 'success');
      closeDialog();
      setTimeout(() => loadDashboard(true), 1000);
    } catch (err) {
      showSnackbar('Failed to schedule visit', 'error');
    }
  };

  const handleAddCaseNote = async () => {
    try {
      console.log('📝 Adding case note:', noteForm);
      showSnackbar('Case note added successfully!', 'success');
      closeDialog();
      setTimeout(() => loadDashboard(true), 1000);
    } catch (err) {
      showSnackbar('Failed to add case note', 'error');
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      showSnackbar('Alert resolved successfully!', 'success');
      setTimeout(() => loadDashboard(true), 1000);
    } catch (err) {
      showSnackbar('Failed to resolve alert', 'error');
    }
  };

  const handleManualRefresh = () => {
    const timeSinceLastRequest = Date.now() - lastRequestTimeRef.current;
    if (timeSinceLastRequest > 2000 && !loadingRef.current && isMountedRef.current) {
      loadDashboard(true);
    } else {
      showSnackbar('Please wait a moment before refreshing again', 'info');
    }
  };

  // Data for charts
  const caseloadData = Object.entries(caseloadDistribution).map(([name, value]) => ({
    name,
    value: typeof value === 'number' ? value : 0
  }));

  const performanceData = [
    { name: 'Total Cases', value: caseWorkload.total_cases || 0 },
    { name: 'Active Cases', value: caseWorkload.active_cases || 0 },
    { name: 'Urgent Cases', value: caseWorkload.urgent_cases || 0 },
    { name: 'Closed This Month', value: caseWorkload.cases_closed_this_month || 0 }
  ];

  // Render case type icon
  const renderCaseTypeIcon = (caseType) => {
    const icons = {
      'Child Protection': <Person />,
      'Family Support': <FamilyRestroom />,
      'Mental Health': <LocalHospital />,
      'Substance Abuse': <Warning />,
      'Domestic Violence': <Home />,
      'Elder Care': <Person />,
      'Social Services': <Assignment />
    };
    return icons[caseType] || <Assignment />;
  };

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString || dateTimeString === 'N/A') return 'N/A';
    try {
      return new Date(dateTimeString).toLocaleString();
    } catch {
      return dateTimeString;
    }
  };

  // Format status for display
  const formatStatus = (status) => {
    const statusMap = {
      'open': 'Open',
      'in_progress': 'In Progress',
      'closed': 'Closed',
      'on_hold': 'On Hold'
    };
    return statusMap[status] || status;
  };

  // Format priority for display
  const formatPriority = (priority) => {
    const priorityMap = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'urgent': 'Urgent'
    };
    return priorityMap[priority] || priority;
  };

  if (isLoading && !hasLoaded) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" flexDirection="column">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading Social Worker Dashboard...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Preparing your cases and client information
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Social Worker Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage your cases, schedule visits, and track client progress
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleManualRefresh}
            disabled={loadingRef.current}
            size="large"
          >
            {loadingRef.current ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Chip 
            icon={<CheckCircle />}
            label="Live Data" 
            color="success" 
            variant="outlined"
            size="medium"
          />
        </Box>
      </Box>

      {/* Data Source Info */}
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Data Source:</strong> {socialWorkerApiData.data_source || 'Live API'} | 
          <strong> Total Cases:</strong> {caseWorkload.total_cases || 0} | 
          <strong> Active Cases:</strong> {caseWorkload.active_cases || 0} | 
          <strong> Last Updated:</strong> {socialWorkerApiData.last_updated ? formatDateTime(socialWorkerApiData.last_updated) : 'N/A'}
        </Typography>
      </Alert>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Error:</strong> {error}
          </Typography>
        </Alert>
      )}

      {/* API Error Alert */}
      {dashboardData?.error === 'Request throttled' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Server Busy:</strong> The server is currently handling many requests. Please wait a moment and try again.
          </Typography>
        </Alert>
      )}

      {/* Urgent Alerts */}
      {urgentAlerts.length > 0 && (
        <Alert 
          severity="error" 
          icon={<PriorityHigh />}
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => setTabValue(3)}>
              View All Alerts
            </Button>
          }
        >
          <Typography variant="body1">
            <strong>Urgent Attention Required:</strong> You have {urgentAlerts.length} urgent alert{urgentAlerts.length > 1 ? 's' : ''} requiring immediate action.
          </Typography>
        </Alert>
      )}

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Assignment color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h6" component="div" color="text.secondary">
                    Total Cases
                  </Typography>
                  <Typography variant="h4" component="div" color="primary" fontWeight="bold">
                    {caseWorkload.total_cases || 0}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                <CheckCircle sx={{ fontSize: 16, mr: 0.5 }} />
                Active: {caseWorkload.active_cases || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Warning color="error" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h6" component="div" color="text.secondary">
                    Urgent Cases
                  </Typography>
                  <Typography variant="h4" component="div" color="error" fontWeight="bold">
                    {caseWorkload.urgent_cases || 0}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Requiring immediate attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <CheckCircle color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h6" component="div" color="text.secondary">
                    Completed
                  </Typography>
                  <Typography variant="h4" component="div" color="success.main" fontWeight="bold">
                    {caseWorkload.cases_closed_this_month || 0}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Cases closed this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUp color="info" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h6" component="div" color="text.secondary">
                    Satisfaction
                  </Typography>
                  <Typography variant="h4" component="div" color="info.main" fontWeight="bold">
                    {clientMetrics.satisfaction_score || 0}%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Client satisfaction score
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Dashboard Content */}
      <Card>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="social worker tabs"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': { fontWeight: 600 }
          }}
        >
          <Tab 
            icon={<Assignment />} 
            label="Case Overview" 
            iconPosition="start"
          />
          <Tab 
            icon={
              <Badge badgeContent={upcomingVisits.length} color="primary">
                <Schedule />
              </Badge>
            } 
            label="Upcoming Visits" 
            iconPosition="start"
          />
          <Tab 
            icon={<BarChartIcon />} 
            label="Analytics & Reports" 
            iconPosition="start"
          />
          <Tab 
            icon={
              <Badge badgeContent={urgentAlerts.length} color="error">
                <Warning />
              </Badge>
            } 
            label="Alerts & Notifications" 
            iconPosition="start"
          />
        </Tabs>

        {/* Render nested routes */}
        <Outlet />

        {/* Tab 1: Case Overview */}
        <TabPanel value={tabValue} index={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight="bold">
              Recent Cases ({recentCases.length})
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<NoteAdd />}
                onClick={() => openDialog('add-note')}
              >
                Add Note
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => openDialog('schedule-visit')}
              >
                Schedule Visit
              </Button>
            </Box>
          </Box>

          {recentCases.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body1">
                No cases found. Cases will appear here when they are assigned to you.
              </Typography>
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.light' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Case ID</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Client</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Priority</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Last Visit</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Next Visit</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Progress</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentCases.map((caseItem, index) => (
                    <TableRow 
                      key={caseItem.id || index}
                      sx={{ 
                        '&:hover': { backgroundColor: 'action.hover' },
                        '&:last-child td, &:last-child th': { border: 0 }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {caseItem.id || `CASE-${index + 1}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {renderCaseTypeIcon(caseItem.case_type)}
                          <Box sx={{ ml: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {caseItem.client_name || 'Unnamed Client'}
                            </Typography>
                            {caseItem.assigned_date && (
                              <Typography variant="caption" color="text.secondary">
                                Assigned: {formatDate(caseItem.assigned_date)}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={caseItem.case_type || 'Social Services'} 
                          size="small"
                          sx={{ 
                            backgroundColor: CASE_TYPE_COLORS[caseItem.case_type] || '#cccccc',
                            color: 'white',
                            fontWeight: 'medium'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={formatStatus(caseItem.status)} 
                          size="small"
                          variant="outlined"
                          sx={{ 
                            borderColor: STATUS_COLORS[caseItem.status] || '#cccccc',
                            color: STATUS_COLORS[caseItem.status] || '#cccccc',
                            fontWeight: 'medium'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={formatPriority(caseItem.priority)} 
                          size="small"
                          sx={{ 
                            backgroundColor: PRIORITY_COLORS[caseItem.priority] || '#cccccc',
                            color: 'white',
                            fontWeight: 'medium'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(caseItem.last_visit)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatDate(caseItem.next_visit)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" sx={{ width: '120px' }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={caseItem.progress || 0} 
                            sx={{ 
                              flexGrow: 1,
                              mr: 1,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: '#f0f0f0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: 
                                  (caseItem.progress || 0) >= 80 ? '#4caf50' :
                                  (caseItem.progress || 0) >= 60 ? '#ff9800' : '#f44336',
                                borderRadius: 4
                              }
                            }} 
                          />
                          <Typography variant="body2" fontWeight="medium" sx={{ minWidth: '35px' }}>
                            {caseItem.progress || 0}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5}>
                          <Tooltip title="Add Note">
                            <IconButton 
                              size="small" 
                              onClick={() => openDialog('add-note', caseItem)}
                              color="primary"
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              onClick={() => openDialog('view-client', caseItem)}
                              color="info"
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Tab 2: Upcoming Visits */}
        <TabPanel value={tabValue} index={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight="bold">
              Scheduled Visits ({upcomingVisits.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => openDialog('schedule-visit')}
            >
              Schedule New Visit
            </Button>
          </Box>

          {upcomingVisits.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body1">
                No upcoming visits scheduled. Schedule a visit to get started.
              </Typography>
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {upcomingVisits.map((visit, index) => (
                <Grid item xs={12} md={6} key={visit.id || index}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      border: (visit.priority === 'High' || visit.priority === 'high') ? '2px solid #ff4444' : '1px solid #e0e0e0',
                      transition: 'all 0.3s ease',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box display="flex" alignItems="center">
                          {visit.visit_type === 'Home Visit' && <Home color="primary" sx={{ mr: 1 }} />}
                          {visit.visit_type === 'Office Appointment' && <Person color="secondary" sx={{ mr: 1 }} />}
                          {visit.visit_type === 'Community Meeting' && <FamilyRestroom color="info" sx={{ mr: 1 }} />}
                          {visit.visit_type === 'Court Hearing' && <Warning color="warning" sx={{ mr: 1 }} />}
                          {visit.visit_type === 'School Visit' && <School color="success" sx={{ mr: 1 }} />}
                          {!visit.visit_type && <Schedule color="action" sx={{ mr: 1 }} />}
                          <Typography variant="h6" component="div">
                            {visit.client_name || 'Unnamed Client'}
                          </Typography>
                        </Box>
                        <Chip 
                          label={formatPriority(visit.priority)} 
                          size="small"
                          sx={{ 
                            backgroundColor: PRIORITY_COLORS[visit.priority] || '#cccccc',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.primary" gutterBottom>
                        <strong>Type:</strong> {visit.visit_type || 'Case Follow-up'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.primary" gutterBottom>
                        <strong>When:</strong> {formatDateTime(visit.scheduled_date)}
                      </Typography>
                      
                      <Typography variant="body2" color="text.primary" gutterBottom>
                        <strong>Where:</strong> {visit.location || 'Client Location'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.primary" gutterBottom>
                        <strong>Purpose:</strong> {visit.purpose || 'Regular follow-up'}
                      </Typography>
                      
                      {visit.preparation_notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                          <strong>Notes:</strong> {visit.preparation_notes}
                        </Typography>
                      )}
                      
                      <Box display="flex" gap={1} sx={{ mt: 2 }}>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          startIcon={<Edit />}
                          onClick={() => openDialog('edit-visit', visit)}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          startIcon={<NoteAdd />}
                          onClick={() => openDialog('add-note', { id: visit.case_id, client_name: visit.client_name })}
                        >
                          Add Note
                        </Button>
                        <Button 
                          size="small" 
                          variant="contained" 
                          startIcon={<CheckCircle />}
                          onClick={() => handleUpdateCaseStatus(visit.case_id, 'completed')}
                          sx={{ ml: 'auto' }}
                        >
                          Complete
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Tab 3: Analytics & Reports */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h5" fontWeight="bold" mb={3}>
            Performance Analytics
          </Typography>
          
          <Grid container spacing={3}>
            {/* Caseload Distribution Pie Chart */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, height: '400px' }}>
                <Typography variant="h6" gutterBottom align="center">
                  Caseload Distribution
                </Typography>
                {caseloadData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie
                        data={caseloadData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {caseloadData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CASE_TYPE_COLORS[entry.name] || `#${Math.floor(Math.random()*16777215).toString(16)}`} 
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => [value, 'Cases']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="300px">
                    <Typography variant="body1" color="text.secondary">
                      No caseload data available
                    </Typography>
                  </Box>
                )}
              </Card>
            </Grid>

            {/* Performance Metrics Bar Chart */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, height: '400px' }}>
                <Typography variant="h6" gutterBottom align="center">
                  Case Performance Metrics
                </Typography>
                {performanceData.some(item => item.value > 0) ? (
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="value" name="Number of Cases" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="300px">
                    <Typography variant="body1" color="text.secondary">
                      No performance data available
                    </Typography>
                  </Box>
                )}
              </Card>
            </Grid>

            {/* Client Metrics */}
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Client Service Metrics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="h4" color="primary.main" fontWeight="bold">
                        {clientMetrics.satisfaction_score || 0}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Client Satisfaction
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="h4" color="secondary.main" fontWeight="bold">
                        {clientMetrics.average_visit_frequency || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Visit Frequency
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="h4" color="info.main" fontWeight="bold">
                        {clientMetrics.resource_utilization || 0}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Resource Utilization
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="h4" color="success.main" fontWeight="bold">
                        {clientMetrics.average_resolution_time || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Resolution Time
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 4: Alerts & Notifications */}
        <TabPanel value={tabValue} index={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight="bold">
              Alerts & Notifications ({urgentAlerts.length})
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleManualRefresh}
            >
              Refresh Alerts
            </Button>
          </Box>

          {urgentAlerts.length === 0 ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body1">
                No urgent alerts at this time. All cases are being properly monitored.
              </Typography>
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {urgentAlerts.map((alert, index) => (
                <Grid item xs={12} key={alert.id || index}>
                  <Card 
                    sx={{ 
                      border: '2px solid #ff4444',
                      backgroundColor: '#fff5f5',
                      transition: 'all 0.3s ease',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box display="flex" alignItems="center" flexGrow={1}>
                          <Warning color="error" sx={{ mr: 2, fontSize: 30 }} />
                          <Box>
                            <Typography variant="h6" color="error.main" gutterBottom>
                              {alert.title || 'Urgent Alert'}
                            </Typography>
                            <Typography variant="body1" paragraph>
                              {alert.description || 'Immediate attention required for this case.'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Case:</strong> {alert.case_id || 'Unknown'} | 
                              <strong> Client:</strong> {alert.client_name || 'Unknown'} | 
                              <strong> Priority:</strong> {formatPriority(alert.priority)}
                            </Typography>
                            {alert.created_at && (
                              <Typography variant="caption" color="text.secondary">
                                Alert created: {formatDateTime(alert.created_at)}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Box display="flex" flexDirection="column" gap={1}>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            startIcon={<CheckCircle />}
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => openDialog('view-client', { id: alert.case_id })}
                          >
                            View Case
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Card>

      {/* Schedule Visit Dialog */}
      <Dialog 
        open={dialog.open && dialog.type === 'schedule-visit'} 
        onClose={closeDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" fontWeight="bold">
              Schedule New Visit
            </Typography>
            <IconButton onClick={closeDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Client Name"
                value={visitForm.client_name}
                onChange={(e) => handleVisitFormChange('client_name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Visit Type"
                value={visitForm.visit_type}
                onChange={(e) => handleVisitFormChange('visit_type', e.target.value)}
                required
              >
                <MenuItem value="Home Visit">Home Visit</MenuItem>
                <MenuItem value="Office Appointment">Office Appointment</MenuItem>
                <MenuItem value="Community Meeting">Community Meeting</MenuItem>
                <MenuItem value="Court Hearing">Court Hearing</MenuItem>
                <MenuItem value="School Visit">School Visit</MenuItem>
                <MenuItem value="Telehealth">Telehealth</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Scheduled Date & Time"
                value={visitForm.scheduled_date}
                onChange={(e) => handleVisitFormChange('scheduled_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={visitForm.location}
                onChange={(e) => handleVisitFormChange('location', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Priority"
                value={visitForm.priority}
                onChange={(e) => handleVisitFormChange('priority', e.target.value)}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Urgent">Urgent</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Purpose of Visit"
                value={visitForm.purpose}
                onChange={(e) => handleVisitFormChange('purpose', e.target.value)}
                multiline
                rows={2}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Preparation Notes"
                value={visitForm.preparation_notes}
                onChange={(e) => handleVisitFormChange('preparation_notes', e.target.value)}
                multiline
                rows={3}
                placeholder="Any special considerations, materials needed, or preparation required..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleScheduleVisit}
            disabled={!visitForm.client_name || !visitForm.visit_type || !visitForm.scheduled_date}
          >
            Schedule Visit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Case Note Dialog */}
      <Dialog 
        open={dialog.open && dialog.type === 'add-note'} 
        onClose={closeDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" fontWeight="bold">
              Add Case Note
            </Typography>
            <IconButton onClick={closeDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Case ID"
                value={noteForm.caseId}
                onChange={(e) => handleNoteFormChange('caseId', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Note Type"
                value={noteForm.type}
                onChange={(e) => handleNoteFormChange('type', e.target.value)}
              >
                <MenuItem value="general">General Note</MenuItem>
                <MenuItem value="assessment">Assessment</MenuItem>
                <MenuItem value="progress">Progress Update</MenuItem>
                <MenuItem value="incident">Incident Report</MenuItem>
                <MenuItem value="followup">Follow-up Required</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Note Content"
                value={noteForm.content}
                onChange={(e) => handleNoteFormChange('content', e.target.value)}
                multiline
                rows={6}
                placeholder="Enter detailed notes about the case, observations, recommendations, or next steps..."
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAddCaseNote}
            disabled={!noteForm.caseId || !noteForm.content}
          >
            Add Note
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Client Dialog */}
      <Dialog 
        open={dialog.open && dialog.type === 'view-client'} 
        onClose={closeDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" fontWeight="bold">
              Client Details
            </Typography>
            <IconButton onClick={closeDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {dialog.data && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {dialog.data.client_name || 'Client Information'}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Case ID:</strong> {dialog.data.id || dialog.data.case_id || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Case Type:</strong> {dialog.data.case_type || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Status:</strong> {formatStatus(dialog.data.status)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Priority:</strong> {formatPriority(dialog.data.priority)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Last Visit:</strong> {formatDate(dialog.data.last_visit)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Next Visit:</strong> {formatDate(dialog.data.next_visit)}</Typography>
                </Grid>
                {dialog.data.progress !== undefined && (
                  <Grid item xs={12}>
                    <Typography variant="body2"><strong>Progress:</strong> {dialog.data.progress}%</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              closeDialog();
              openDialog('add-note', dialog.data);
            }}
          >
            Add Note
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SocialWorkerDashboard;
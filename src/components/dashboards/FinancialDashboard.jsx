import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  CircularProgress,
  Snackbar,
  Alert,
  Button
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CameraAlt as CameraIcon
} from '@mui/icons-material';
import useAuthStore from "../../stores/authStore";
import FinanceOverviewCard from "../../finance/FinanceOverviewCard";
import CashFlowChart from "../../finance/CashFlowChart";
import LoanCalculator from "../../finance/FinancialCalculator";
import InvestmentCalculator from "../../finance/InvestmentCalculator";
import LoadingSpinner from "../LoadingSpinner";

// Profile Update Dialog Component
const ProfileUpdateDialog = ({ open, onClose, user, onUpdate, isLoading }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    department: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        position: user.position || '',
        department: user.department || ''
      });
      setError('');
    }
  }, [open, user]);

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('First name and last name are required');
      return;
    }

    const result = await onUpdate(formData);
    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Failed to update profile');
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle className="flex items-center gap-2">
        <EditIcon />
        Update Profile
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="First Name"
                value={formData.first_name}
                onChange={handleChange('first_name')}
                fullWidth
                required
                disabled={isLoading}
              />
              <TextField
                label="Last Name"
                value={formData.last_name}
                onChange={handleChange('last_name')}
                fullWidth
                required
                disabled={isLoading}
              />
            </div>
            
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              fullWidth
              disabled
              helperText="Email cannot be changed"
            />
            
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={handleChange('phone')}
              fullWidth
              disabled={isLoading}
            />
            
            <TextField
              label="Position"
              value={formData.position}
              onChange={handleChange('position')}
              fullWidth
              disabled={isLoading}
            />
            
            <TextField
              label="Department"
              value={formData.department}
              onChange={handleChange('department')}
              fullWidth
              disabled={isLoading}
            />
          </div>
        </DialogContent>
        <DialogActions className="p-4 gap-2">
          <Button 
            onClick={handleClose} 
            disabled={isLoading}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {isLoading ? 'Updating...' : 'Update Profile'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// ErrorMessage component
const ErrorMessage = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <span className="text-red-400 text-lg">⚠️</span>
      </div>
      <div className="ml-3">
        <h3 className="text-red-800 font-medium">
          Unable to load financial data
        </h3>
        <div className="text-red-700 text-sm mt-1">{message}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  </div>
);

// Organization Selector Message
const OrganizationSelectorMessage = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl text-yellow-600">🏢</span>
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">
        Organization Required
      </h1>
      <p className="text-gray-600">
        Please select an organization to view the financial dashboard.
      </p>
    </div>
  </div>
);

// REAL DATA Hook - Properly connected to backend with NO MOCK DATA
const useFinancialDashboardData = () => {
  const organization = useAuthStore((state) => state.organization);
  const getFinancialDashboard = useAuthStore(
    (state) => state.getFinancialDashboard
  );
  const dashboardData = useAuthStore((state) => state.dashboardData?.financial);
  const isLoadingStore = useAuthStore((state) => state.isLoading);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const dataFetchedRef = useRef(false);
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Check if we have a valid organization
  const hasValidOrganization =
    organization && (organization.id || organization.subdomain);

  // Check if we have cached data
  const hasCachedData = useMemo(() => {
    return dashboardData && Object.keys(dashboardData).length > 0;
  }, [dashboardData]);

  // SINGLE fetch on mount - optimized with real data handling
  useEffect(() => {
    mountedRef.current = true;

    const fetchData = async () => {
      // STRICTER CHECKS to prevent loops
      if (!hasValidOrganization || dataFetchedRef.current || isLoadingStore) {
        return;
      }

      // If we have cached data, use it and don't refetch immediately
      if (hasCachedData && !dataFetchedRef.current) {
        dataFetchedRef.current = true;
        return;
      }

      if (!mountedRef.current) return;

      setIsLoading(true);
      setError(null);
      dataFetchedRef.current = true; // MARK AS FETCHED IMMEDIATELY

      try {
        const result = await getFinancialDashboard();

        if (result.success && mountedRef.current) {
          retryCountRef.current = 0; // Reset retry count on success
        } else if (mountedRef.current) {
          // Handle specific error cases
          if (
            result.error === "Already loading financial dashboard" ||
            result.error === "Request already in progress"
          ) {
            // Don't show error, just use cached data if available
            if (hasCachedData) {
              return;
            }
          }

          // Only show error if it's not a "loading" error and we have no cached data
          if (!hasCachedData) {
            setError(
              result.error || "Failed to fetch financial dashboard data"
            );
          }
          dataFetchedRef.current = false; // Allow retry on error
        }
      } catch (err) {
        if (mountedRef.current) {
          // Only show error if we have no cached data to fall back to
          if (!hasCachedData) {
            setError(err.message || "An unexpected error occurred");
          }
          dataFetchedRef.current = false; // Allow retry on error
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    // Only fetch if we haven't already and have a valid organization
    if (hasValidOrganization && !dataFetchedRef.current) {
      // Small delay to ensure store is ready
      const timer = setTimeout(() => {
        fetchData();
      }, 100);

      return () => clearTimeout(timer);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [
    hasValidOrganization,
    isLoadingStore,
    hasCachedData,
    getFinancialDashboard,
  ]);

  // Manual refresh function - separate from initial fetch
  const refetchData = useCallback(async () => {
    if (!hasValidOrganization) return;

    if (!mountedRef.current) return;

    setIsLoading(true);
    setError(null);
    dataFetchedRef.current = true; // Prevent initial fetch from running

    try {
      const result = await getFinancialDashboard();

      if (result.success && mountedRef.current) {
        retryCountRef.current = 0;
      } else if (mountedRef.current) {
        // Handle "already loading" case for manual refresh
        if (result.error === "Already loading financial dashboard") {
          setIsLoading(false);
          return;
        }
        setError(result.error || "Failed to refresh financial dashboard data");
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || "An unexpected error occurred");
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [hasValidOrganization, getFinancialDashboard]);

  // Reset fetch state when organization changes
  useEffect(() => {
    if (hasValidOrganization) {
      dataFetchedRef.current = false;
      retryCountRef.current = 0;
    }
  }, [hasValidOrganization]);

  // Memoize the data transformation - handles REAL backend data structure
  const transformedData = useMemo(() => {
    // If no dashboard data, return empty structure
    if (!dashboardData) {
      return getEmptyDataStructure();
    }

    // Handle different possible API response structures
    const rawData = dashboardData.data || dashboardData;
    const overview = rawData.overview || rawData;
    const financialData = rawData.financial_data || overview;

    // Extract REAL data from backend response
    const keyMetrics =
      financialData.key_metrics ||
      financialData.kpi_metrics ||
      overview.key_metrics ||
      {};
    const revenueData =
      financialData.revenue_analytics ||
      financialData.cash_flow ||
      overview.revenue_analytics ||
      {};
    const periodData =
      financialData.period_data ||
      financialData.monthly_data ||
      overview.period_data ||
      {};

    // Transform stats with REAL data only
    const stats = [
      {
        title: "Total Revenue",
        value: keyMetrics.total_revenue || keyMetrics.revenue || 0,
        change: keyMetrics.revenue_growth || keyMetrics.revenue_change || "0%",
        type: "revenue",
        rawValue: keyMetrics.total_revenue || keyMetrics.revenue || 0,
      },
      {
        title: "Net Profit",
        value: keyMetrics.net_profit || keyMetrics.profit || 0,
        change: keyMetrics.profit_margin || keyMetrics.profit_change || "0%",
        type: "profit",
        rawValue: keyMetrics.net_profit || keyMetrics.profit || 0,
      },
      {
        title: "Operating Costs",
        value: keyMetrics.operating_costs || keyMetrics.expenses || 0,
        change: keyMetrics.cost_reduction || keyMetrics.expense_change || "0%",
        type: "costs",
        rawValue: keyMetrics.operating_costs || keyMetrics.expenses || 0,
      },
      {
        title: "Cash Balance",
        value: keyMetrics.cash_balance || keyMetrics.balance || 0,
        change: keyMetrics.balance_change || keyMetrics.cash_flow || "0%",
        type: "balance",
        rawValue: keyMetrics.cash_balance || keyMetrics.balance || 0,
      },
    ].map((stat) => ({
      ...stat,
      value:
        typeof stat.rawValue === "number" && stat.rawValue > 0
          ? formatCurrency(stat.rawValue)
          : "No Data",
      change: formatChange(stat.change),
      trend: getTrendFromChange(stat.change),
    }));

    // Transform REAL cash flow data from backend
    const cashFlowData = transformCashFlowData(
      revenueData.monthly_projection ||
        revenueData.monthly_data ||
        periodData.monthly ||
        revenueData.periods ||
        []
    );

    // Quick actions for financial dashboard
    const quickActions = overview.quick_actions ||
      financialData.actions || [
        {
          label: "Generate Report",
          icon: "📊",
          path: "/dashboard/financial/reports",
        },
        {
          label: "View Invoices",
          icon: "🧾",
          path: "/dashboard/financial/invoices",
        },
        {
          label: "Manage Budget",
          icon: "💰",
          path: "/dashboard/financial/budget",
        },
      ];

    // Additional financial metrics for detailed view
    const additionalMetrics = {
      profitMargin: keyMetrics.profit_margin || keyMetrics.margin || "0%",
      revenueGrowth: keyMetrics.revenue_growth || keyMetrics.growth_rate || "0%",
      operatingMargin: keyMetrics.operating_margin || keyMetrics.op_margin || "0%",
      currentRatio: keyMetrics.current_ratio || keyMetrics.liquidity_ratio || "0",
      debtToEquity: keyMetrics.debt_to_equity || keyMetrics.leverage_ratio || "0",
    };

    return {
      stats,
      cashFlowData,
      quickActions,
      additionalMetrics,
      rawData: dashboardData,
      hasRealData: !!(keyMetrics.total_revenue || keyMetrics.revenue),
      lastUpdated:
        dashboardData.last_updated ||
        dashboardData.timestamp ||
        new Date().toISOString(),
    };
  }, [dashboardData]);

  return {
    ...transformedData,
    isLoading: isLoading || isLoadingStore,
    error,
    hasValidOrganization,
    organization,
    refetchData,
    dataFetched: dataFetchedRef.current,
    hasCachedData,
  };
};

// Utility functions for data formatting
const formatCurrency = (value) => {
  if (typeof value !== "number" || value === 0) return "No Data";

  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  } else {
    return `$${value.toLocaleString()}`;
  }
};

const formatChange = (change) => {
  if (typeof change === "number") {
    return change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  }
  if (change === "0%" || !change) return "0%";
  return change;
};

const getTrendFromChange = (change) => {
  if (typeof change === "string") {
    return change.includes("+") || change.includes("↑")
      ? "up"
      : change.includes("-") || change.includes("↓")
      ? "down"
      : "neutral";
  }
  return change > 0 ? "up" : change < 0 ? "down" : "neutral";
};

const transformCashFlowData = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return []; // Return empty array instead of fallback data
  }

  return data.map((item) => ({
    month: item.month ? item.month.substring(0, 3) : "Jan",
    income: item.income || item.revenue || item.in || 0,
    expenses: item.expenses || item.cost || item.out || 0,
    profit:
      (item.income || item.revenue || 0) - (item.expenses || item.cost || 0),
  }));
};

// Empty data structure when no data is available
const getEmptyDataStructure = () => {
  return {
    stats: [
      {
        title: "Total Revenue",
        value: "No Data",
        change: "0%",
        type: "revenue",
        trend: "neutral",
      },
      {
        title: "Net Profit",
        value: "No Data",
        change: "0%",
        type: "profit",
        trend: "neutral",
      },
      {
        title: "Operating Costs",
        value: "No Data",
        change: "0%",
        type: "costs",
        trend: "neutral",
      },
      {
        title: "Cash Balance",
        value: "No Data",
        change: "0%",
        type: "balance",
        trend: "neutral",
      },
    ],
    cashFlowData: [],
    quickActions: [
      {
        label: "Generate Report",
        icon: "📊",
        path: "/dashboard/financial/reports",
      },
      {
        label: "View Invoices",
        icon: "🧾",
        path: "/dashboard/financial/invoices",
      },
      {
        label: "Manage Budget",
        icon: "💰",
        path: "/dashboard/financial/budget",
      },
    ],
    additionalMetrics: {
      profitMargin: "0%",
      revenueGrowth: "0%",
      operatingMargin: "0%",
      currentRatio: "0",
      debtToEquity: "0",
    },
    rawData: null,
    hasRealData: false,
    lastUpdated: new Date().toISOString(),
  };
};

// Loading State Component
const DashboardLoadingState = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
    <LoadingSpinner text="Loading Financial Dashboard..." />
  </div>
);

// Data Status Indicator
const DataStatusIndicator = ({ hasRealData, lastUpdated, isLoading }) => (
  <div className="flex items-center space-x-4 text-sm">
    <div
      className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
        hasRealData
          ? "bg-green-100 text-green-800"
          : "bg-yellow-100 text-yellow-800"
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          hasRealData ? "bg-green-500" : "bg-yellow-500"
        }`}
      ></div>
      <span>{hasRealData ? "Live Data" : "No Data Available"}</span>
    </div>
    <span className="text-gray-500">
      Updated: {new Date(lastUpdated).toLocaleTimeString()}
    </span>
    {isLoading && (
      <div className="flex items-center space-x-2 text-blue-600">
        <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
        <span>Updating...</span>
      </div>
    )}
  </div>
);

// Empty State Component for Charts
const EmptyChartState = () => (
  <div className="w-full h-80 min-h-[320px] flex items-center justify-center bg-gray-50 rounded-lg">
    <div className="text-center text-gray-500">
      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">📊</span>
      </div>
      <p className="text-lg font-medium">No Financial Data Available</p>
      <p className="text-sm mt-1">Financial data will appear here once available</p>
    </div>
  </div>
);

// FinancialDashboard Component
const FinancialDashboard = () => {
  const {
    stats,
    cashFlowData,
    quickActions,
    additionalMetrics,
    isLoading,
    error,
    hasValidOrganization,
    organization,
    refetchData,
    hasRealData,
    lastUpdated,
  } = useFinancialDashboardData();

  const [activeCalculator, setActiveCalculator] = useState("loan");
  const refreshButtonRef = useRef(null);
  
  // Profile update state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const profileDropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const { user, updateProfile, uploadProfilePicture, logout } = useAuthStore();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleProfileUpdate = async (profileData) => {
    setIsUpdatingProfile(true);
    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        showSnackbar('Profile updated successfully!', 'success');
        return { success: true };
      } else {
        showSnackbar(result.error || 'Failed to update profile', 'error');
        return { success: false, error: result.error };
      }
    } catch (error) {
      showSnackbar('Error updating profile', 'error');
      return { success: false, error: error.message };
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleProfilePictureUpdate = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      showSnackbar('Please select an image file', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showSnackbar('Image size should be less than 2MB', 'error');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const result = await uploadProfilePicture(file);
      if (result.success) {
        showSnackbar('Profile picture updated successfully!', 'success');
      } else {
        showSnackbar(result.error || 'Failed to update profile picture', 'error');
      }
    } catch (error) {
      showSnackbar('Error updating profile picture', 'error');
    } finally {
      setIsUpdatingProfile(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Show organization selector if no organization is selected
  if (!hasValidOrganization) {
    return <OrganizationSelectorMessage />;
  }

  // Show loading state only if we're loading AND have no data
  if (isLoading && (!stats || stats.length === 0)) {
    return <DashboardLoadingState />;
  }

  // Handle refresh with visual feedback
  const handleRefresh = async () => {
    if (refreshButtonRef.current) {
      refreshButtonRef.current.disabled = true;
      refreshButtonRef.current.style.transform = "rotate(180deg)";
      setTimeout(() => {
        if (refreshButtonRef.current) {
          refreshButtonRef.current.style.transform = "rotate(0deg)";
          refreshButtonRef.current.disabled = false;
        }
      }, 500);
    }
    await refetchData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">💰 Financial Dashboard</h1>
              <p className="text-blue-200 mt-1">
                {organization?.name || "Organization"} • Real-time financial
                overview
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <DataStatusIndicator
                hasRealData={hasRealData}
                lastUpdated={lastUpdated}
                isLoading={isLoading}
              />
              <button
                ref={refreshButtonRef}
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh data"
                style={{ transition: "transform 0.5s ease" }}
              >
                <span className="text-lg">🔄</span>
              </button>
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-lg">
                <span className="text-sm">🏢</span>
                <span className="text-sm font-medium">
                  {organization?.name}
                </span>
              </div>
              
              {/* Profile Dropdown */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-3 p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center relative">
                    {user?.profile_picture_url ? (
                      <img 
                        src={user.profile_picture_url} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                      </span>
                    )}
                    {isUpdatingProfile && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <CircularProgress size={16} style={{ color: 'white' }} />
                      </div>
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {user?.first_name || user?.email}
                  </span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="relative">
                          {user?.profile_picture_url ? (
                            <img 
                              src={user.profile_picture_url} 
                              alt="Profile" 
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <Avatar className="w-12 h-12 bg-blue-500">
                              {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                            </Avatar>
                          )}
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleProfilePictureUpdate}
                            accept="image/*"
                            className="hidden"
                          />
                          <button
                            onClick={triggerFileInput}
                            disabled={isUpdatingProfile}
                            className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs hover:bg-blue-700 transition-colors"
                            title="Change photo"
                          >
                            <CameraIcon fontSize="small" />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.first_name} {user?.last_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                          <p className="text-xs text-blue-600 mt-1">Financial User</p>
                        </div>
                      </div>
                      {organization && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <span>🏢</span>
                          <span className="truncate">{organization.name}</span>
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setIsProfileDialogOpen(true);
                        setIsProfileOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 gap-2"
                    >
                      <EditIcon fontSize="small" />
                      Edit Profile
                    </button>
                    <a
                      href="/dashboard/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 gap-2"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <span>⚙️</span>
                      Settings
                    </a>
                    <button
                      onClick={() => logout()}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100 gap-2"
                    >
                      <span>🚪</span>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        {/* Error Display */}
        {error && !error.includes("Already loading") && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={refetchData} />
            {!hasRealData && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> No financial data available. The dashboard will
                  update automatically when financial data is added to the system.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Loading overlay for background updates */}
        {isLoading && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Updating data...</span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <a
                  key={index}
                  href={action.path}
                  className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{action.icon}</span>
                    <span className="font-medium">{action.label}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <FinanceOverviewCard
              key={index}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              type={stat.type}
              trend={stat.trend}
              isLoading={isLoading}
            />
          ))}
        </div>

        {/* Additional Financial Metrics */}
        {additionalMetrics && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Financial Health Metrics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {additionalMetrics.profitMargin}
                </div>
                <div className="text-sm text-gray-600 mt-1">Profit Margin</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {additionalMetrics.revenueGrowth}
                </div>
                <div className="text-sm text-gray-600 mt-1">Revenue Growth</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {additionalMetrics.operatingMargin}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Operating Margin
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {additionalMetrics.currentRatio}
                </div>
                <div className="text-sm text-gray-600 mt-1">Current Ratio</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {additionalMetrics.debtToEquity}
                </div>
                <div className="text-sm text-gray-600 mt-1">Debt to Equity</div>
              </div>
            </div>
          </div>
        )}

        {/* Cash Flow Chart and Calculators */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cash Flow Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Cash Flow Projection
              </h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {cashFlowData.length} months
                </span>
                {!hasRealData && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    No Data
                  </span>
                )}
              </div>
            </div>
            <div className="w-full h-80 min-h-[320px]">
              {cashFlowData.length > 0 ? (
                <CashFlowChart data={cashFlowData} />
              ) : (
                <EmptyChartState />
              )}
            </div>
          </div>

          {/* Financial Calculators */}
          <div className="lg:col-span-1 space-y-6">
            {/* Calculator Toggle */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveCalculator("loan")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    activeCalculator === "loan"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Loan
                </button>
                <button
                  onClick={() => setActiveCalculator("investment")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    activeCalculator === "investment"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Investment
                </button>
              </div>
            </div>

            {/* Active Calculator */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              {activeCalculator === "loan" ? (
                <LoanCalculator organization={organization} />
              ) : (
                <InvestmentCalculator organization={organization} />
              )}
            </div>
          </div>
        </div>

        {/* Data Source Footer */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <span>Data Source:</span>
              {hasRealData ? (
                <span className="text-green-500 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Live Backend API
                </span>
              ) : (
                <span className="text-yellow-500 flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                  No Financial Data Available
                </span>
              )}
            </div>
            <div className="text-xs">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Recent Transactions Placeholder */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Recent Transactions
            </h2>
            <span className="text-sm text-gray-500">Last 30 days</span>
          </div>
          <div className="text-center py-8 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💳</span>
            </div>
            <p>Transaction data will appear here</p>
            <p className="text-sm mt-1">
              Integrate your financial ledger component
            </p>
          </div>
        </div>
      </div>

      {/* Profile Update Dialog */}
      <ProfileUpdateDialog
        open={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        user={user}
        onUpdate={handleProfileUpdate}
        isLoading={isUpdatingProfile}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default FinancialDashboard;
// src/stores/financeStore.js (New File - Recommended)
import { create } from 'zustand';
import { fetchFinancialStats } from '../services/api'; // Import the API call

const initialStats = {
  monthlyRevenue: 0,
  annualExpenses: 0,
  profitMargin: 0,
  pendingInvoices: 0
};

const initialReports = [];

const useFinanceStore = create((set, get) => ({
  financialStats: initialStats,
  financialReports: initialReports,
  financeLoading: false,
  financeError: null,

  getFinancialData: async (organizationId) => {
    set({ financeLoading: true, financeError: null });
    try {
      const data = await fetchFinancialStats(organizationId);
      
      // Assuming 'data' contains both 'stats' and 'reports'
      set({ 
        financialStats: data.stats || initialStats,
        financialReports: data.reports || initialReports,
      });

    } catch (error) {
      set({ financeError: 'Failed to load financial data.' });
      console.error(error);
    } finally {
      set({ financeLoading: false });
    }
  },
}));

export default useFinanceStore;
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/');
      return;
    }

    setUser(JSON.parse(userData));
    fetchFinancialSummary();
  }, []);

  const fetchFinancialSummary = async () => {
    try {
      const response = await fetch(`https://hbg-budget-app-7.onrender.com/api/public/financial-summary`);
      const data = await response.json();
      
      if (response.ok) {
        setFinancialSummary(data);
      } else {
        setError('Failed to load financial summary');
      }
    } catch (error) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>HBG Admin Dashboard - Homes Before Growth</title>
        <meta name="description" content="Admin dashboard for Homes Before Growth political party" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-bold">HBG</span>
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">Homes Before Growth</h1>
                  <p className="text-sm text-gray-600">Political Party Admin Dashboard</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">Welcome, {user?.name || user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Financial Summary Cards */}
          {financialSummary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Income */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <span className="text-green-600 text-xl font-bold">+</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Income</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(financialSummary.summary.totalIncome)}</p>
                  </div>
                </div>
              </div>

              {/* Total Expenses */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-full">
                    <span className="text-red-600 text-xl font-bold">-</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(financialSummary.summary.totalExpenses)}</p>
                  </div>
                </div>
              </div>

              {/* Net Position */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-full ${financialSummary.summary.netPosition >= 0 ? 'bg-blue-100' : 'bg-yellow-100'}`}>
                    <span className={`text-xl font-bold ${financialSummary.summary.netPosition >= 0 ? 'text-blue-600' : 'text-yellow-600'}`}>
                      =
                    </span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Net Position</p>
                    <p className={`text-2xl font-bold ${financialSummary.summary.netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(financialSummary.summary.netPosition)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Party Information */}
          {financialSummary && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Party Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Party Name</p>
                  <p className="text-lg text-gray-900">{financialSummary.party.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Financial Year</p>
                  <p className="text-lg text-gray-900">{financialSummary.financialYear}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">ABN</p>
                  <p className="text-lg text-gray-900">{financialSummary.party.abn || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Updated</p>
                  <p className="text-lg text-gray-900">
                    {new Date(financialSummary.lastUpdated).toLocaleDateString('en-AU')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => router.push('/transactions/add')}
                className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-green-600 text-2xl font-bold">+</span>
                  </div>
                  <p className="text-sm font-medium text-gray-600">Add Transaction</p>
                </div>
              </button>
              
              <button 
                onClick={() => router.push('/reports')}
                className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-blue-600 text-xl font-bold">📊</span>
                  </div>
                  <p className="text-sm font-medium text-gray-600">View Reports</p>
                </div>
              </button>
              
              <button 
                onClick={() => router.push('/categories')}
                className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
              >
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-purple-600 text-xl font-bold">⚙️</span>
                  </div>
                  <p className="text-sm font-medium text-gray-600">Manage Categories</p>
                </div>
              </button>
            </div>

            {/* Additional Management Section */}
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => router.push('/bank-accounts')}
                  className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 text-lg font-bold">🏦</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Bank Accounts</p>
                    <p className="text-xs text-gray-600">Manage your bank accounts</p>
                  </div>
                </button>
                
                <button
                  onClick={() => router.push('/transactions')}
                  className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-yellow-600 text-lg font-bold">📋</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">All Transactions</p>
                    <p className="text-xs text-gray-600">View transaction history</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 
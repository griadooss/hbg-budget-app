import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Reports() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/');
      return;
    }
    
    setUser(JSON.parse(userData));
    fetchReports(token);
  }, [router]);

  const fetchReports = async (token) => {
    try {
      // Get current financial year dates
      const now = new Date();
      const startDate = new Date(now.getFullYear(), 6, 1); // July 1st (Australian financial year)
      const endDate = new Date(now.getFullYear() + 1, 5, 30); // June 30th next year
      
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/reports/financial-summary?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        setError('Failed to fetch reports');
      }
    } catch (err) {
      setError('Network error. Please try again.');
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

  const downloadReport = async (type) => {
    try {
      const token = localStorage.getItem('token');
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/reports/export/transactions?format=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `hbg-financial-report.${type}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Financial Reports - HBG Budget</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-bold">HBG</span>
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
                  <p className="text-sm text-gray-600">View and export financial data</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm"
                >
                  ← Back to Dashboard
                </button>
                <span className="text-sm text-gray-700">Welcome, {user?.name || user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
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

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="mt-2 text-gray-600">Loading reports...</p>
            </div>
          ) : (
            <>
              {/* Export Options */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => downloadReport('csv')}
                    className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">📊</div>
                      <div className="font-medium">Export as CSV</div>
                      <div className="text-sm text-gray-600">Spreadsheet format</div>
                    </div>
                  </button>
                  

                  
                  <button
                    onClick={() => downloadReport('json')}
                    className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">💾</div>
                      <div className="font-medium">Export as JSON</div>
                      <div className="text-sm text-gray-600">Data format</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Financial Summary */}
              {reports && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-full">
                          <span className="text-green-600 text-xl font-bold">+</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Income</p>
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(reports.summary.totalIncome)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-red-100 rounded-full">
                          <span className="text-red-600 text-xl font-bold">-</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(reports.summary.totalExpenses)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-full">
                          <span className="text-blue-600 text-xl font-bold">=</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Net Position</p>
                          <p className={`text-2xl font-bold ${reports.summary.netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(reports.summary.netPosition)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                                     {/* Category Breakdown */}
                   {reports.expenseBreakdown && reports.expenseBreakdown.length > 0 && (
                     <div className="bg-white rounded-lg shadow p-6 mb-8">
                       <h2 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h2>
                       <div className="space-y-4">
                         {reports.expenseBreakdown.map((category, index) => (
                           <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                             <div>
                               <h3 className="font-medium text-gray-900">{category.categoryName}</h3>
                               <p className="text-sm text-gray-600">{category.transactionCount} transactions</p>
                             </div>
                             <div className="text-right">
                               <p className="font-bold text-gray-900">{formatCurrency(category.amount)}</p>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                                     {/* Recent Transactions */}
                   {false && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {reports.recentTransactions.map((transaction, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {new Date(transaction.transactionDate).toLocaleDateString('en-AU')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {transaction.description}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {transaction.category?.name || 'Uncategorized'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    transaction.type === 'INCOME' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {transaction.type}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                                  <span className={transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                                    {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* No Data Message */}
                  {(!reports || reports.summary.transactionCount === 0) && (
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                      <div className="text-gray-400 text-6xl mb-4">📊</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h3>
                      <p className="text-gray-600 mb-4">Add some transactions to see detailed reports and analytics.</p>
                      <button
                        onClick={() => router.push('/transactions/add')}
                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                      >
                        Add Your First Transaction
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
} 
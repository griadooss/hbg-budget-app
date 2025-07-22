import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function BankAccounts() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccount, setNewAccount] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    bsb: '',
    accountType: 'Cheque',
    openingBalance: '0'
  });

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/');
      return;
    }
    
    setUser(JSON.parse(userData));
    fetchBankAccounts(token);
  }, [router]);

  const fetchBankAccounts = async (token) => {
    try {
      const response = await fetch(`https://hbg-budget-app-7.onrender.com/api/bank-accounts`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data.bankAccounts || []);
      } else {
        setError('Failed to fetch bank accounts');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://hbg-budget-app-7.onrender.com/api/bank-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newAccount,
          openingBalance: parseFloat(newAccount.openingBalance || '0')
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Bank account added successfully!');
        setNewAccount({
          bankName: '',
          accountName: '',
          accountNumber: '',
          bsb: '',
          accountType: 'Cheque',
          openingBalance: '0'
        });
        setShowAddForm(false);
        fetchBankAccounts(); // Refresh the list
      } else {
        setError(data.message || 'Failed to add bank account');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!confirm('Are you sure you want to delete this bank account? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://hbg-budget-app-7.onrender.com/api/bank-accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess('Bank account deleted successfully!');
        fetchBankAccounts(); // Refresh the list
      } else {
        setError('Failed to delete bank account');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Bank Accounts - HBG Budget</title>
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
                  <h1 className="text-2xl font-bold text-gray-900">Bank Accounts</h1>
                  <p className="text-sm text-gray-600">Manage your organization's bank accounts</p>
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <div className="text-sm text-green-700">{success}</div>
            </div>
          )}

          {/* Add Account Button */}
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Bank Accounts</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              {showAddForm ? 'Cancel' : 'Add Bank Account'}
            </button>
          </div>

          {/* Add Account Form */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Bank Account</h3>
              <form onSubmit={handleAddAccount} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      id="bankName"
                      required
                      value={newAccount.bankName}
                      onChange={(e) => setNewAccount(prev => ({ ...prev, bankName: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., Commonwealth Bank, NAB, UBank"
                    />
                  </div>
                  <div>
                    <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
                      Account Name
                    </label>
                    <input
                      type="text"
                      id="accountName"
                      required
                      value={newAccount.accountName}
                      onChange={(e) => setNewAccount(prev => ({ ...prev, accountName: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., HBG Operating Account"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                      Account Number
                    </label>
                    <input
                      type="text"
                      id="accountNumber"
                      value={newAccount.accountNumber}
                      onChange={(e) => setNewAccount(prev => ({ ...prev, accountNumber: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., 123456789"
                    />
                  </div>
                  <div>
                    <label htmlFor="bsb" className="block text-sm font-medium text-gray-700">
                      BSB
                    </label>
                    <input
                      type="text"
                      id="bsb"
                      value={newAccount.bsb}
                      onChange={(e) => setNewAccount(prev => ({ ...prev, bsb: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., 062-000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="accountType" className="block text-sm font-medium text-gray-700">
                      Account Type
                    </label>
                    <select
                      id="accountType"
                      value={newAccount.accountType}
                      onChange={(e) => setNewAccount(prev => ({ ...prev, accountType: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="Cheque">Cheque Account</option>
                      <option value="Savings">Savings Account</option>
                      <option value="Cash">Cash/Petty Cash</option>
                      <option value="Term Deposit">Term Deposit</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="openingBalance" className="block text-sm font-medium text-gray-700">
                      Opening Balance (AUD)
                    </label>
                    <div className="mt-1 relative">
                      <span className="absolute left-3 top-3 text-gray-500">$</span>
                      <input
                        type="number"
                        id="openingBalance"
                        step="0.01"
                        value={newAccount.openingBalance}
                        onChange={(e) => setNewAccount(prev => ({ ...prev, openingBalance: e.target.value }))}
                        className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Add Account
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Bank Accounts List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="mt-2 text-gray-600">Loading bank accounts...</p>
            </div>
          ) : bankAccounts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bankAccounts.map((account) => (
                <div key={account.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">🏦</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        account.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {account.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{account.bankName}</h3>
                  <p className="text-sm text-gray-600 mb-1">{account.accountName}</p>
                  <p className="text-sm text-gray-500 mb-4">{account.accountType}</p>
                  
                  {account.accountNumber && (
                    <p className="text-sm text-gray-500 mb-1">Account: {account.accountNumber}</p>
                  )}
                  {account.bsb && (
                    <p className="text-sm text-gray-500 mb-4">BSB: {account.bsb}</p>
                  )}
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Current Balance</span>
                      <span className={`text-lg font-bold ${
                        Number(account.currentBalance) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(account.currentBalance)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-gray-400 text-6xl mb-4">🏦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Bank Accounts Yet</h3>
              <p className="text-gray-600 mb-4">Add your first bank account to start tracking transactions.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
              >
                Add Your First Account
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 
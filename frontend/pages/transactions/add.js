import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function AddTransaction() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [formData, setFormData] = useState({
    type: 'EXPENSE',
    amount: '',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    subCategoryId: '',
    bankAccountId: '',
    reference: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/');
      return;
    }
    
    setUser(JSON.parse(userData));
    fetchInitialData(token);
  }, [router]);

  const fetchInitialData = async (token) => {
    try {
      // Fetch categories, subcategories, and bank accounts
      const [categoriesRes, bankAccountsRes] = await Promise.all([
        fetch('http://localhost:4000/api/categories', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:4000/api/bank-accounts', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }

      if (bankAccountsRes.ok) {
        const bankAccountsData = await bankAccountsRes.json();
        setBankAccounts(bankAccountsData.bankAccounts || []);
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  };

  const handleCategoryChange = async (categoryId) => {
    setFormData(prev => ({ ...prev, categoryId, subCategoryId: '' }));
    
    if (categoryId) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:4000/api/categories/${categoryId}/subcategories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const subCategoriesData = await response.json();
          setSubCategories(subCategoriesData);
        }
      } catch (err) {
        console.error('Error fetching subcategories:', err);
      }
    } else {
      setSubCategories([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const requestData = {
        date: new Date(formData.transactionDate).toISOString(),
        description: formData.description,
        amount: parseFloat(formData.amount),
        isIncome: formData.type === 'INCOME',
        bankAccountId: formData.bankAccountId,
        categoryId: formData.categoryId || null,
        subCategoryId: formData.subCategoryId || null,
        reference: formData.reference || null,
        notes: formData.notes || null,
      };
      
      console.log('Submitting transaction data:', requestData);
      
      const response = await fetch('http://localhost:4000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Transaction added successfully!');
        // Reset form
        setFormData({
          type: 'EXPENSE',
          amount: '',
          description: '',
          transactionDate: new Date().toISOString().split('T')[0],
          categoryId: '',
          subCategoryId: '',
          bankAccountId: '',
          reference: '',
          notes: ''
        });
        setSubCategories([]);
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        const errorMessage = data.message || 'Failed to add transaction';
        const errorDetails = data.errors ? ': ' + data.errors.map(e => e.msg).join(', ') : '';
        setError(errorMessage + errorDetails);
      }
    } catch (err) {
      console.error('Transaction submission error:', err);
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

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Add Transaction - HBG Budget</title>
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
                  <h1 className="text-2xl font-bold text-gray-900">Add Transaction</h1>
                  <p className="text-sm text-gray-600">Record income or expense</p>
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'INCOME' }))}
                    className={`p-4 rounded-lg border-2 text-center transition-colors ${
                      formData.type === 'INCOME'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-green-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">💰</div>
                    <div className="font-medium">Income</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'EXPENSE' }))}
                    className={`p-4 rounded-lg border-2 text-center transition-colors ${
                      formData.type === 'EXPENSE'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-red-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">💸</div>
                    <div className="font-medium">Expense</div>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount (AUD)
                </label>
                <div className="mt-1 relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    id="amount"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Brief description of the transaction"
                />
              </div>

              {/* Date */}
              <div>
                <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700">
                  Transaction Date
                </label>
                <input
                  type="date"
                  id="transactionDate"
                  required
                  value={formData.transactionDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, transactionDate: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="categoryId"
                  required
                  value={formData.categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select a category</option>
                  {categories && categories.length > 0 ? categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  )) : (
                    <option value="" disabled>No categories available</option>
                  )}
                </select>
              </div>

              {/* Subcategory */}
              {subCategories.length > 0 && (
                <div>
                  <label htmlFor="subCategoryId" className="block text-sm font-medium text-gray-700">
                    Subcategory
                  </label>
                  <select
                    id="subCategoryId"
                    value={formData.subCategoryId}
                    onChange={(e) => setFormData(prev => ({ ...prev, subCategoryId: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                                      <option value="">Select a subcategory (optional)</option>
                  {subCategories && subCategories.length > 0 ? subCategories.map(subCategory => (
                    <option key={subCategory.id} value={subCategory.id}>
                      {subCategory.name}
                    </option>
                  )) : (
                    <option value="" disabled>No subcategories available</option>
                  )}
                  </select>
                </div>
              )}

              {/* Bank Account */}
              <div>
                <label htmlFor="bankAccountId" className="block text-sm font-medium text-gray-700">
                  Bank Account
                </label>
                <select
                  id="bankAccountId"
                  required
                  value={formData.bankAccountId}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankAccountId: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select a bank account</option>
                  {bankAccounts && bankAccounts.length > 0 ? bankAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.accountName} - {account.accountNumber}
                    </option>
                  )) : (
                    <option value="" disabled>No bank accounts available</option>
                  )}
                </select>
              </div>

              {/* Reference */}
              <div>
                <label htmlFor="reference" className="block text-sm font-medium text-gray-700">
                  Reference (optional)
                </label>
                <input
                  type="text"
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Invoice number, receipt ID, etc."
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Additional notes about this transaction"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
} 
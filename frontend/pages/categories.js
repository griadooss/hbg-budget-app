import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Categories() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/');
      return;
    }
    
    setUser(JSON.parse(userData));
    fetchCategories(token);
  }, [router]);

  const fetchCategories = async (token) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/categories`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        setError('Failed to fetch categories');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCategory)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Category added successfully!');
        setNewCategory({ name: '', description: '' });
        setShowAddForm(false);
        fetchCategories(); // Refresh the list
      } else {
        setError(data.message || 'Failed to add category');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all associated subcategories.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess('Category deleted successfully!');
        fetchCategories(); // Refresh the list
      } else {
        setError('Failed to delete category');
      }
    } catch (err) {
      setError('Network error. Please try again.');
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
        <title>Manage Categories - HBG Budget</title>
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
                  <h1 className="text-2xl font-bold text-gray-900">Manage Categories</h1>
                  <p className="text-sm text-gray-600">Organize your income and expense categories</p>
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

          {/* Add Category Button */}
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              {showAddForm ? 'Cancel' : 'Add Category'}
            </button>
          </div>

          {/* Add Category Form */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Category</h3>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Category Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Campaign Expenses, Donations, Office Supplies"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description (optional)
                  </label>
                  <textarea
                    id="description"
                    rows="3"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    placeholder="Brief description of what this category includes"
                  />
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
                    Add Category
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Categories List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="mt-2 text-gray-600">Loading categories...</p>
            </div>
          ) : categories.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="divide-y divide-gray-200">
                {categories.map((category) => (
                  <div key={category.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                        {category.description && (
                          <p className="mt-1 text-sm text-gray-600">{category.description}</p>
                        )}
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>Created: {category.createdAt ? new Date(category.createdAt).toLocaleDateString('en-AU') : 'System Default'}</span>
                          {category.subCategories && category.subCategories.length > 0 && (
                            <span>{category.subCategories.length} subcategories</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => router.push(`/categories/${category.id}/subcategories`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Manage Subcategories
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Show subcategories if they exist */}
                    {category.subCategories && category.subCategories.length > 0 && (
                      <div className="mt-4 pl-4 border-l-2 border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Subcategories:</h4>
                        <div className="space-y-1">
                          {category.subCategories.map((sub) => (
                            <div key={sub.id} className="text-sm text-gray-600">
                              • {sub.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-gray-400 text-6xl mb-4">📂</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Yet</h3>
              <p className="text-gray-600 mb-4">Create your first category to start organizing your political party finances.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
              >
                Add Your First Category
              </button>
            </div>
          )}

          {/* Category Guidelines */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">💡 Category Guidelines</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>Common Political Party Categories:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Income:</strong> Donations, Membership Fees, Fundraising Events, Government Funding</li>
                <li><strong>Campaign:</strong> Advertising, Event Costs, Campaign Materials, Venue Hire</li>
                <li><strong>Operations:</strong> Office Rent, Utilities, Phone, Internet, Insurance</li>
                <li><strong>Administration:</strong> Banking Fees, Accounting, Legal, IT Services</li>
                <li><strong>Travel:</strong> Accommodation, Transport, Meals (for official business)</li>
                <li><strong>Staff:</strong> Wages, Superannuation, Training, Recruitment</li>
              </ul>
              <p className="mt-3"><strong>Tip:</strong> Create broad categories first, then add specific subcategories as needed.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 
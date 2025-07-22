import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Subcategories() {
  const router = useRouter();
  const { categoryId } = router.query;
  
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubcategory, setNewSubcategory] = useState({
    name: '',
    description: '',
  });
  const [editingSubcategory, setEditingSubcategory] = useState(null);

  useEffect(() => {
    if (categoryId) {
      fetchCategory();
      fetchSubcategories();
    }
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://hbg-budget-app-7.onrender.com/api/categories/${categoryId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const categoryData = await response.json();
        setCategory(categoryData);
      } else {
        setError('Failed to load category');
      }
    } catch (err) {
      setError('Connection error loading category');
    }
  };

  const fetchSubcategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://hbg-budget-app-7.onrender.com/api/categories/${categoryId}/subcategories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubcategories(data);
      } else {
        setError('Failed to load subcategories');
      }
    } catch (err) {
      setError('Connection error loading subcategories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubcategory = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://hbg-budget-app-7.onrender.com/api/categories/${categoryId}/subcategories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newSubcategory),
      });

      if (response.ok) {
        setNewSubcategory({ name: '', description: '' });
        setShowAddForm(false);
        fetchSubcategories();
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to add subcategory');
      }
    } catch (err) {
      setError('Connection error. Please make sure the backend server is running.');
    }
  };

  const handleUpdateSubcategory = async (subcategoryId, updatedData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://hbg-budget-app-7.onrender.com/api/subcategories/${subcategoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        setEditingSubcategory(null);
        fetchSubcategories();
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update subcategory');
      }
    } catch (err) {
      setError('Connection error. Please make sure the backend server is running.');
    }
  };

  const handleDeleteSubcategory = async (subcategoryId) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://hbg-budget-app-7.onrender.com/api/subcategories/${subcategoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchSubcategories();
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete subcategory');
      }
    } catch (err) {
      setError('Connection error. Please make sure the backend server is running.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading subcategories...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {category ? `${category.name} - Subcategories` : 'Subcategories'}
              </h1>
              <p className="text-gray-600 mt-2">
                {category ? category.description : 'Manage subcategories for this category'}
              </p>
            </div>
            <div className="space-x-4">
              <button
                onClick={() => router.push('/categories')}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Back to Categories
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Add Subcategory
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Add Subcategory Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Add New Subcategory</h2>
            <form onSubmit={handleAddSubcategory}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newSubcategory.name}
                    onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newSubcategory.description}
                    onChange={(e) => setNewSubcategory({ ...newSubcategory, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex space-x-4 mt-4">
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  Add Subcategory
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Subcategories List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Current Subcategories</h2>
            {subcategories.length === 0 ? (
              <p className="text-gray-500">No subcategories found for this category.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Code</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subcategories.map((subcategory) => (
                      <tr key={subcategory.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{subcategory.code}</td>
                        <td className="py-3 px-4">
                          {editingSubcategory?.id === subcategory.id ? (
                            <input
                              type="text"
                              value={editingSubcategory.name}
                              onChange={(e) => setEditingSubcategory({ ...editingSubcategory, name: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                          ) : (
                            subcategory.name
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {editingSubcategory?.id === subcategory.id ? (
                            <input
                              type="text"
                              value={editingSubcategory.description || ''}
                              onChange={(e) => setEditingSubcategory({ ...editingSubcategory, description: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                          ) : (
                            subcategory.description || 'No description'
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {editingSubcategory?.id === subcategory.id ? (
                            <div className="space-x-2">
                              <button
                                onClick={() => handleUpdateSubcategory(subcategory.id, editingSubcategory)}
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingSubcategory(null)}
                                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="space-x-2">
                              <button
                                onClick={() => setEditingSubcategory(subcategory)}
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSubcategory(subcategory.id)}
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
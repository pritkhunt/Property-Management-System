import React, { useState, useEffect } from 'react';
import { propertyAPI } from '../services/api';
import toast from 'react-hot-toast';
import debugAPI from '../utils/apiDebug';

const TestBackendConnection = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');

  // Test API connection on component mount
  useEffect(() => {
    checkAPIConnection();
    fetchProperties();
  }, []);

  const checkAPIConnection = async () => {
    try {
      // Try to fetch properties to check if API is reachable
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://localhost:7073/api'}/properties`);
      if (response.ok) {
        setApiStatus('connected');
        toast.success('Successfully connected to .NET backend!');
      } else {
        setApiStatus('error');
        toast.error('API is reachable but returned an error');
      }
    } catch (err) {
      setApiStatus('disconnected');
      toast.error('Cannot connect to .NET backend. Make sure it\'s running on https://localhost:7073');
      console.error('Connection error:', err);
    }
  };

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await propertyAPI.getProperties();
      setProperties(response.data || response);
      toast.success(`Fetched ${response.data?.length || response.length || 0} properties`);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching properties:', err);
      if (err.response?.status === 0) {
        toast.error('Cannot connect to backend. Please ensure the .NET API is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const createTestProperty = async () => {
    try {
      const testProperty = {
        UserId: 'USR001',
        Type: 'sale',
        Description: 'This is a test property created from React frontend',
        PropertyImage: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400',
        Address: '123 Test Street, Sector 5',
        City: 'Mumbai',
        State: 'Maharashtra',
        Size: 1200,
        Price: 9500000,
        PropertyAge: '3 years',
        PropertyType: 'Apartment',
        Facing: 'East',
        HouseType: 'Multi-story',
        Facility: 'Parking,Lift,Security,Gym',
        Furnishing: 'Semi-Furnished',
        Status: 'available',
        MobileNo: '+91-9999999999',
        Email: 'test@property.com',
        AgentId: 'AGT001',
        Bedrooms: 3,
        Bathrooms: 2
      };

      const response = await propertyAPI.createProperty(testProperty);
      toast.success('Test property created successfully!');
      fetchProperties(); // Refresh the list
    } catch (err) {
      toast.error('Failed to create property: ' + (err.response?.data?.message || err.message));
      console.error('Create error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Backend Connection Test
          </h1>
          <p className="text-gray-600">
            Testing connection to .NET API at: {process.env.REACT_APP_API_URL || 'https://localhost:7073/api'}
          </p>
          
          {/* Connection Status */}
          <div className="mt-4 flex items-center space-x-2">
            <span className="text-sm font-medium">API Status:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              apiStatus === 'connected' ? 'bg-green-100 text-green-800' :
              apiStatus === 'disconnected' ? 'bg-red-100 text-red-800' :
              apiStatus === 'checking' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {apiStatus === 'connected' ? '✅ Connected' :
               apiStatus === 'disconnected' ? '❌ Disconnected' :
               apiStatus === 'checking' ? '⏳ Checking...' :
               '⚠️ Error'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={fetchProperties}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Loading...' : 'Fetch Properties'}
            </button>
            <button
              onClick={createTestProperty}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Create Test Property
            </button>
            <button
              onClick={checkAPIConnection}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Check Connection
            </button>
            <button
              onClick={async () => {
                console.clear();
                await debugAPI.runFullDiagnostic();
                toast.info('Check browser console for diagnostic results');
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Run Diagnostic (Console)
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-1">Error:</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Properties Display */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">
            Properties ({properties.length})
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((property, index) => (
                <div key={property.Id || property.id || index} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold text-lg mb-2">
                    {property.PropertyType || property.propertyType || 'Property'} in {property.City || property.city}
                  </h3>
                  <p className="text-gray-600 mb-1">
                    📍 {property.Address || property.address || 'No address'}
                  </p>
                  <p className="text-gray-600 mb-1">
                    🌆 {property.City || property.city}, {property.State || property.state}
                  </p>
                  {(property.Price || property.price) && (
                    <p className="text-gray-600 mb-1">
                      💰 {property.Type === 'rent' ? 'Rent: ' : 'Price: '}₹{(property.Price || property.price).toLocaleString('en-IN')}
                      {property.Type === 'rent' ? '/month' : ''}
                    </p>
                  )}
                  {(property.Size || property.size) && (
                    <p className="text-gray-600 mb-1">
                      📐 Size: {property.Size || property.size} sq.ft
                    </p>
                  )}
                  {(property.Bedrooms || property.bedrooms) && (
                    <p className="text-gray-600 mb-1">
                      🛏️ {property.Bedrooms || property.bedrooms} BHK
                    </p>
                  )}
                  {(property.Furnishing || property.furnishing) && (
                    <p className="text-gray-600 mb-1">
                      🪑 {property.Furnishing || property.furnishing}
                    </p>
                  )}
                  <div className="mt-3 pt-3 border-t">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      property.Status === 'available' || property.isAvailable
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {property.Status || (property.isAvailable ? 'available' : 'not available')}
                    </span>
                    {property.Type && (
                      <span className="ml-2 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {property.Type}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No properties found.</p>
              <p className="text-sm">Try creating a test property or check if your backend is running.</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">📝 Setup Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Make sure your .NET backend is running on https://localhost:7073</li>
            <li>Check that CORS is configured in your Program.cs</li>
            <li>Ensure the PropertiesController is accessible at /api/properties</li>
            <li>If using HTTPS, you may need to trust the development certificate</li>
            <li>Check browser console for detailed error messages</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TestBackendConnection;

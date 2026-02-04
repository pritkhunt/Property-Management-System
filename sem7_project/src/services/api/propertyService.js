import axiosInstance from './axiosInstance';

// Property API service
class PropertyService {
  // Get all properties with optional query parameters
  async getProperties(params = {}) {
    const response = await axiosInstance.get('/properties', { params });
    return response.data;
  }

  // Get single property by ID
  async getPropertyById(id) {
    const response = await axiosInstance.get(`/properties/${id}`);
    return response.data;
  }

  // Create new property
  async createProperty(propertyData) {
    const response = await axiosInstance.post('/properties', propertyData);
    return response.data;
  }

  // Update property
  async updateProperty(id, propertyData) {
    const response = await axiosInstance.put(`/properties/${id}`, propertyData);
    return response.data;
  }

  // Delete property
  async deleteProperty(id) {
    const response = await axiosInstance.delete(`/properties/${id}`);
    return response.data;
  }

  // Upload property images
  async uploadPropertyImages(id, formData) {
    const response = await axiosInstance.post(`/properties/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Delete property image
  async deletePropertyImage(propertyId, imageId) {
    const response = await axiosInstance.delete(`/properties/${propertyId}/images/${imageId}`);
    return response.data;
  }

  // Get properties by owner
  async getPropertiesByOwner(ownerId) {
    const response = await axiosInstance.get(`/properties/owner/${ownerId}`);
    return response.data;
  }

  // Get available properties
  async getAvailableProperties() {
    const response = await axiosInstance.get('/properties/available');
    return response.data;
  }

  // Search properties
  async searchProperties(searchCriteria) {
    const response = await axiosInstance.post('/properties/search', searchCriteria);
    return response.data;
  }
}

export default new PropertyService();

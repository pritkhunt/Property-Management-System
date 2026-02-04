import axiosInstance from './axiosInstance';

// Owner API service
class OwnerService {
  // Get all owners
  async getOwners(params = {}) {
    const response = await axiosInstance.get('/owners', { params });
    return response.data;
  }

  // Get single owner by ID
  async getOwnerById(id) {
    const response = await axiosInstance.get(`/owners/${id}`);
    return response.data;
  }

  // Create new owner
  async createOwner(ownerData) {
    const response = await axiosInstance.post('/owners', ownerData);
    return response.data;
  }

  // Update owner
  async updateOwner(id, ownerData) {
    const response = await axiosInstance.put(`/owners/${id}`, ownerData);
    return response.data;
  }

  // Delete owner
  async deleteOwner(id) {
    const response = await axiosInstance.delete(`/owners/${id}`);
    return response.data;
  }

  // Get owner's properties
  async getOwnerProperties(id) {
    const response = await axiosInstance.get(`/owners/${id}/properties`);
    return response.data;
  }

  // Get owner's financial summary
  async getOwnerFinancialSummary(id) {
    const response = await axiosInstance.get(`/owners/${id}/financial-summary`);
    return response.data;
  }

  // Search owners
  async searchOwners(searchTerm) {
    const response = await axiosInstance.get(`/owners/search?term=${searchTerm}`);
    return response.data;
  }
}

export default new OwnerService();

import axiosInstance from './axiosInstance';

// Tenant API service
class TenantService {
  // Get all tenants
  async getTenants(params = {}) {
    const response = await axiosInstance.get('/tenants', { params });
    return response.data;
  }

  // Get single tenant by ID
  async getTenantById(id) {
    const response = await axiosInstance.get(`/tenants/${id}`);
    return response.data;
  }

  // Create new tenant
  async createTenant(tenantData) {
    const response = await axiosInstance.post('/tenants', tenantData);
    return response.data;
  }

  // Update tenant
  async updateTenant(id, tenantData) {
    const response = await axiosInstance.put(`/tenants/${id}`, tenantData);
    return response.data;
  }

  // Delete tenant
  async deleteTenant(id) {
    const response = await axiosInstance.delete(`/tenants/${id}`);
    return response.data;
  }

  // Get tenant's leases
  async getTenantLeases(id) {
    const response = await axiosInstance.get(`/tenants/${id}/leases`);
    return response.data;
  }

  // Get tenant's payments
  async getTenantPayments(id) {
    const response = await axiosInstance.get(`/tenants/${id}/payments`);
    return response.data;
  }

  // Get active tenants
  async getActiveTenants() {
    const response = await axiosInstance.get('/tenants/active');
    return response.data;
  }

  // Search tenants
  async searchTenants(searchTerm) {
    const response = await axiosInstance.get(`/tenants/search?term=${searchTerm}`);
    return response.data;
  }
}

export default new TenantService();

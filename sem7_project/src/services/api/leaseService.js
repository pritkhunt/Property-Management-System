import axiosInstance from './axiosInstance';

// Lease API service
class LeaseService {
  // Get all leases
  async getLeases(params = {}) {
    const response = await axiosInstance.get('/leases', { params });
    return response.data;
  }

  // Get single lease by ID
  async getLeaseById(id) {
    const response = await axiosInstance.get(`/leases/${id}`);
    return response.data;
  }

  // Create new lease
  async createLease(leaseData) {
    const response = await axiosInstance.post('/leases', leaseData);
    return response.data;
  }

  // Update lease
  async updateLease(id, leaseData) {
    const response = await axiosInstance.put(`/leases/${id}`, leaseData);
    return response.data;
  }

  // Delete/Terminate lease
  async terminateLease(id, reason) {
    const response = await axiosInstance.post(`/leases/${id}/terminate`, { reason });
    return response.data;
  }

  // Renew lease
  async renewLease(id, renewalData) {
    const response = await axiosInstance.post(`/leases/${id}/renew`, renewalData);
    return response.data;
  }

  // Get active leases
  async getActiveLeases() {
    const response = await axiosInstance.get('/leases/active');
    return response.data;
  }

  // Get expiring leases
  async getExpiringLeases(days = 30) {
    const response = await axiosInstance.get(`/leases/expiring?days=${days}`);
    return response.data;
  }

  // Get lease by property
  async getLeasesByProperty(propertyId) {
    const response = await axiosInstance.get(`/leases/property/${propertyId}`);
    return response.data;
  }

  // Get lease by tenant
  async getLeasesByTenant(tenantId) {
    const response = await axiosInstance.get(`/leases/tenant/${tenantId}`);
    return response.data;
  }

  // Generate lease document
  async generateLeaseDocument(id) {
    const response = await axiosInstance.get(`/leases/${id}/document`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export default new LeaseService();

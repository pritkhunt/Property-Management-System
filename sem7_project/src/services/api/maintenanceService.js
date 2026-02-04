import axiosInstance from './axiosInstance';

// Maintenance Request API service
class MaintenanceService {
  // Get all maintenance requests
  async getMaintenanceRequests(params = {}) {
    const response = await axiosInstance.get('/maintenance', { params });
    return response.data;
  }

  // Get single maintenance request by ID
  async getMaintenanceRequestById(id) {
    const response = await axiosInstance.get(`/maintenance/${id}`);
    return response.data;
  }

  // Create new maintenance request
  async createMaintenanceRequest(requestData) {
    const response = await axiosInstance.post('/maintenance', requestData);
    return response.data;
  }

  // Update maintenance request
  async updateMaintenanceRequest(id, requestData) {
    const response = await axiosInstance.put(`/maintenance/${id}`, requestData);
    return response.data;
  }

  // Delete maintenance request
  async deleteMaintenanceRequest(id) {
    const response = await axiosInstance.delete(`/maintenance/${id}`);
    return response.data;
  }

  // Update request status
  async updateRequestStatus(id, status, notes = '') {
    const response = await axiosInstance.patch(`/maintenance/${id}/status`, { status, notes });
    return response.data;
  }

  // Assign maintenance request to staff
  async assignRequest(id, assignedTo) {
    const response = await axiosInstance.patch(`/maintenance/${id}/assign`, { assignedTo });
    return response.data;
  }

  // Get requests by property
  async getRequestsByProperty(propertyId) {
    const response = await axiosInstance.get(`/maintenance/property/${propertyId}`);
    return response.data;
  }

  // Get requests by tenant
  async getRequestsByTenant(tenantId) {
    const response = await axiosInstance.get(`/maintenance/tenant/${tenantId}`);
    return response.data;
  }

  // Get pending requests
  async getPendingRequests() {
    const response = await axiosInstance.get('/maintenance/pending');
    return response.data;
  }

  // Get emergency requests
  async getEmergencyRequests() {
    const response = await axiosInstance.get('/maintenance/emergency');
    return response.data;
  }

  // Upload maintenance images
  async uploadMaintenanceImages(id, formData) {
    const response = await axiosInstance.post(`/maintenance/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Add maintenance note
  async addMaintenanceNote(id, note) {
    const response = await axiosInstance.post(`/maintenance/${id}/notes`, { note });
    return response.data;
  }
}

export default new MaintenanceService();

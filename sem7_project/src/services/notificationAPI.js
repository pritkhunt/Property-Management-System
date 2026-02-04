import backendAPI from './backendAPI';

export const notificationAPI = {
  // Get all notifications for current user
  getAllNotifications: async () => {
    const response = await backendAPI.get('/notifications');
    return response.data;
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await backendAPI.get('/notifications/unread-count');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await backendAPI.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await backendAPI.put('/notifications/mark-all-read');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await backendAPI.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Create notification (for admin/internal use)
  createNotification: async (notificationData) => {
    const response = await backendAPI.post('/notifications/create', notificationData);
    return response.data;
  }
};

export default notificationAPI;

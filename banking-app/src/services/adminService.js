import api from './api';

export const adminService = {
  getDashboard:        ()           => api.get('/admin/dashboard').then(r => r.data),
  getUsers:            (params)     => api.get('/admin/users', { params }).then(r => r.data),
  suspendUser:         (id)         => api.put(`/admin/users/${id}/suspend`).then(r => r.data),
  restoreUser:         (id)         => api.put(`/admin/users/${id}/restore`).then(r => r.data),
  deleteUser:          (id)         => api.delete(`/admin/users/${id}`).then(r => r.data),
  approveUser:         (id)         => api.put(`/admin/users/${id}/approve`).then(r => r.data),
  fundAccount:         (id, data)   => api.post(`/admin/users/${id}/fund`, data).then(r => r.data),
  getTransactions:     (params)     => api.get('/admin/transactions', { params }).then(r => r.data),
  getSettings:         ()           => api.get('/admin/settings').then(r => r.data),
  updateSettings:      (data)       => api.put('/admin/settings', data).then(r => r.data),
};
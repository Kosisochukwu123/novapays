import api from './api';

export const userService = {
  getDashboard:      () => api.get('/user/dashboard').then(r => r.data),
  getTransactions:   (params) => api.get('/user/transactions', { params }).then(r => r.data),
  transfer:          (data) => api.post('/user/transfer', data).then(r => r.data),
  getProfile:        () => api.get('/user/profile').then(r => r.data),
  updateProfile:     (data) => api.put('/user/profile', data).then(r => r.data),
  changePassword:    (data) => api.put('/user/change-password', data).then(r => r.data),
};
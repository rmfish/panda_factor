import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userId: localStorage.getItem('userid') || ''
  }),
  actions: {
    setAuth({ token, userId }) {
      this.token = token;
      this.userId = userId;
      localStorage.setItem('token', token);
      localStorage.setItem('userid', userId);
    },
    clearAuth() {
      this.token = '';
      this.userId = '';
      localStorage.removeItem('token');
      localStorage.removeItem('userid');
    }
  }
});

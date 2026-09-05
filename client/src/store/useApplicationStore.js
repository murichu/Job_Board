import { create } from 'zustand';

import axios from 'axios';

const api = axios.create({ timeout: 15000 });

export const useApplicationStore = create((set, get) => ({
  applications: [],
  loading: false,
  error: null,

  fetchApplications: async (backendUrl, token) => {
    set({ loading: true });
    try {
      const { data } = await api.get(`${backendUrl}/api/application/my-applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ applications: data.applications || [], error: null });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch applications' });
    } finally {
      set({ loading: false });
    }
  },

  submitApplication: async (backendUrl, token, jobId, data) => {
    try {
      const res = await api.post(`${backendUrl}/api/application/apply`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch (error) {
      throw error;
    }
  }
}));

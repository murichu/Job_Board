import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

const api = axios.create({
  timeout: 15000,
});

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      company: null,
      token: null,
      companyToken: null,

      setUser: (userData) => set({ user: userData }),
      setCompany: (companyData) => set({ company: companyData }),

      setToken: (token) => set({ token }),
      setCompanyToken: (companyToken) => set({ companyToken }),

      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem('Token');
        toast.success('Logged out successfully'); // assume toast imported or use window
      },

      logoutCompany: () => {
        set({ company: null, companyToken: null });
        localStorage.removeItem('companyToken');
        toast.success('Signed out successfully');
      },

      fetchUserData: async (backendUrl) => {
        try {
          const { data } = await api.get(`${backendUrl}/api/user/user`);
          if (data.success) {
            set({ user: data.user });
          }
        } catch (error) {
          if (error.response?.status !== 401) console.error(error);
        }
      },

      fetchCompanyData: async (backendUrl) => {
        try {
          const { data } = await api.get(`${backendUrl}/api/company/company`);
          if (data.success) {
            set({ company: data.company });
          }
        } catch (error) {
          if (error.response?.status !== 401) console.error(error);
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, companyToken: state.companyToken }),
    }
  )
);

import { create } from 'zustand';

export const useModalStore = create((set) => ({
  isOpen: false,
  modalType: null, // 'login', 'apply', 'post-job', etc.
  modalData: null,

  openModal: (type, data = null) => set({ isOpen: true, modalType: type, modalData: data }),
  closeModal: () => set({ isOpen: false, modalType: null, modalData: null }),
}));

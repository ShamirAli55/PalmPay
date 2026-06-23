import { create } from 'zustand';
import api from '../api';
import { toast } from 'react-hot-toast';

export const usePalmStore = create((set) => ({
    enrolling: false,
    verifying: false,
    palmEnrolled: false,

    fetchPalmStatus: async (clerkId) => {
        try {
            const res = await api.get(`/users/${clerkId}`);
            set({ palmEnrolled: res.data.palmEnrolled });
        } catch (err) {
            console.error('Fetch palm status error:', err);
        }
    },

    // Single-scan enroll: one image → fully enrolled, no multi-step
    enroll: async (clerkId, imageBlob) => {
        set({ enrolling: true });
        const formData = new FormData();
        formData.append('file', imageBlob, 'palm.jpg');
        formData.append('clerkId', clerkId);

        try {
            const res = await api.post(`/palm/enroll`, formData);
            set({ enrolling: false, palmEnrolled: true });
            toast.success('Palm enrolled successfully', { id: 'palm-enroll' });
            return true;
        } catch (err) {
            set({ enrolling: false });
            toast.error('Palm enrollment failed', { id: 'palm-enroll-error' });
            return false;
        }
    },

    verify: async (clerkId, imageBlob) => {
        set({ verifying: true });
        const formData = new FormData();
        formData.append('file', imageBlob, 'verify.jpg');
        formData.append('clerkId', clerkId);

        try {
            const res = await api.post(`/palm/verify`, formData);
            set({ verifying: false });
            if (res.data.accepted) {
                toast.success('Identity verified', { id: 'palm-verify-status' });
            } else {
                toast.error('Verification failed — try again', { id: 'palm-verify-status' });
            }
            return res.data;
        } catch (err) {
            set({ verifying: false });
            toast.error('Palm server error', { id: 'palm-verify-error' });
            return null;
        }
    }
}));

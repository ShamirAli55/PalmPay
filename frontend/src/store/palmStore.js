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

    // Multi-sample enroll: returns full API response so scanner can track progress
    enroll: async (clerkId, imageBlob) => {
        set({ enrolling: true });
        const formData = new FormData();
        formData.append('file', imageBlob, 'palm.jpg');
        formData.append('clerkId', clerkId);

        try {
            const res = await api.post(`/palm/enroll`, formData);
            set({ enrolling: false });
            // Only mark as fully enrolled once backend says ready
            if (res.data.ready) {
                set({ palmEnrolled: true });
                toast.success('Palm enrolled!', { id: 'palm-enroll' });
            } else {
                toast.success(res.data.message || `Sample ${res.data.samples} captured`, { id: 'palm-enroll' });
            }
            return res.data;   // { status, samples, max_samples, ready, message }
        } catch (err) {
            set({ enrolling: false });
            toast.error('Palm enrollment failed', { id: 'palm-enroll-error' });
            return null;
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
    },

    // Multi-frame verify: sends N frames captured in one 'long scan' for better accuracy
    verifyMulti: async (clerkId, imageBlobs) => {
        set({ verifying: true });
        const formData = new FormData();
        formData.append('clerkId', clerkId);
        imageBlobs.forEach((blob, i) => {
            formData.append('files', blob, `frame_${i}.jpg`);
        });

        try {
            const res = await api.post(`/palm/verify-multi`, formData);
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
    },
}));

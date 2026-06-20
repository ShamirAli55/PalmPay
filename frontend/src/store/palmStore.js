import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'sonner';

// Unified simple API URL for both local and mobile testing
const API_URL = `http://${window.location.hostname}:5000/api`;

export const usePalmStore = create((set) => ({
    enrolling: false,
    verifying: false,
    enrollSamples: 0,
    palmEnrolled: false,

    fetchPalmStatus: async (clerkId) => {
        try {
            const res = await axios.get(`${API_URL}/user/${clerkId}`);
            set({ palmEnrolled: res.data.palmEnrolled });
        } catch (err) {
            console.error('Fetch palm status error:', err);
        }
    },

    enroll: async (clerkId, imageBlob) => {
        set({ enrolling: true });
        const formData = new FormData();
        formData.append('file', imageBlob, 'palm.jpg');
        formData.append('clerkId', clerkId);

        try {
            const res = await axios.post(`${API_URL}/palm/enroll`, formData);
            set({ enrolling: false, enrollSamples: res.data.samples });
            if (res.data.status === 'enrolled') {
                set({ palmEnrolled: true });
            }
            toast.success(`Sample ${res.data.samples}/3 enrolled!`, { id: 'palm-enroll-success' });
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
            const res = await axios.post(`${API_URL}/palm/verify`, formData);
            set({ verifying: false });
            if (res.data.accepted) {
                toast.success('Palm verified!', { id: 'palm-verify-success' });
            } else {
                toast.error(`Recognition Failed`, { id: 'palm-verify-fail' });
            }
            return res.data;
        } catch (err) {
            set({ verifying: false });
            toast.error('Palm server error', { id: 'palm-verify-error' });
            return null;
        }
    }
}));

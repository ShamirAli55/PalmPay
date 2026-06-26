import { create } from 'zustand';

export const useRealtimeStore = create((set, get) => ({
    isConnected: false,
    isConnecting: false,
    reconnectAttemptCount: 0,
    lastConnectedAt: null,
    lastDisconnectedAt: null,
    syncRequired: false,
    processedEventIds: {},

    setConnected: () => set({ 
        isConnected: true, 
        isConnecting: false, 
        lastConnectedAt: new Date().toISOString(),
        reconnectAttemptCount: 0 
    }),
    
    setConnecting: () => set({ isConnecting: true }),
    
    setDisconnected: () => set({ 
        isConnected: false, 
        isConnecting: false, 
        lastDisconnectedAt: new Date().toISOString(),
        syncRequired: true 
    }),

    setSyncRequired: (value) => set({ syncRequired: value }),
    
    incrementReconnectAttempt: () => set((state) => ({ 
        reconnectAttemptCount: state.reconnectAttemptCount + 1 
    })),

    hasProcessedEvent: (eventId) => {
        return !!get().processedEventIds[eventId];
    },

    markEventProcessed: (eventId) => {
        set((state) => ({
            processedEventIds: {
                ...state.processedEventIds,
                [eventId]: Date.now()
            }
        }));
        // Prune old events every 10 marks
        if (Object.keys(get().processedEventIds).length % 10 === 0) {
            get().pruneProcessedEvents();
        }
    },

    pruneProcessedEvents: () => {
        const now = Date.now();
        const maxAge = 1000 * 60 * 60; // 1 hour
        const currentIds = get().processedEventIds;
        const newIds = {};
        
        Object.entries(currentIds).forEach(([id, timestamp]) => {
            if (now - timestamp < maxAge) {
                newIds[id] = timestamp;
            }
        });
        
        set({ processedEventIds: newIds });
    },

    resetRealtimeState: () => set({
        isConnected: false,
        isConnecting: false,
        reconnectAttemptCount: 0,
        syncRequired: false,
        processedEventIds: {}
    })
}));

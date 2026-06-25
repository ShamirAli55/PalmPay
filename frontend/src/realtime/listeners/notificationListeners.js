import { EVENT_NAMES } from '../eventNames';
import { useWalletStore } from '../../store/walletStore';
import { useRealtimeStore } from '../../store/realtimeStore';

import { toast } from 'react-hot-toast';

export function registerNotificationListeners(socket) {
    socket.on(EVENT_NAMES.NOTIFICATION_NEW, (event) => {
        const realtime = useRealtimeStore.getState();
        if (realtime.hasProcessedEvent(event.eventId)) return;
        
        console.log('🔔 New notification:', event.notification.title);
        
        // Show beautiful toast
        toast.success(event.notification.message, {
            id: `notif-${event.notification._id}`,
            icon: '🔔',
            duration: 5000
        });

        useWalletStore.getState().applyNotificationNewEvent(event);
        realtime.markEventProcessed(event.eventId);
    });

    socket.on(EVENT_NAMES.NOTIFICATION_READ_UPDATED, (event) => {
        const realtime = useRealtimeStore.getState();
        if (realtime.hasProcessedEvent(event.eventId)) return;

        useWalletStore.getState().applyNotificationReadUpdatedEvent(event);
        realtime.markEventProcessed(event.eventId);
    });

    socket.on(EVENT_NAMES.NOTIFICATION_ALL_READ, (event) => {
        const realtime = useRealtimeStore.getState();
        if (realtime.hasProcessedEvent(event.eventId)) return;

        useWalletStore.getState().applyNotificationAllReadEvent(event);
        realtime.markEventProcessed(event.eventId);
    });

    socket.on(EVENT_NAMES.NOTIFICATION_UNREAD_COUNT_UPDATED, (event) => {
        const realtime = useRealtimeStore.getState();
        if (realtime.hasProcessedEvent(event.eventId)) return;

        useWalletStore.getState().applyUnreadCountUpdatedEvent(event);
        realtime.markEventProcessed(event.eventId);
    });
}

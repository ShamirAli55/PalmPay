import { EVENT_NAMES } from '../eventNames';
import { useWalletStore } from '../../store/walletStore';
import { useRealtimeStore } from '../../store/realtimeStore';

export function registerTransactionListeners(socket) {
    socket.on(EVENT_NAMES.TRANSACTION_CREATED, (event) => {
        const realtime = useRealtimeStore.getState();
        if (realtime.hasProcessedEvent(event.eventId)) return;

        console.log('📝 New transaction:', event.transaction.reference);
        useWalletStore.getState().applyTransactionCreatedEvent(event);
        realtime.markEventProcessed(event.eventId);
    });
}

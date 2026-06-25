import { EVENT_NAMES } from '../eventNames';
import { useWalletStore } from '../../store/walletStore';
import { useRealtimeStore } from '../../store/realtimeStore';

export function registerWalletListeners(socket) {
    socket.on(EVENT_NAMES.WALLET_BALANCE_UPDATED, (event) => {
        const realtime = useRealtimeStore.getState();
        if (realtime.hasProcessedEvent(event.eventId)) return;

        console.log('💰 Balance updated:', event.balance);
        useWalletStore.getState().applyBalanceUpdatedEvent(event);
        realtime.markEventProcessed(event.eventId);
    });
}

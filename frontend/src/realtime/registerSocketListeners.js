import { registerWalletListeners } from "./listeners/walletListeners";
import { registerTransactionListeners } from "./listeners/transactionListeners";
import { registerNotificationListeners } from "./listeners/notificationListeners";

export function registerSocketListeners(socket) {
  registerWalletListeners(socket);
  registerTransactionListeners(socket);
  registerNotificationListeners(socket);
}

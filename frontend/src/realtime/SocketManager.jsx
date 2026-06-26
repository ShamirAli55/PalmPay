import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { socketManager } from "./socket";
import { registerSocketListeners } from "./registerSocketListeners";
import { useRealtimeStore } from "../store/realtimeStore";
import { useWalletStore } from "../store/walletStore";

export default function SocketManager() {
    const { getToken } = useAuth();
    const { user, isLoaded, isSignedIn } = useUser();
    const { isConnected, syncRequired, setSyncRequired } = useRealtimeStore();
    const { fetchData } = useWalletStore();

    useEffect(() => {
        if (!isLoaded) return;

        let activeSocket = null;

        const startSocket = async () => {
            if (isSignedIn && user) {
                try {
                    const token = await getToken();
                    if (token) {
                        activeSocket = socketManager.connect(token);
                        registerSocketListeners(activeSocket);
                    }
                } catch (err) {
                    console.error("Failed to initialize socket auth:", err);
                }
            } else {
                socketManager.disconnect();
            }
        };

        startSocket();

        return () => {
            // Cleanup happens on unmount or dependency change
        };
    }, [isLoaded, isSignedIn, user, getToken]);

    // Handle Reconnect Resync
    useEffect(() => {
        if (isConnected && syncRequired && user?.id) {
            console.log("🔄 Reconnected. Triggering resync...");
            fetchData(user.id, user.fullName).then(() => {
                setSyncRequired(false);
            });
        }
    }, [isConnected, syncRequired, user, fetchData, setSyncRequired]);

    return null;
}

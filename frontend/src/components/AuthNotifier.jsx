import { useUser } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";

export default function AuthNotifier() {
  const { user, isLoaded, isSignedIn } = useUser();
  const prevIsSignedInRef = useRef(null);

  useEffect(() => {
    if (!isLoaded) return;

    // Detect state change
    if (prevIsSignedInRef.current !== null) {
      if (isSignedIn && !prevIsSignedInRef.current) {
        // Just signed in
        toast.success(`Welcome back, ${user?.firstName || 'User'}`, {
          id: 'auth-login',
          icon: '👋',
        });
      } else if (!isSignedIn && prevIsSignedInRef.current) {
        // Just signed out
        toast.success('Signed out successfully', {
          id: 'auth-logout',
          icon: '🚪',
        });
      }
    }

    prevIsSignedInRef.current = isSignedIn;
  }, [user, isSignedIn, isLoaded]);

  return null;
}

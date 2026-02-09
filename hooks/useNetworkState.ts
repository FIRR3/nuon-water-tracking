// hooks/useNetworkState.ts
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

interface NetworkState {
  isOnline: boolean;
  isInternetReachable: boolean | null;
  connectionType: string;
}

/**
 * Hook to track network connectivity status
 * @returns Current network state
 */
export const useNetworkState = (): NetworkState => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: true,
    isInternetReachable: null,
    connectionType: 'unknown',
  });

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then(state => {
      setNetworkState({
        isOnline: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      });
    });

    // Listen for changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkState({
        isOnline: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      });
    });

    return () => unsubscribe();
  }, []);

  return networkState;
};

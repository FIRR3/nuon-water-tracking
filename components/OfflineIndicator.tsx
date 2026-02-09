// components/OfflineIndicator.tsx
import { StatusIcons } from '@/constants/icon';
import { useNetworkState } from '@/hooks/useNetworkState';
import { useUserStore } from '@/hooks/useUserStore';
import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

/**
 * Shows an offline indicator banner when the device is not connected
 * Also shows pending sync count if there are items waiting to sync
 */
export const OfflineIndicator: React.FC = () => {
  const { isOnline } = useNetworkState();
  const { pendingSyncCount, pendingEditsCount } = useUserStore();

  // Only count user-initiated actions (water logs + profile edits)
  // Daily summaries are automatic side effects, so don't count them separately
  const totalPending = pendingSyncCount + pendingEditsCount;

  if (isOnline && totalPending === 0) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutUp.duration(300)}
      className="bg-yellow-600/90 px-4 py-2 flex-row items-center justify-center"
    >
      <StatusIcons.warning color="white" size={16} />
      <Text className="text-white text-sm font-poppins-medium ml-2">
        {!isOnline
          ? `Offline Mode${totalPending > 0 ? ` - ${totalPending} pending` : ''}`
          : `Syncing ${totalPending} items...`}
      </Text>
    </Animated.View>
  );
};

/**
 * Minimal offline dot indicator for headers
 */
export const OfflineDot: React.FC = () => {
  const { isOnline } = useNetworkState();

  if (isOnline) {
    return null;
  }

  return (
    <View className="w-2 h-2 rounded-full bg-yellow-500 absolute top-0 right-0" />
  );
};

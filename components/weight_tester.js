// src/components/WeightScreen.js
import { parseWeight, scanAndConnect } from '@/ble/bleservice.js';
import { useUserStore } from '@/hooks/useUserStore';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useState } from 'react';
import { Alert, PermissionsAndroid, Platform, View } from 'react-native';

export default function WeightScreen({ onUpdateTotal, onStatusChange }) {
  const [currentWeight, setCurrentWeight] = useState(0);
  const [status, setStatus] = useState('Initializing...');
  const { addWaterIntake } = useUserStore();

  useKeepAwake();

  // Update parent with status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(status);
    }
  }, [status]); // Remove onStatusChange from dependencies

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
        if (
          granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('All permissions granted');
          return true;
        } else {
          setStatus('Permissions denied');
          Alert.alert('Permissions denied', 'Bluetooth and location permissions are required for BLE scanning.');
          return false;
        }
      } catch (err) {
        console.warn(err);
        setStatus('Permission error');
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    let isMounted = true;

    const startBLE = async () => {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return;

      setStatus('Scanning for device...');
      console.log('Starting auto scan...');
      scanAndConnect(
        async (data) => {
          if (!isMounted) return;

          console.log('Processing BLE data:', data);
          const grams = parseWeight(data);
          console.log('Parsed grams:', grams);
          setCurrentWeight(grams);

          // Save to cloud storage via useUserStore
          try {
            console.log('Saving water intake to cloud:', grams);
            await addWaterIntake(grams, 'bluetooth');
            console.log('Successfully saved to cloud storage');
            
            // No need to notify parent - store will trigger re-renders
          } catch (error) {
            console.error('Error saving water intake to cloud:', error);
            // Don't fail the BLE connection on cloud save errors
            // The offline queue will retry later
          }
        },
        (status) => {
          if (!isMounted) return;
          setStatus(status);
        }
      );
    };

    startBLE();

    return () => { isMounted = false; };
  }, []);

  return (
    <View></View>
  );
}

// src/components/WeightScreen.js
import { parseWeight, scanAndConnect } from '@/ble/bleservice.js';
import { useUserStore } from '@/hooks/useUserStore';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useState } from 'react';
import { Alert, PermissionsAndroid, Platform, View } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

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
          console.log('All Android permissions granted');
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
    } else if (Platform.OS === 'ios') {
      // iOS: Check Bluetooth state (permissions are requested automatically)
      const manager = new BleManager();
      return new Promise((resolve) => {
        const subscription = manager.onStateChange((state) => {
          console.log('iOS Bluetooth state:', state);
          subscription.remove();
          
          if (state === 'PoweredOn') {
            console.log('iOS Bluetooth ready');
            resolve(true);
          } else if (state === 'PoweredOff') {
            setStatus('Bluetooth is off');
            Alert.alert(
              'Bluetooth Required',
              'Please enable Bluetooth in Settings to connect to your water tracking device.',
              [{ text: 'OK' }]
            );
            resolve(false);
          } else if (state === 'Unauthorized') {
            setStatus('Bluetooth permission denied');
            Alert.alert(
              'Bluetooth Permission Required',
              'Please enable Bluetooth permission in Settings > Nuon Water Tracking.',
              [{ text: 'OK' }]
            );
            resolve(false);
          } else {
            setStatus(`Bluetooth unavailable: ${state}`);
            resolve(false);
          }
        }, true); // true = emit current state immediately
      });
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

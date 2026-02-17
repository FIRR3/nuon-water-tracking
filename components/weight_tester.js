// src/components/WeightScreen.js
import { parseWeight, scanAndConnect } from '@/ble/bleservice.js';
import { useUserStore } from '@/hooks/useUserStore';
import { useKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, PermissionsAndroid, Platform, View } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

export default function WeightScreen({ onUpdateTotal, onStatusChange }) {
  const [currentWeight, setCurrentWeight] = useState(0);
  const [status, setStatus] = useState('Initializing...');
  const { addWaterIntake } = useUserStore();
  
  // Track app state and buffer data received while in background
  const appState = useRef(AppState.currentState);
  const backgroundDataBuffer = useRef([]);
  const isProcessingBuffer = useRef(false);

  useKeepAwake();

  // Update parent with status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(status);
    }
  }, [status]); // Remove onStatusChange from dependencies

  // Process any data that was buffered while app was in background
  const processBackgroundBuffer = useCallback(async () => {
    if (isProcessingBuffer.current || backgroundDataBuffer.current.length === 0) {
      return;
    }

    isProcessingBuffer.current = true;
    console.log(`Processing ${backgroundDataBuffer.current.length} buffered entries`);

    const buffer = [...backgroundDataBuffer.current];
    backgroundDataBuffer.current = [];

    for (const grams of buffer) {
      try {
        await addWaterIntake(grams, 'bluetooth');
        console.log(`Saved buffered entry: ${grams}ml`);
      } catch (error) {
        console.error('Error saving buffered entry:', error);
        // Re-buffer if save failed
        backgroundDataBuffer.current.push(grams);
      }
    }

    isProcessingBuffer.current = false;
  }, [addWaterIntake]);

  // Monitor app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      const previousState = appState.current;
      appState.current = nextAppState;

      // App came to foreground from background
      if (previousState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App came to foreground - processing buffered data');
        processBackgroundBuffer();
      }

      // App going to background
      if (previousState === 'active' && nextAppState.match(/inactive|background/)) {
        console.log('App going to background - will buffer incoming data');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [processBackgroundBuffer]);

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
          subscription.remove();
          
          if (state === 'PoweredOn') {
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
      scanAndConnect(
        async (data) => {
          if (!isMounted) return;

          const grams = parseWeight(data);
          setCurrentWeight(grams);

          // CRITICAL FIX FOR iOS BACKGROUND:
          // Check if app is in background - if so, buffer the data
          const currentAppState = appState.current;
          
          if (Platform.OS === 'ios' && currentAppState !== 'active') {
            // App is in background - buffer the data
            console.log(`App in background, buffering ${grams}ml`);
            backgroundDataBuffer.current.push(grams);
            return;
          }

          // App is in foreground - save immediately
          // Fire and forget to prevent blocking BLE
          addWaterIntake(grams, 'bluetooth').catch((error) => {
            console.error('Error saving water intake (will retry):', error);
          });
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

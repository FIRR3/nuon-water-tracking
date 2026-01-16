// src/components/WeightScreen.js
import { appendRow, parseWeight, scanAndConnect } from '@/ble/bleservice.js';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useState } from 'react';
import { Alert, PermissionsAndroid, Platform, StyleSheet, View } from 'react-native';

export default function WeightScreen({ onUpdateTotal }) {
  const [currentWeight, setCurrentWeight] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);
  const [status, setStatus] = useState('Initializing...');

  useKeepAwake();

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
      scanAndConnect(async (data) => {
        if (!isMounted) return;

        console.log('Processing data:', data);
        const grams = parseWeight(data);
        console.log('Parsed grams:', grams);
        setCurrentWeight(grams);
        setStatus('Connected - Receiving data');

        const total = await appendRow(grams);
        setTotalWeight(total);
        if (onUpdateTotal) {
          onUpdateTotal(grams);
        }
      });
    };

    startBLE();

    return () => { isMounted = false; };
  }, []);

  return (
    <View style={styles.container}>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    alignItems:'center',
    justifyContent:'center',
    padding:20
  },
  title: {
    fontSize:24,
    fontWeight:'bold',
    marginBottom:20
  },
  status: {
    fontSize:16,
    color: 'blue',
    marginBottom: 10
  },
  label: {
    fontSize:18,
    marginVertical:10
  }
});

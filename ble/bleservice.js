// src/ble/bleService.js
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

let manager;
if (Platform.OS !== 'web') {
  manager = new BleManager();
}
let totalGrams = 0;
const FILE_PATH = Platform.OS === 'web' ? null : `${FileSystem.documentDirectory}weight_log.csv`;

// BLE device constants
const DEVICE_NAME = "DRINK-TRACKER";
const SERVICE_UUID = "0000181D-0000-1000-8000-00805f9b34fb";
const MEASURE_CHAR_UUID = "00002A9D-0000-1000-8000-00805f9b34fb";

/**
 * Parses raw BLE data to grams
 * @param {Uint8Array | Buffer} data
 * @returns {number} grams
 */
export function parseWeight(data) {
  // ESP32 sends 3-byte array: [0x00, LSB, MSB]
  const bleVal = (data[2] << 8) | data[1];
  return bleVal * 5.0;
}

/**
 * Appends a row to CSV and updates running total
 * @param {number} grams
 * @returns {Promise<number>} total grams
 */
export async function appendRow(grams) {
  totalGrams += grams;
  if (!FILE_PATH) {
    console.log('File system not available on this platform');
    return totalGrams;
  }
  const timestamp = Date.now() / 1000;
  const row = `${timestamp},${grams},${totalGrams}\n`;

  const info = await FileSystem.getInfoAsync(FILE_PATH);
  if (!info.exists) {
    await FileSystem.writeAsStringAsync(FILE_PATH, "timestamp,grams,total_grams\n");
  }

  await FileSystem.writeAsStringAsync(FILE_PATH, row, { append: true });
  return totalGrams;
}

/**
 * Returns current total grams
 */
export function getTotal() {
  return totalGrams;
}

/**
 * Scans and connects to the ESP32 BLE device
 * @param {(data: Uint8Array) => void} onData callback for each notification
 */
export function scanAndConnect(onData) {
  if (!manager) {
    console.log('BLE not supported on this platform');
    return;
  }
  console.log('Starting BLE scan...');
  manager.startDeviceScan(null, null, (error, device) => {
    if (error) {
      console.log("Scan error:", error);
      return;
    }
    console.log('Found device:', device.name, device.id);

    if (device.name === DEVICE_NAME) {
      console.log('Matching device found, stopping scan and connecting...');
      manager.stopDeviceScan();

      device.connect()
        .then(d => {
          console.log('Connected, discovering services...');
          // Add disconnect listener
          d.onDisconnected(() => {
            console.log('Device disconnected, restarting scan...');
            // Restart scan after a delay
            setTimeout(() => scanAndConnect(onData), 2000);
          });
          return d.discoverAllServicesAndCharacteristics();
        })
        .then(d => {
          console.log("Connected to", DEVICE_NAME, 'monitoring characteristic...');

          // Subscribe to weight characteristic notifications
          d.monitorCharacteristicForService(
            SERVICE_UUID,
            MEASURE_CHAR_UUID,
            (err, characteristic) => {
              if (err) {
                console.log("Notification error:", err);
                // On error, perhaps restart
                setTimeout(() => scanAndConnect(onData), 2000);
                return;
              }
              console.log('Received characteristic update');
              // characteristic.value is Base64
              const binaryString = atob(characteristic.value);
              const buffer = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                buffer[i] = binaryString.charCodeAt(i);
              }
              console.log('Raw data:', buffer);
              onData(buffer);
            }
          );
        })
        .catch(err => {
          console.log("Connection error:", err);
          // On connection error, restart scan
          setTimeout(() => scanAndConnect(onData), 2000);
        });
    }
  });
}

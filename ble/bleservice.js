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
let isScanning = false;
let connectedDevice = null;

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
  // Data is encoded as: int16_t = (grams * 100)
  let bleVal = (data[2] << 8) | data[1];
  
  // Convert back to grams by deviding by 100
  return bleVal / 100;
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
 * @param {(status: string) => void} onStatusChange callback for status updates
 */
export function scanAndConnect(onData, onStatusChange) {
  if (!manager) {
    console.log('BLE not supported on this platform');
    return;
  }
  
  // Prevent multiple concurrent scans
  if (isScanning) {
    console.log('Already scanning, ignoring duplicate request');
    return;
  }
  
  isScanning = true;
  console.log('Starting BLE scan...');
  if (onStatusChange) onStatusChange('Scanning for device...');
  
  // Use state change listener to ensure Bluetooth is ready
  const subscription = manager.onStateChange((state) => {
    console.log('Bluetooth state:', state);
    
    if (state === 'PoweredOn') {
      subscription.remove();
      console.log('Bluetooth ready, starting scan...');
      startScan(onData, onStatusChange);
    } else {
      console.log('Bluetooth not ready, state:', state);
      if (onStatusChange) onStatusChange('Enable Bluetooth');
    }
  }, true); // true = emit current state immediately
}

/**
 * Internal function to start the actual scan
 */
function startScan(onData, onStatusChange) {
  manager.startDeviceScan(null, null, (error, device) => {
    if (error) {
      console.log("Scan error:", error);
      isScanning = false;
      if (onStatusChange) onStatusChange('Scan error');
      return;
    }
    
    if (device.name === DEVICE_NAME) {
      console.log('Matching device found, stopping scan and connecting...');
      manager.stopDeviceScan();
      isScanning = false;
      if (onStatusChange) onStatusChange('Connecting...');

      device.connect()
        .then(d => {
          connectedDevice = d;
          console.log('Connected, discovering services...');
          if (onStatusChange) onStatusChange('Discovering services...');
          
          d.onDisconnected(() => {
            console.log('Device disconnected, restarting scan...');
            connectedDevice = null;
            if (onStatusChange) onStatusChange('Disconnected - Reconnecting...');
            setTimeout(() => scanAndConnect(onData, onStatusChange), 2000);
          });
          
          return d.discoverAllServicesAndCharacteristics();
        })
        .then(async d => {
          console.log("Connected to", DEVICE_NAME, 'setting up monitoring...');
          if (onStatusChange) onStatusChange('Setting up data monitoring...');

          // Request MTU (improves reliability)
          try {
            const mtu = await d.requestMTU(512);
            console.log('MTU negotiated:', mtu);
          } catch (err) {
            console.log('MTU request failed (non-critical):', err.message);
          }

          // Small delay to ensure services are fully ready
          await new Promise(resolve => setTimeout(resolve, 300));

          // First, read the characteristic to verify it's accessible
          try {
            const services = await d.services();
            console.log('Available services:', services.map(s => s.uuid));
            
            const characteristics = await d.characteristicsForService(SERVICE_UUID);
            console.log('Available characteristics:', characteristics.map(c => c.uuid));
            
            // Verify the characteristic exists and has notify property
            const targetChar = characteristics.find(c => c.uuid.toLowerCase() === MEASURE_CHAR_UUID.toLowerCase());
            if (!targetChar) {
              throw new Error('Measurement characteristic not found');
            }
            console.log('Characteristic properties:', {
              isNotifiable: targetChar.isNotifiable,
              isReadable: targetChar.isReadable
            });
          } catch (err) {
            console.log('Error verifying characteristics:', err);
          }

          // First try to read the characteristic to verify connectivity
          console.log('Reading characteristic to verify connection...');
          try {
            const readPromise = d.readCharacteristicForService(SERVICE_UUID, MEASURE_CHAR_UUID);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Read timeout')), 2000)
            );
            const readChar = await Promise.race([readPromise, timeoutPromise]);
            console.log('Initial characteristic read successful:', readChar.value);
          } catch (err) {
            console.log('Initial read failed (this is OK):', err.message);
          }
          console.log('Proceeding to CCCD setup...');

          // CRITICAL: Manually enable notifications by writing to CCCD
          console.log('Manually enabling notifications on CCCD descriptor...');
          try {
            // Write 0x0100 to enable notifications on the CCCD (descriptor UUID 0x2902)
            const writePromise = d.writeDescriptorForCharacteristic(
              SERVICE_UUID,
              MEASURE_CHAR_UUID,
              '00002902-0000-1000-8000-00805f9b34fb',
              'AQ==' // Base64 for [0x01, 0x00] - enables notifications
            );
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('CCCD write timeout')), 2000)
            );
            await Promise.race([writePromise, timeoutPromise]);
            console.log('✓ CCCD write successful - notifications ENABLED');
          } catch (err) {
            console.log('⚠️ CCCD write failed:', err.message);
            console.log('   Continuing anyway - monitorCharacteristicForService may handle it');
          }
          console.log('Proceeding to monitoring setup...');

          console.log('Starting notification monitoring...');
          if (onStatusChange) onStatusChange('Connected - Receiving data');

          // Subscribe to weight characteristic notifications with transaction ID for tracking
          const subscription = d.monitorCharacteristicForService(
            SERVICE_UUID,
            MEASURE_CHAR_UUID,
            (err, characteristic) => {
              if (err) {
                console.log("❌ Notification error:", err);
                console.log("Error details:", JSON.stringify(err, null, 2));
                if (onStatusChange) onStatusChange('Connection error');
                // On error, perhaps restart
                setTimeout(() => scanAndConnect(onData, onStatusChange), 2000);
                return;
              }
              
              if (!characteristic) {
                console.log('⚠️ Received null characteristic');
                return;
              }
              
              if (!characteristic.value) {
                console.log('⚠️ Received characteristic with no value');
                return;
              }
              
              console.log('✅ Received characteristic update!');
              console.log('  - UUID:', characteristic.uuid);
              console.log('  - Value (base64):', characteristic.value);
              
              // characteristic.value is Base64
              const binaryString = atob(characteristic.value);
              const buffer = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                buffer[i] = binaryString.charCodeAt(i);
              }
              console.log('  - Raw data (hex):', Array.from(buffer).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
              console.log('  - Raw data (dec):', Array.from(buffer).join(', '));
              onData(buffer);
            }
          );
          
          console.log('✓ Monitoring subscription created:', subscription ? 'SUCCESS' : 'FAILED');
          if (!subscription) {
            throw new Error('Failed to create monitoring subscription');
          }
        })
        .catch(err => {
          console.log("Connection error:", err);
          if (onStatusChange) onStatusChange('Connection failed - Retrying...');
          // On connection error, restart scan
          setTimeout(() => scanAndConnect(onData, onStatusChange), 2000);
        });
    }
  });
}

/**
 * Cleanup function
 */
export async function cleanup() {
  if (isScanning && manager) {
    manager.stopDeviceScan();
    isScanning = false;
  }
  
  if (connectedDevice) {
    try {
      await connectedDevice.cancelConnection();
    } catch (e) {
      console.log('Error disconnecting:', e);
    }
    connectedDevice = null;
  }
}

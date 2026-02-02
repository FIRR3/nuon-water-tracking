/*
 * ESP32-BLE Drink Measurement Prototype
 * Event-based drink / refill detection
 */

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <HX711.h>
#include <Preferences.h>

// ===================== BLE UUIDs =====================
#define SERVICE_UUID        "0000181D-0000-1000-8000-00805f9b34fb"
#define MEASURE_CHAR_UUID   "00002A9D-0000-1000-8000-00805f9b34fb"


// ===================== storage ==========================
Preferences prefs;
const int MAX_STORED_EVENTS = 50;  // Max events to store

// ===================== PINS ==========================
const byte hx711_data_pin  = 2;
const byte hx711_clock_pin = 4;
const byte off_button      = 8;   // OFF switch

// ===================== HX711 =========================
HX711 scale;

const float SCALE_FACTOR = -455.69016;
long x0 = 0;
const int avg_size = 3;


// ===================== storage ==========================

void storeEvent(float grams) {
  prefs.begin("water-data", false);
  int count = prefs.getInt("count", 0);
  
  if (count < MAX_STORED_EVENTS) {
    String key = "event_" + String(count);
    prefs.putFloat(key.c_str(), grams);
    prefs.putInt("count", count + 1);
    Serial.print("Stored event: ");
    Serial.print(grams);
    Serial.print("g (");
    Serial.print(count + 1);
    Serial.println(" total stored)");
  } else {
    Serial.println("Storage full! Oldest data will be lost.");
  }
  
  prefs.end();
}

void sendStoredEvents() {
  prefs.begin("water-data", false);
  int count = prefs.getInt("count", 0);
  
  if (count > 0) {
    Serial.print("Sending ");
    Serial.print(count);
    Serial.println(" stored events...");
    
    for (int i = 0; i < count; i++) {
      String key = "event_" + String(i);
      float grams = prefs.getFloat(key.c_str(), 0);
      
      if (grams > 0) {
        send_ble_value(grams);
        delay(500);  // Longer delay to ensure phone processes each notification
      }
    }
    
    // Clear all stored events
    prefs.clear();
    Serial.println("All stored events sent and cleared");
  }
  
  prefs.end();
}

// ===================== BLE ==========================
BLEServer* pServer = nullptr;
BLECharacteristic* pCharacteristic = nullptr;

bool deviceConnected = false;
bool oldDeviceConnected = false;
bool needToSendStoredData = false;
unsigned long connectionTime = 0;

class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer*) { 
    deviceConnected = true;
    Serial.println("[BLE] Client connected!");
    // Don't send immediately - wait for phone to set up notifications
    needToSendStoredData = true;
    connectionTime = millis();
  }
  void onDisconnect(BLEServer*) { 
    deviceConnected = false;
    Serial.println("[BLE] Client disconnected!");
  }
};



// ===================== EVENT STATE ==================
enum State { IDLE, DROPPED, STABILIZING };
State state = IDLE;

float baselineWeight = 0;
float lastStableWeight = 0;
int stableCount = 0;
unsigned long droppedStateTime = 0;

bool systemEnabled = true;

// Thresholds
const float DROP_THRESHOLD = 5.0;   // ≈ 0 g
const float STABLE_DELTA   = 1.0;   // ±1 g
const int   STABLE_SAMPLES = 8;
const float MIN_DELTA = 3.0;

// ===================== BLE KEEP-ALIVE ===============
void ensureBLEAdvertising() {
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
  }
  oldDeviceConnected = deviceConnected;
}

// ===================== BLE SEND =====================
void send_ble_value(float grams) {
  if (grams <= 0) return;

  int16_t bleVal = (int16_t)(grams * 100.0f); // 0.01 g resolution

  uint8_t payload[3];
  payload[0] = 0x00;               // flags
  payload[1] = bleVal & 0xFF;
  payload[2] = (bleVal >> 8) & 0xFF;

  Serial.print("[BLE] Sending: ");
  Serial.print(grams);
  Serial.print("g (0x");
  Serial.print(payload[0], HEX);
  Serial.print(" 0x");
  Serial.print(payload[1], HEX);
  Serial.print(" 0x");
  Serial.print(payload[2], HEX);
  Serial.println(")");

  pCharacteristic->setValue(payload, 3);
  pCharacteristic->notify();
  Serial.println("[BLE] Notify sent");
}

// ===================== READ SCALE ===================
float readMass() {
  long sum = 0;
  for (int i = 0; i < avg_size; i++) {
    sum += scale.read();
    if (i < avg_size - 1) delay(10);  // small delay between readings
  }
  long reading = sum / avg_size;
  return (reading - x0) / SCALE_FACTOR;
}

// ===================== Power ===================
void handlePowerButton() {
  static bool lastReading = HIGH;
  static unsigned long lastDebounceTime = 0;
  const unsigned long debounceDelay = 50;
  
  bool currentReading = digitalRead(off_button);

  // If the reading changed, reset the debounce timer
  if (currentReading != lastReading) {
    lastDebounceTime = millis();
    lastReading = currentReading;
  }

  // If enough time has passed, apply the stable reading
  if ((millis() - lastDebounceTime) > debounceDelay) {
    // Switch position directly controls system state
    // LOW = System ON, HIGH = System OFF (with INPUT_PULLUP)
    bool newState = (currentReading == LOW);
    
    // Only log when state actually changes
    if (systemEnabled != newState) {
      systemEnabled = newState;
      Serial.println(systemEnabled ? "System ON" : "System OFF");
      state = IDLE;  // reset state machine
    }
  }
}


// ===================== SETUP ========================
void setup() {
  Serial.begin(115200);
  pinMode(off_button, INPUT_PULLUP);

  scale.begin(hx711_data_pin, hx711_clock_pin);
  delay(1000);

  // TARE
  for (int i = 0; i < avg_size; i++) {
    x0 += scale.read();
    delay(10);
  }
  x0 /= avg_size;

  baselineWeight = readMass();

  BLEDevice::init("DRINK-TRACKER");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService* pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
    MEASURE_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );

  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();

  BLEDevice::getAdvertising()->addServiceUUID(SERVICE_UUID);
  BLEDevice::getAdvertising()->start();

  Serial.println("Event-based system ready");
  Serial.println("[BLE] Advertising started, waiting for client connection...");
}

// ===================== LOOP =========================
void loop() {
  handlePowerButton();

  if (!systemEnabled) {
    delay(100);
    return;
  }

  ensureBLEAdvertising();

  // Check if we need to send stored data (after phone has time to set up notifications)
  if (needToSendStoredData && deviceConnected && (millis() - connectionTime) > 2000) {
    needToSendStoredData = false;
    sendStoredEvents();
  }

  float mass = readMass();
  
  // Debug output (reduce spam)
  static int printCounter = 0;
  if (printCounter++ % 10 == 0) {
    Serial.print("Mass: ");
    Serial.print(mass);
    Serial.print("g, State: ");
    Serial.println(state == IDLE ? "IDLE" : (state == DROPPED ? "DROPPED" : "STABILIZING"));
  }

  switch (state) {

    case IDLE:
      if (mass < DROP_THRESHOLD) {
        state = DROPPED;
        droppedStateTime = 0;
      }
      break;

    case DROPPED:
      if (droppedStateTime == 0) {
        droppedStateTime = millis();
      }
      
      if (mass > DROP_THRESHOLD + 5.0f) {
        lastStableWeight = mass;
        stableCount = 0;
        state = STABILIZING;
        droppedStateTime = 0;
      } 
      break;

    case STABILIZING:
      if (abs(mass - lastStableWeight) < STABLE_DELTA) {
        stableCount++;
      } else {
        lastStableWeight = mass;
        stableCount = 0;
      }

      if (stableCount >= STABLE_SAMPLES) {
        float diff = lastStableWeight - baselineWeight;

        // If baseline is very low (< 50g), this is initial bottle placement
        // Just set the baseline without sending data
        if (baselineWeight < 50.0f && lastStableWeight > 100.0f) {
          Serial.println("Initial bottle placement detected, setting baseline");
          baselineWeight = lastStableWeight;
          state = IDLE;
          break;
        }

        if (abs(diff) >= MIN_DELTA) {
          Serial.print("EVENT Δ: ");
          Serial.print(diff);
          Serial.println("g");

          // Negative diff = weight decreased (drinking) -> send data
          // Positive diff = weight increased (refilling) -> just update baseline
          if (diff < 0) {
            Serial.println("Detected: Drinking");
            if (deviceConnected) {
              Serial.println("[BLE] Device connected, sending data...");
              send_ble_value(-diff);
            } else {
              Serial.println("[BLE] Device NOT connected, storing data...");
              storeEvent(-diff);
            }
          } else {
            Serial.println("Detected: Refilling (updating baseline only)");
          }

          baselineWeight = lastStableWeight; // update baseline
        } else {
          Serial.println("Ignored small delta");
        }
        state = IDLE;
      }
      break;
  }  
}
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

// ===================== BLE UUIDs =====================
#define SERVICE_UUID        "0000181D-0000-1000-8000-00805f9b34fb"
#define MEASURE_CHAR_UUID   "00002A9D-0000-1000-8000-00805f9b34fb"

// ===================== PINS ==========================
const byte hx711_data_pin  = 2;
const byte hx711_clock_pin = 4;
const byte power_switch    = 8;   // Latching ON/OFF switch to GND

// ===================== HX711 =========================
HX711 scale;

const float SCALE_FACTOR = -455.69016;
long x0 = 0;
const int avg_size = 3;

// ===================== BLE ==========================
BLEServer* pServer = nullptr;
BLECharacteristic* pCharacteristic = nullptr;

bool deviceConnected = false;
bool oldDeviceConnected = false;

class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer*) { 
    deviceConnected = true;
    Serial.println("[BLE] Client connected!");
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

// ===================== THRESHOLDS ===================
const float DROP_THRESHOLD = 5.0;   // bottle lifted / near zero
const float STABLE_DELTA   = 1.0;   // ±1 g considered stable
const int   STABLE_SAMPLES = 8;     // ~0.8 s stability
const float MIN_DELTA      = 3.0;   // ignore < 3 g events

// ===================== BLE SEND =====================
void send_ble_value(float grams) {
  int16_t bleVal = (int16_t)(grams * 100.0f); // 0.01 g resolution

  uint8_t payload[3];
  payload[0] = 0x00;               // flags
  payload[1] = bleVal & 0xFF;      // LSB
  payload[2] = bleVal >> 8;        // MSB

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
  }
  long reading = sum / avg_size;
  return (reading - x0) / SCALE_FACTOR;
}

// ===================== BLE KEEP-ALIVE ===============
void ensureBLEAdvertising() {
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
  }
  oldDeviceConnected = deviceConnected;
}

// ===================== SETUP ========================
void setup() {
  Serial.begin(115200);
  pinMode(power_switch, INPUT_PULLUP);

  // HX711 init
  scale.begin(hx711_data_pin, hx711_clock_pin);
  delay(1000);

  // TARE
  for (int i = 0; i < avg_size; i++) {
    x0 += scale.read();
    delay(10);
  }
  x0 /= avg_size;

  baselineWeight = readMass();

  // BLE init
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

  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->start();

  Serial.println("Event-based system ready");
  Serial.println("[BLE] Advertising started, waiting for client connection...");
}

// ===================== LOOP =========================
void loop() {
  // Switch logic: HIGH = ON, LOW = OFF
  bool systemEnabled = digitalRead(power_switch) == LOW;

  if (!systemEnabled) {
    state = IDLE;
    delay(200);
    return;
  }

  ensureBLEAdvertising();

  float mass = readMass();
  Serial.println(mass);

  switch (state) {

    case IDLE:
      if (mass < DROP_THRESHOLD) {
        state = DROPPED;
      }
      break;

    case DROPPED:
      if (mass > DROP_THRESHOLD + 5.0f) {
        lastStableWeight = mass;
        stableCount = 0;
        state = STABILIZING;
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

          if (deviceConnected) {
            Serial.println("[BLE] Client connected, sending data...");
            send_ble_value(-diff);
          } else {
            Serial.println("[BLE] No client connected, skipping send");
          }

          baselineWeight = lastStableWeight;
        } else {
          Serial.println("Ignored small delta");
        }

        state = IDLE;
      }
      break;
  }

  delay(100);
}

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
const byte off_button      = 8;   // OFF switch

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
    Serial.println("[BLE] Device connected!");
  }
  void onDisconnect(BLEServer*) { 
    deviceConnected = false; 
    Serial.println("[BLE] Device disconnected!");
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

void ensureBLEAdvertising() {
    if (!deviceConnected) {
        pServer->startAdvertising();
    }
}

// ===================== BLE SEND =====================
void send_ble_value(float grams) {
  int16_t bleVal = (int16_t)(grams * 100.0f); // 0.01 g resolution

  uint8_t payload[3];
  payload[0] = 0x00;
  payload[1] = bleVal & 0xFF;
  payload[2] = bleVal >> 8;

  Serial.print("[BLE] Sending value: ");
  Serial.print(grams);
  Serial.print("g (int16: ");
  Serial.print(bleVal);
  Serial.print(", bytes: 0x");
  Serial.print(payload[0], HEX);
  Serial.print(" 0x");
  Serial.print(payload[1], HEX);
  Serial.print(" 0x");
  Serial.print(payload[2], HEX);
  Serial.println(")");

  pCharacteristic->setValue(payload, 3);
  pCharacteristic->notify();
  Serial.println("[BLE] Notification sent");
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
  static bool lastState = HIGH;
  bool currentState = digitalRead(off_button);

  // Detect button press
  if (lastState == HIGH && currentState == LOW) {
    systemEnabled = !systemEnabled;

    Serial.println(systemEnabled ? "System ON" : "System OFF");

    state = IDLE;  // reset state machine
    delay(300);    // debounce
  }

  lastState = currentState;
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
  Serial.println("[BLE] Advertising started, waiting for connection...");
}

// ===================== LOOP =========================
void loop() {
  handlePowerButton();

  if (!systemEnabled) {
    delay(100);
    return;
  }

  // Ensure BLE is ready
  ensureBLEAdvertising();

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

        if (abs(diff) >= MIN_DELTA) {
            Serial.print("diff Δ: ");
            Serial.println(diff);

            if (deviceConnected) {
                Serial.println("[BLE] Device connected, sending data...");
                send_ble_value(-diff);
            } else {
                Serial.println("[BLE] Device NOT connected, skipping send");
            }

            baselineWeight = lastStableWeight; // update baseline
        } else {
            Serial.println("Ignored small delta");
        }
        state = IDLE;
      }
      break;
  }

  // BLE reconnect handling
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
  }
  oldDeviceConnected = deviceConnected;

  delay(100);
}

/*
 * ESP32-BLE Drink Measurement Prototype
 * Button-based drink detection
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
const byte drink_button    = 8;   // USED FOR DRINK MEASUREMENT

// ===================== HX711 =========================
HX711 scale;

float calibratedmass = 752.0;
const float SCALE_FACTOR = -455.69016;
long x0 = 0;
long x1 = 0;
float avg_size = 10.0;

// ===================== DRINK LOGIC ==================
bool drinkActive = false;
float drinkStartWeight = 0;

// ===================== BLE ==========================
BLEServer* pServer = nullptr;
BLECharacteristic* pCharacteristic = nullptr;

bool deviceConnected = false;
bool oldDeviceConnected = false;

class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer*) { deviceConnected = true; }
  void onDisconnect(BLEServer*) { deviceConnected = false; }
};

// ===================== BLE SEND =====================
void send_ble_value(float grams) {
  if (grams <= 0) return;

  uint16_t bleVal = (uint16_t)((grams / 5.0f) + 0.5f);

  uint8_t payload[3];
  payload[0] = 0x00;               // flags
  payload[1] = bleVal & 0xFF;
  payload[2] = (bleVal >> 8) & 0xFF;

  pCharacteristic->setValue(payload, 3);
  pCharacteristic->notify();
}

// ===================== BUTTON HANDLER ===============
void handleDrinkButton(float currentWeight) {
  static bool lastState = HIGH;
  bool currentState = digitalRead(drink_button);

  // Button pressed → start
  if (lastState == HIGH && currentState == LOW) {
    drinkStartWeight = currentWeight;
    drinkActive = true;
    Serial.print("Drink start: ");
    Serial.println(drinkStartWeight);
  }

  // Button released → stop
  if (lastState == LOW && currentState == HIGH && drinkActive) {
    float diff = drinkStartWeight - currentWeight;

    if (diff > 3 && diff < 1500) {   // sanity limits
      Serial.print("DRANK: ");
      Serial.print(diff);
      Serial.println(" g");

      if (deviceConnected) {
        send_ble_value(diff);
      }
    } else {
      Serial.println("Ignored (noise/refill)");
    }

    drinkActive = false;
  }

  lastState = currentState;
}

// ===================== SETUP ========================
void setup() {
  Serial.begin(115200);
  pinMode(drink_button, INPUT_PULLUP);

  // HX711
  scale.begin(hx711_data_pin, hx711_clock_pin);
  delay(1000);

  // TARE
  for (int i = 0; i < avg_size; i++) {
    x0 += scale.read();
    delay(10);
  }
  x0 /= avg_size;


  Serial.println("Calibration done");

  // BLE
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

  Serial.println("BLE ready");
}

// ===================== LOOP =========================
void loop() {
  
  // Average HX711 reading
  long reading = 0;
  for (int i = 0; i < avg_size; i++) {
    reading += scale.read();
  }
  reading /= avg_size;

  // Convert to grams
  float ratio = float(reading - x0) / float(x1 - x0);
  float mass = (reading - x0) / SCALE_FACTOR;

  Serial.print("Mass: ");
  Serial.print(mass);
  Serial.println(" g");

  // Handle drink button
  handleDrinkButton(mass);

  // BLE reconnect handling
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
  }
  oldDeviceConnected = deviceConnected;

  delay(200);
}
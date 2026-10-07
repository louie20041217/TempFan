/*
 * TempFan — ESP32 + DHT11 Wi-Fi Fan Controller
 *
 * Hardware from the final project specification:
 *   DHT11 data -> GPIO 4, 2N2222 fan PWM base (through 1 kΩ) -> GPIO 18
 *   DC fan is protected by a 1N4007 flyback diode and powered from 5 V.
 *
 * Install the "DHT sensor library" (Adafruit) before uploading. Enter the
 * local Wi-Fi credentials and the LAN address of the computer running XAMPP.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

constexpr uint8_t DHT_PIN = 4;
constexpr uint8_t DHT_TYPE = DHT11;
constexpr uint8_t FAN_PWM_PIN = 18;
constexpr uint8_t PWM_CHANNEL = 0;
constexpr uint16_t PWM_FREQUENCY = 25000;
constexpr uint8_t PWM_RESOLUTION = 8;

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
// Replace the IP address with the XAMPP host's LAN address; do not use localhost.
const char* TELEMETRY_URL = "http://192.168.1.100/TempFan/php/readings.php";

DHT dht(DHT_PIN, DHT_TYPE);

float lowThresholdMax = 30.0;
float medThresholdMin = 31.0;
float medThresholdMax = 35.0;
int speedLowPercent = 30;
int speedMedPercent = 60;
int speedHighPercent = 100;

String controlMode = "Automatic";
int manualFanSpeed = 70;
int currentFanSpeed = 0;
float currentTemp = NAN;
float currentHumidity = NAN;
unsigned long lastTelemetryTime = 0;
constexpr unsigned long TELEMETRY_INTERVAL = 3000;

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  const unsigned long started = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - started < 15000) {
    delay(500);
    Serial.print('.');
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? " connected" : " unavailable");
}

int automaticSpeed(float temperature) {
  if (temperature <= lowThresholdMax) return speedLowPercent;
  if (temperature >= medThresholdMin && temperature <= medThresholdMax) return speedMedPercent;
  return speedHighPercent;
}

void setFanSpeed(int percent) {
  currentFanSpeed = constrain(percent, 0, 100);
  ledcWrite(PWM_CHANNEL, map(currentFanSpeed, 0, 100, 0, 255));
}

void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(TELEMETRY_URL);
  http.addHeader("Content-Type", "application/json");
  const String fanStatus = currentFanSpeed > 0 ? "ON" : "OFF";
  const String payload = "{\"temperature\":" + String(currentTemp, 1) +
    ",\"humidity\":" + String(currentHumidity, 1) +
    ",\"fanSpeed\":" + String(currentFanSpeed) +
    ",\"fanStatus\":\"" + fanStatus + "\"" +
    ",\"controlMode\":\"" + controlMode + "\"" +
    ",\"source\":\"ESP32\"}";

  const int responseCode = http.POST(payload);
  Serial.printf("Telemetry HTTP %d: %s\n", responseCode, payload.c_str());
  http.end();
}

void handleSerialCommands() {
  if (!Serial.available()) return;
  const String command = Serial.readStringUntil('\n');
  if (command == "SET_MODE:AUTO") controlMode = "Automatic";
  else if (command == "SET_MODE:MANUAL") controlMode = "Manual";
  else if (command.startsWith("SET_SPEED:")) {
    manualFanSpeed = constrain(command.substring(10).toInt(), 0, 100);
    controlMode = "Manual";
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  ledcSetup(PWM_CHANNEL, PWM_FREQUENCY, PWM_RESOLUTION);
  ledcAttachPin(FAN_PWM_PIN, PWM_CHANNEL);
  setFanSpeed(0);
  connectWiFi();
}

void loop() {
  connectWiFi();
  handleSerialCommands();

  const float temperature = dht.readTemperature();
  const float humidity = dht.readHumidity();
  if (!isnan(temperature) && !isnan(humidity)) {
    currentTemp = temperature;
    currentHumidity = humidity;
    setFanSpeed(controlMode == "Automatic" ? automaticSpeed(currentTemp) : manualFanSpeed);

    if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL) {
      sendTelemetry();
      lastTelemetryTime = millis();
    }
  } else {
    Serial.println("DHT11 read failed; check the sensor wiring.");
  }
  delay(2000); // DHT11 must not be polled faster than about once every 2 seconds.
}

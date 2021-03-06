#include <ArduinoWebsockets.h>
#include <ESP8266WiFi.h>

#include "config.h"

#define PIN_LED D4
#define PIN_STATUS D6
#define PIN_POWER D7
#define INTERVAL_SEND_STATUS 1000

using namespace websockets;

WebsocketsClient client;
unsigned long millisNextUpdateStatus = 0;

bool isPoweredOn() {
  return digitalRead(PIN_STATUS) == HIGH;
}

void powerOff() {  
  digitalWrite(PIN_POWER, LOW);
  delay(5000);
  digitalWrite(PIN_POWER, HIGH);
}

void powerOn() {
  digitalWrite(PIN_POWER, LOW);
  delay(1000);
  digitalWrite(PIN_POWER, HIGH);
}

void onMessageCallback(WebsocketsMessage message) {
    if(message.data() == "power-on" && !isPoweredOn()) {
      powerOn();
    }
    else if(message.data() == "power-off" && isPoweredOn()) {
      powerOff();
    }
}

void onEventsCallback(WebsocketsEvent event, String data) {
    if(event == WebsocketsEvent::ConnectionOpened) {
        client.send(String("authenticate ") + SECRET);
        digitalWrite(PIN_LED, HIGH);
    } else if(event == WebsocketsEvent::ConnectionClosed) {
        ESP.restart();
    }
}

void setup() {
    pinMode(PIN_STATUS, INPUT);
    pinMode(PIN_POWER, OUTPUT);
    digitalWrite(PIN_POWER, HIGH);
    pinMode(PIN_LED, OUTPUT);
    digitalWrite(PIN_LED, LOW);
    delay(500);
    WiFi.mode(WIFI_STA);
    WiFi.begin(SSID, WIFI_PASSWORD);
    while(WiFi.status() != WL_CONNECTED) {
        delay(1000);
    }
    client.onMessage(onMessageCallback);
    client.onEvent(onEventsCallback);
    client.setInsecure(); // Do not validate certificates
    while(!client.connect(WS_URL)) { /* Keep trying */ }
    digitalWrite(PIN_LED, HIGH);
}

void loop() {
    client.poll();
    if(millisNextUpdateStatus < millis()) {
        client.send(isPoweredOn() ? "powered-on" : "powered-off");
        millisNextUpdateStatus += INTERVAL_SEND_STATUS;
    }
}

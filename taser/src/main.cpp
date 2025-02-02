#include <Arduino.h>


const int relay = 2;


void setup() {

  Serial.begin(9600); // Start serial communication
  pinMode(relay, OUTPUT);
  pinMode(6, OUTPUT);
}

void loop() {

  if (Serial.available() > 0) {
    char command = Serial.read();
    switch (command) {
      case '1':
        digitalWrite(relay, HIGH);
        delay(5000);
        digitalWrite(relay, LOW);
        break;
      case '0':
        digitalWrite(relay, LOW);
        break;
    }
  }
}

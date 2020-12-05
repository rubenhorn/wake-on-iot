# Wake-On-IoT
💻 Laptop ➡ ☁ Cloud ➡ ESP8266 ➡🖥 Workstation  
Start your PC from anywhere using Heroku / Glitch and an ESP8266.

## ESP8266
### Dependencies
* [ArduinoWebsockets](https://github.com/gilmaimon/ArduinoWebsockets)

## Setup
1. Set the `SECRET` environment variable in the dashboard of your cloud provider
2. Deploy the Node application
3. Create `esp8266/config.h` based on `esp8266/template-config.h`
4. Install Arduino dependencies
5. Compile using and flash the microcontroller

## Usage
```
export URL=http://localhost:3000
export SECRET=my-secret
./power on
```
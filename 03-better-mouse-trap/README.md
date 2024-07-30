# Better Mouse Trap

**Warning: This project uses Sparrow, a Blues product that is no longer under active development. We are working on updating this project to the successors of Sparrow: [Notecard LoRa](https://blues.com/notecard-lora/) and the [LoRaWAN Starter Kit](https://shop.blues.com/products/blues-starter-kit-lorawan). In the meantime, if you would like assistance building a Better Mouse Trap feel free to reach out on [our community forum](https://discuss.blues.com/).**

A smarter mouse trap with SMS alerting.

Find the complete story in the detailed [Hackster.io writeup](https://www.hackster.io/hendersoncarlton/i-love-checking-on-mousetraps-said-no-one-ever-52c5e7).

![Mouse wearing a helmet grabbing cheese from a trap](images/banner.png)

_A Better Mousetrap_ is a humane mousetrap that will alert you with an SMS when
it has caught a mouse.

![Finished trap on a concrete floor](images/pxl_20221018_203442381_2HE5Zxfkng.jpg)

## You will need

### Parts

- [Victor M333 Humane Mouse Trap](https://www.amazon.com/gp/product/B004CMNWES)
- [Blues Starter Kit for LoRaWAN](https://shop.blues.com/products/blues-starter-kit-lorawan)
- Raspberry Pi Pico
- [PIR Sensor](https://www.adafruit.com/product/4871)
- USB A to micro USB cable
- [Clear Polycarbonate Sheet 1/16-in](https://www.amazon.com/gp/product/B07MQTDF4R)
- [M3-threaded Nylon Standoff Kit](https://www.amazon.com/gp/product/B07KP2ZFNJ)

### Tools

- Hand Drill
- 1/2 inch Drill Bit
- 1/8 inch Twist Drill

## Hardware Setup

### Modifying the Mousetrap

TODO: Figureing out the mounting is something you will need to figure out TJ!  I suspect that Sugru might be useful(https://www.amazon.com/Sugru-I000941-Moldable-Multi-Purpose-Creative/dp/B089WHQ52C)

This is built using a PIR sensor connected to a Raspberry Pi Pico.
To allow the PIR sensor to see into the trap, I cut a 1/2” hole in the lid of the Victor M333 Mousetrap. To
locate the Pico, notecarried and sensor board securely, I cut four 1/8” holes to receive M3-threaded
nylon standoffs.

![Side view of Victor trap surmounted by the motion sensor](images/nf3_mousetrap_(7)_Ggl9W9TOQ8.jpg)

The following connections need to be made to complete the hardware setup:

PIR Sensor:

* Pin 1 of the sensor to Pin 33 of the Pico (GND)
* Pin 2 of the sensor to Pin 34 of the Pico (GP28)
* Pin 3 of the sensor to Pin 36 of the Pico (3V3 Out)

The Notecarrier is connected via I2C as follows:.

* Notecarried GND to Pin 3 of the Pico (GND)
* Notecarrier SDA to  Pin 6 of the Pico (GP4)
* Notecarried SCL to Pin 7 of the Pico (GP5)

See the image below for the connections:

![Pico and Notecarrier B connections](images/Pico-Notecarrier.jpg)

Once you have programmed the Pico connect VMAIN on the Notecarrier to Pin 39 of the Pico (VSYS) to power it from the Notecarrier.  If you wish to leave this connection in place, you will need to use a protection diode or P-FET setup as described in [Section 4.5 of the Raspberry Pi Pico Datasheet](https://datasheets.raspberrypi.com/pico/pico-datasheet.pdf)

## Notehub Setup

Sign up for a free account on [notehub.io](https://notehub.io) and [create a new project](https://dev.blues.io/quickstart/notecard-quickstart/notecard-and-notecarrier-a/#set-up-notehub).

## LoRa Gateway Setup

Before you can use the Notecard LoRa you need to have a LoRaWAN gateway that is provisioned to The Things Network.  To make this easy you can use the [Blues Indoor LoRaWAN Gateway](https://shop.blues.com/products/blues-starter-kit-lorawan).  To get this set up follow the [setup instructions](https://dev.blues.io/lora/connecting-to-a-lorawan-gateway/)


## Pico Setup

Your Raspbery Pi Pico will need to have Micropython installed.  If it is not yet installed, follow the [installation instructions](https://micropython.org/download/RPI_PICO/) provided by MicroPython.

### MicroPython Code

The script that will run on the MCU is [main.py](main.py). It depends on [note-python](https://github.com/blues/note-python), a Python library for communicating with a Notecard.

#### note-python

To get the note-python files onto the MCU, use the [`setup_board.py`](setup_board.py) script. This uses the [`pyboard.py`](pyboard.py) script to communicate with the Raspberry Pi Pico. First, you must identify the MCU's serial port. On Linux, it'll typically be something like `/dev/ttyACM0`. You can run `ls /dev/ttyACM*` before and after plugging the board in to figure out the serial port's associated file. Once you have that, run `python setup_board.py <serial port>`, replacing `<serial port>` with your serial port. This script does a few things:

1. Clones note-python from GitHub.
2. Creates the `/lib` and `/lib/notecard` directories on the MCU.
3. Copies the `.py` files from `note-python/notecard` on your development machine to `/lib/notecard` on the MCU.
4. Lists the contents of `/lib/notecard` so you can verify that everything was copied over.

Note that for `pyboard.py` to work, you'll need to install [pyserial](https://pypi.org/project/pyserial/) with `pip install pyserial`, if you don't have it installed already.

#### Running `main.py`

Before running `main.py`, uncomment this line: `# product_uid = 'com.your-company:your-product-name'`. Replace `com.my-company.my-name:my-project` with the [ProductUID of the Notehub project](https://dev.blues.io/notehub/notehub-walkthrough/#finding-a-productuid) you created in [Notehub Setup](#notehub-setup).

Copy `main.py` over to the board with this command:

```
python pyboard.py -d <serial port> --no-soft-reset -f cp main.py :/
```

Make sure to replace `<serial port>` with your serial port. `main.py` will start running after boot up.

![View inside the trap showing underside of lid](images/nf3_mousetrap_(8)_gUpTQaXMpg.jpg)
![Sparrow Gateway wiring and logical data path from Lora Radio Signal to Sparrow essentials board, to qwiic i2c cable, to notecarrier, to notecard, to wifi](images/nf3_mousetrap_(13)_g4ofhDRGNm.jpg)


## SMS Alerts

Notehub doesn’t have native SMS alerts yet, but it does allow you to route messages [to any other cloud services or HTTPS API endpoint](https://dev.blues.io/guides-and-tutorials/routing-data-to-cloud/?&utm_source=github&utm_medium=web&utm_campaign=nf&utm_content=nf3) that your heart desires. I used Twilio, an inexpensive SMS service, to send message to my phone when there is motion in the trap.


TODO: The JSONata used before is from when there was no Twilio route.  Take a look at the JSONata in NF30 (../30-indoor-air-quality-and-gas-leak/jsonata/route.jsonata) For an alternative example that helps define different Notecards
 
Notehub has a dedicated route for the Twilio HTTP API so I followed the Blues [Twilio SMS Guide](https://dev.blues.io/guides-and-tutorials/twilio-sms-guide/?&utm_source=github&utm_medium=web&utm_campaign=nf&utm_content=nf3) and [modified the JSONata](mousetrap.jsonata) expression to tell me which mousetrap (Garage, Basement, etc.) saw motion based on the unique ID of the Notecard I affixed to each trap.

![Data path from Wi-Fi to Notehub.io and JSONata transformation into SMS format](images/nf3_mousetrap_(18)_sghXhszUbO.jpg)

## System Test

To trigger the PIR sensor, flip the trap upside down and back upright. You should see an event on [Notehub.io] and an SMS message on your phone.

![Notehub.io event screenshot](images/image_X1HU4mO9mN.jpg)

![Route to Twilio SMS Service](images/nf3_mousetrap_(19)_TOXG7lKQRu.jpg)

![Phone Screenshot of SMS](images/image_S2jSMIx7G8.jpg)

### Blues Community

We’d love to hear about you and your project on the [Blues Community Forum](https://discuss.blues.io/).

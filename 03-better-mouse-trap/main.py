from machine import I2C, Pin, Timer
import notecard 
from notecard import card, hub, note
import time

# Config
# productUID = "com.my-company.my-name:my-project"

pir_debounce_time=0
sendPIRChange = False

def sendMovement():
    rsp = note.add(nCard,file = "mouse.qo", body = {"movement": True}, port = 15, sync = True)
    print(rsp)

def pirCallback(pin):
    global sendPIRChange, pir_debounce_time
    if (time.ticks_ms()-pir_debounce_time) > 500:
        sendPIRChange=True
        pir_debounce_time=time.ticks_ms()

# Create I2C instance 
i2c=I2C(0, freq=400000)

# Connect to Notecard   
nCard = notecard.OpenI2C(i2c, 0, 0) 

# Set ProductUID 
hub.set(nCard, product=productUID, mode="minimum") # We use minimum so we can sync and reset PIR count together

# Setup templates
rsp = note.template(nCard, file="mouse.qo", body={"movement": True}, port = 15, compact = True)
print(rsp)

pir = Pin(22, Pin.IN, Pin.PULL_DOWN)

pir.irq(trigger=Pin.IRQ_RISING, handler=pirCallback)

while True:
    machine.disable_irq
    if sendPIRChange:
        print("Movement Detected")
        sendPIR = False
        sendMovement()
    machine.enable_irq
#    machine.lightsleep(60000)  # This should be uncommented, but with the current (1.23) version of micropython, it crashes USB Serial
                                # Uncomment when running without usb in use.
                                # https://github.com/orgs/micropython/discussions/14401

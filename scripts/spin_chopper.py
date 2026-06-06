import atexit
import signal
import sys
import time

from scservo_sdk import COMM_SUCCESS, PacketHandler, PortHandler

PORT = "/dev/tty.usbmodem5AB01796221"
MOTOR_ID = 1
BAUD = 1_000_000
SPEED = 3400  # signed, about ±3400 max; negative = reverse
ACCEL = 254  # 0 = instant, 254 = strongest ramp (use 254 for high speeds)

ADDR_MIN_ANGLE = 9
ADDR_MAX_ANGLE = 11
ADDR_MODE = 33
ADDR_TORQUE = 40
ADDR_GOAL_ACC = 41
ADDR_GOAL_SPEED = 46
ADDR_LOCK = 55


def signed_speed(value: int) -> int:
    if value >= 0:
        return value & 0x7FFF
    return (-value & 0x7FFF) | 0x8000


port = PortHandler(PORT)
pkt = PacketHandler(0)
halted = False


def halt() -> None:
    global halted
    if halted:
        return
    halted = True
    try:
        pkt.write2ByteTxRx(port, MOTOR_ID, ADDR_GOAL_SPEED, 0)
        pkt.write1ByteTxRx(port, MOTOR_ID, ADDR_TORQUE, 0)
    except Exception:
        pass
    try:
        port.closePort()
    except Exception:
        pass


atexit.register(halt)


def on_stop(*_) -> None:
    halt()


signal.signal(signal.SIGINT, on_stop)
signal.signal(signal.SIGTERM, on_stop)

if not port.openPort() or not port.setBaudRate(BAUD):
    sys.exit(f"cannot open {PORT}")

_, comm, _ = pkt.ping(port, MOTOR_ID)
if comm != COMM_SUCCESS:
    sys.exit(f"no response from servo {MOTOR_ID}")

try:
    # wheel mode: torque off, unlock EEPROM, angle limits 0/0, mode=1, lock
    pkt.write1ByteTxRx(port, MOTOR_ID, ADDR_TORQUE, 0)
    pkt.write1ByteTxOnly(port, MOTOR_ID, ADDR_LOCK, 0)
    time.sleep(0.05)
    pkt.write2ByteTxOnly(port, MOTOR_ID, ADDR_MIN_ANGLE, 0)
    pkt.write2ByteTxOnly(port, MOTOR_ID, ADDR_MAX_ANGLE, 0)
    pkt.write1ByteTxOnly(port, MOTOR_ID, ADDR_MODE, 1)
    time.sleep(0.05)
    pkt.write1ByteTxOnly(port, MOTOR_ID, ADDR_LOCK, 1)
    time.sleep(0.1)

    pkt.write1ByteTxRx(port, MOTOR_ID, ADDR_GOAL_ACC, ACCEL)
    pkt.write1ByteTxRx(port, MOTOR_ID, ADDR_TORQUE, 1)

    # ramp up to high speeds so the servo does not stall on a hard step
    target = signed_speed(SPEED)
    if abs(SPEED) > 1200:
        pkt.write2ByteTxRx(
            port, MOTOR_ID, ADDR_GOAL_SPEED, signed_speed(1000 if SPEED > 0 else -1000)
        )
        time.sleep(0.3)
    pkt.write2ByteTxRx(port, MOTOR_ID, ADDR_GOAL_SPEED, target)

    print(f"spinning (speed={SPEED}, accel={ACCEL}), ctrl+c to stop")
    while not halted:
        time.sleep(0.1)
except KeyboardInterrupt:
    halt()

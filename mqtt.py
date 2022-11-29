# publisher

import time
import paho.mqtt.client as mqtt
import circuit  # 초음파 센서 입력 모듈 임포트
import mycamera  # 카메라로 사진 보내기

flag = False


def on_connect(client, userdata, flag, rc):
    client.subscribe("facerecognition", qos=0)


def on_message(client, userdata, msg):
    global flag
    command = msg.payload.decode("utf-8")
    if command == "action":
        flag = True


broker_ip = "localhost"  # 현재 이 컴퓨터를 브로커로 설정

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect(broker_ip, 1883)
client.loop_start()

while (True):
    distance = circuit.measureDistance()     # 초음파 값
    temp = circuit.getTemperature()          # 온도 값
    client.publish("ultrasonic", distance, qos=0)
    client.publish("temperature", temp, qos=0)
    if (10 < distance <= 50):     # 거리가 50보다 작을때는 화면만 송출 시작, 10이하일때는 온도 측정
        print("누군가 접근중...")
        imageFileName = mycamera.takePicture()  # 카메라 사진 촬영
        client.publish("image", imageFileName, qos=0)
        circuit.controlLED(onOff=0)
    elif (distance <= 10 and temp < 38):    # 출입 허가
        print("출입 가능  (온도 : %s도)" % round(temp, 2))
        imageFileName = mycamera.takePicture()  # 카메라 사진 촬영
        client.publish("image", imageFileName, qos=0)
        circuit.controlLED(onOff=1)
        flag = False
    elif (distance <= 10 and temp >= 38):     # 출입 불가
        print("출입 불가  (온도 : %s도)" % round(temp, 2))
        imageFileName = mycamera.takePicture()  # 카메라 사진 촬영
        client.publish("image", imageFileName, qos=0)
        circuit.controlLED(onOff=0)
        flag = False
    else:             # 거리가 50이상 일때는 접근 없음으로 간주, 새 화면 출력 X
        print("접근 없음... ")
    time.sleep(0.5)            # 0.5 휴식
    circuit.controlLED(onOff=0)

client.loop_stop()
client.disconnect()

# Flask server imports
from flask import Flask, jsonify, send_from_directory, render_template
from flask_cors import CORS
import json

# For IMU
import board
import busio
from adafruit_bno08x.i2c import BNO08X_I2C
import adafruit_bno08x
from adafruit_bno08x import BNO_REPORT_ROTATION_VECTOR
from adafruit_bno08x import BNO_REPORT_GAME_ROTATION_VECTOR

# For gestures
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

i2c = busio.I2C(board.SCL, board.SDA)
bno = BNO08X_I2C(i2c)
bno.enable_feature(BNO_REPORT_GAME_ROTATION_VECTOR)

#g.imu_x = 0
imu_y = 0
imu_z = 0
imu_w = 0

app = Flask(__name__,
            static_url_path='',
            static_folder='../static')
app.config['x'] = 0
CORS(app)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/static/<path:path>")
def webglfun(path):
    #print(path)
    return send_from_directory('static',path)

@app.route("/getimu")
def get_imu():
    # imu_x = app.config['x']

    # app.config['x'] = imu_x +  0.1
    # print(imu_x)
    # fake_str = '{},{},{}'.format(imu_x,imu_y,imu_z)
    # fake_json = json.dumps(fake_str).encode('utf-8')
    # print(fake_json)
    # return json.dumps(fake_str).encode('utf-8')

    quat_i, quat_j, quat_k, quat_real = bno.game_quaternion
    # game_quaternion = {
    #     'x': quat_i,
    #     'y': quat_j,
    #     'z': quat_k,
    #     'w': quat_real
    # }
    # print(game_quaternion)


    return json.dumps(bno.game_quaternion).encode('utf-8')


base_options = python.BaseOptions(model_asset_path='gesture_recognizer.task')
options = vision.GestureRecognizerOptions(base_options=base_options)
recognizer = vision.GestureRecognizer.create_from_options(options)

# vidcap = cv2.VideoCapture("http://192.168.0.1:8000/stream")
vidcap = cv2.VideoCapture(0)

@app.route("/getGesture")
def get_gesture():

    top_gesture = "None"

    if vidcap.isOpened():
        ret, frame = vidcap.read()
        cv2.imshow("frame", frame)
        if ret:
            image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)
            recognition_result = recognizer.recognize(image)
            if recognition_result.gestures:
                top_gesture = recognition_result.gestures[0][0].category_name
        else:
            print("Failed to capture frame")
    else:
        print("cannot open camera")

    retString = '{}'.format(top_gesture)
    return json.dumps(retString).encode('utf-8')

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
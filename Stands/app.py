from flask import Flask, jsonify, send_from_directory
import requests
import os

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

print("RUNNING APP FROM:", __file__)
print("BASE DIR:", BASE_DIR)
print(
    "STANDINGS EXISTS:",
    os.path.exists(os.path.join(BASE_DIR, "Standings.html"))
)

API_URL = "https://formula-telemetry.com/api/api/championship"


# Home page
@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "Standings.html")


# Championship API
@app.route("/api/championship")
def championship():
    response = requests.get(API_URL)
    return jsonify(response.json())


# CSS, JS, AVIF and other files
@app.route("/<path:filename>")
def files(filename):
    return send_from_directory(BASE_DIR, filename)


if __name__ == "__main__":
    app.run(debug=True)
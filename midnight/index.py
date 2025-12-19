from flask import Flask, request, jsonify, render_template
import random, time
from Crypto.Util.number import *

flag = open("/home/blacktea/flag.txt", "rb").read()

p, q = getPrime(512), getPrime(512)
n = p * q
phi = (p - 1) * (q - 1)

random.seed(int(time.time()))

def midnight(msg: bytes) -> str:
    e = random.randint(1, n)
    while GCD(e, phi) != 1:
        e = random.randint(1, n)

    c = pow(bytes_to_long(msg), e, n)
    return long_to_bytes(c).hex()

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/public')
def public():
    return jsonify({
        "n": str(n)
    })

@app.route('/api/encrypt/flag', methods=['POST'])
def encrypt_flag():
    return jsonify({
        "ciphertext": midnight(flag)
    })

@app.route('/api/encrypt/message', methods=['POST'])
def encrypt_message():
    data = request.json
    try:
        msg = bytes.fromhex(data['message'])
        return jsonify({
            "ciphertext": midnight(msg)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/source')
def source():
    source_code = open(__file__, "r").read()
    return source_code 

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)

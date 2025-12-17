from flask import Flask, render_template, request, jsonify
import os
import subprocess

app = Flask(__name__)

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/healthcheck', methods=['GET'])
def healthcheck():
    host = request.args.get('host', 'localhost')
    
    try:
        # Using ping to check if host is reachable
        cmd = f"ping -c 1 {host}"
        output = subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT, text=True)
        status = "UP" if "1 received" in output else "DOWN"
        
        return jsonify({
            "status": status,
            "host": host,
            "response_time": output.split("time=")[1].split(" ")[0] if "time=" in output else "N/A",
            "output": output
        })
    except Exception as e:
        return jsonify({
            "status": "ERROR",
            "host": host,
            "error": str(e)
        }), 500

@app.route('/api/system_health')
def system_health():
    try:
        try:
            cpu_usage = subprocess.check_output("top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'", shell=True, text=True).strip()
            memory_info = subprocess.check_output("free -k | grep Mem:", shell=True, text=True).strip().split()
            free_memory = memory_info[3] if len(memory_info) > 3 else "N/A"
            total_memory = memory_info[1] if len(memory_info) > 1 else "N/A"
            uptime = subprocess.check_output("uptime -p", shell=True, text=True).strip()
        except:
            cpu_usage = "N/A"
            free_memory = "N/A"
            total_memory = "N/A"
            uptime = "N/A"
        
        return jsonify({
            "cpu_usage_percent": cpu_usage,
            "free_memory_kb": free_memory,
            "total_memory_kb": total_memory,
            "uptime": uptime
        })
    except Exception as e:
        return jsonify({
            "status": "ERROR",
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000) 
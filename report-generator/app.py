from flask import Flask, render_template, request, redirect, session, jsonify
from jinja2 import Template
import os
import requests
import json
from datetime import datetime

# todo: use sandboxed environment to prevent vulnerability
from jinja2.sandbox import SandboxedEnvironment

with open("data.json") as f:
    DUMMY_DB = json.load(f)["patients"]

app = Flask(__name__)
app_root = '/report-generator'
app.secret_key = 'hospital_reports_secret_key'
app.config['APPLICATION_ROOT'] = '/report-generator'

# Configuration
PATIENT_PORTAL_URL = os.environ.get('PATIENT_PORTAL_URL', 'http://localhost:5001/')
API_KEY = 'internal_hospital_api_key'

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route(f'{app_root}/')
def back_to_index():
    return redirect("/")

@app.route(f'{app_root}/reports')
def reports():
    return render_template('reports.html')

@app.route(f'{app_root}/standard_report', methods=['GET', 'POST'])
def standard_report():
    if request.method == 'POST':
        patient_id = request.form['patient_id']
        report_type = request.form['report_type']
        
        # Get patient data from the Patient Portal API
        patient_data = get_patient_data(patient_id)
        if not patient_data:
            return render_template('error.html', message="Patient not found")
        
        # Process report based on type
        if report_type == 'medical_summary':
            return render_template('reports/medical_summary.html', patient=patient_data, current_time=datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        elif report_type == 'insurance':
            current_dt = datetime.now()
            return render_template('reports/insurance_report.html', 
                                 patient=patient_data, 
                                 current_time=current_dt.strftime('%Y-%m-%d %H:%M:%S'),
                                 current_date=current_dt.strftime('%Y-%m-%d'),
                                 current_date_short=current_dt.strftime('%Y%m%d'))
        else:
            return render_template('error.html', message="Invalid report type")
    
    return render_template('standard_report_form.html')

@app.route(f'{app_root}/custom_report', methods=['GET', 'POST'])
def custom_report():
    if request.method == 'POST':
        patient_id = request.form['patient_id']
        template_content = request.form['template_content']
        
        # Get patient data from the Patient Portal API
        patient_data = get_patient_data(patient_id)
        if not patient_data:
            return render_template('error.html', message="Patient not found")
        
        template = Template(template_content)
        rendered_report = template.render(**patient_data)
        
        return render_template('report_output.html', report=rendered_report)
    
    return render_template('custom_report_form.html')

def get_patient_data(patient_id):
    for patient in DUMMY_DB:
        if str(patient["id"]) == str(patient_id):
            return patient
    return None

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001) 
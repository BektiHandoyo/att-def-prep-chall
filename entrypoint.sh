#!/bin/bash
set -e

echo "[+] Booting full server environment"

# blacktea services
su - blacktea -c "
cd /home/blacktea/encryptor && ./start.sh &
cd /home/blacktea/healthcheck && ./start.sh &
cd /home/blacktea/midnight && ./start.sh &
"

# svcuser services
su - svcuser -c "
cd /home/svcuser/report-generator && ./start.sh &
cd /home/svcuser/shellrunner && ./start.sh &
"

echo "[+] Server is up"
tail -f /dev/null